/* eslint-disable no-console -- Logging in edge functions aids observability during development */
import { config, handleOptions, jsonResponse } from "../_shared/config.ts";
import { CACHE_TTL_MS } from "../_shared/constants.ts";
import { fetchPokemonDetails, fetchPokemonList } from "../_shared/pokeapi.ts";
import { supabaseAdminClient } from "../_shared/supabase-client.ts";
import type { PokemonCacheRow } from "../_shared/types.ts";
import {
  fetchAndRefreshPokemonSummaries,
  mapCacheRowToSummary,
  parsePokemonPayload,
} from "../_shared/pokemon-cache.ts";
import { extractResourceId } from "../_shared/pokeapi.ts";

const MAX_LIMIT = 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const limit = sanitizeLimit(url.searchParams.get("limit"));
  const offset = sanitizeOffset(url.searchParams.get("offset"));
  const search = sanitizeSearch(url.searchParams.get("search"));
  const types = sanitizeMulti(url.searchParams.getAll("type"));
  const generation = sanitizeSingle(url.searchParams.get("generation"));
  const region = sanitizeSingle(url.searchParams.get("region"));

  try {
    if (config.useMock) {
      return handleMockResponse(limit, offset);
    }

    const hasFilters = Boolean(search || types.length > 0 || generation || region);

    const response = hasFilters
      ? await handleFilteredResponse({ limit, offset, search, types, generation, region })
      : await handleCachedResponse(limit, offset);
    return jsonResponse(response);
  } catch (error) {
    console.error("pokemon-list error", error);
    return jsonResponse(
      {
        error: "Failed to fetch Pokemon list",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

function sanitizeLimit(value: string | null) {
  const parsed = Number(value ?? "20");
  if (Number.isNaN(parsed) || parsed <= 0) return 20;
  return Math.min(parsed, MAX_LIMIT);
}

function sanitizeOffset(value: string | null) {
  const parsed = Number(value ?? "0");
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function sanitizeSearch(value: string | null) {
  if (!value) return "";
  return value.trim().toLowerCase().slice(0, 100);
}

function sanitizeSingle(value: string | null) {
  if (!value) return "";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === "all") return "";
  return trimmed.slice(0, 60);
}

function sanitizeMulti(values: string[]) {
  return values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value && value !== "all")
    .map((value) => value.slice(0, 40));
}

async function handleMockResponse(limit: number, offset: number) {
  const list = await fetchPokemonList({ limit, offset });
  const now = new Date().toISOString();

  const items = list.results.map((result, index) => {
    const pokemonId = extractResourceId(result.url, "pokemon") ?? offset + index + 1;
    return {
      pokemonId,
      name: result.name,
      types: [],
      generation: null,
      region: null,
      spriteUrl: null,
      cachedAt: now,
    };
  });

  return {
    source: "mock",
    meta: {
      refreshedCount: 0,
      refreshedIds: [] as number[],
      cacheTtlMs: CACHE_TTL_MS,
    },
    data: buildPaginatedPayload(list.count, limit, offset, items),
  };
}

async function handleCachedResponse(limit: number, offset: number) {
  const list = await fetchPokemonList({ limit, offset });
  const ids = list.results
    .map((item) => extractResourceId(item.url, "pokemon"))
    .filter((value): value is number => value !== null);

  if (ids.length === 0) {
    return {
      source: "cache",
      meta: {
        refreshedCount: 0,
        refreshedIds: [] as number[],
        cacheTtlMs: CACHE_TTL_MS,
      },
      data: buildPaginatedPayload(list.count, limit, offset, []),
    };
  }

  const { data: cachedRows, error: cacheError } = await supabaseAdminClient
    .from("pokemon_cache")
    .select("*")
    .in("pokemon_id", ids);

  if (cacheError) {
    throw cacheError;
  }

  const cacheMap = new Map<number, PokemonCacheRow>();
  cachedRows?.forEach((row) => cacheMap.set(row.pokemon_id, row));

  const staleCutoff = Date.now() - CACHE_TTL_MS;
  const toRefresh: number[] = [];

  ids.forEach((id) => {
    const cached = cacheMap.get(id);
    if (!cached) {
      toRefresh.push(id);
      return;
    }

    const cachedAt = new Date(cached.cached_at).getTime();
    if (cachedAt < staleCutoff) {
      toRefresh.push(id);
    }
  });

  let refreshedIds: number[] = [];
  if (toRefresh.length > 0) {
    const refreshedRecords = await fetchAndRefreshPokemonSummaries(toRefresh, cacheMap);
    refreshedIds = refreshedRecords.map((record) => record.pokemon_id);

    refreshedRecords.forEach((record) => {
      cacheMap.set(record.pokemon_id, record);
    });
  }

  const items = ids
    .map((id) => cacheMap.get(id))
    .filter((row): row is PokemonCacheRow => Boolean(row))
    .map((row) => mapCacheRowToSummary(row));

  return {
    source: "cache",
    meta: {
      refreshedCount: refreshedIds.length,
      refreshedIds,
      cacheTtlMs: CACHE_TTL_MS,
    },
    data: buildPaginatedPayload(list.count, limit, offset, items),
  };
}

async function handleFilteredResponse({
  limit,
  offset,
  search,
  types,
  generation,
  region,
}: {
  limit: number;
  offset: number;
  search: string;
  types: string[];
  generation: string;
  region: string;
}) {
  const from = offset;
  const to = Math.max(offset + limit - 1, offset);

  let query = supabaseAdminClient
    .from("pokemon_cache")
    .select("*", { count: "exact" })
    .order("pokemon_id", { ascending: true })
    .range(from, to);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (types.length > 0) {
    query = query.contains("types", types);
  }

  if (generation) {
    query = query.eq("generation", generation);
  }

  if (region) {
    query = query.eq("region", region);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    throw error;
  }

  let results = rows ?? [];
  const staleCutoff = Date.now() - CACHE_TTL_MS;
  const toRefresh = results
    .filter((row) => new Date(row.cached_at).getTime() < staleCutoff)
    .map((row) => row.pokemon_id);

  if (toRefresh.length > 0) {
    const refreshed = await fetchAndRefreshPokemonSummaries(toRefresh);
    const refreshedMap = new Map(refreshed.map((row) => [row.pokemon_id, row]));
    results = results.map((row) => refreshedMap.get(row.pokemon_id) ?? row);
  }

  let total = count ?? results.length;

  if (results.length === 0 && offset === 0 && search) {
    try {
      const detail = await fetchPokemonDetails(search);
      const refreshed = await fetchAndRefreshPokemonSummaries([detail.id]);
      results = refreshed;
      total = refreshed.length;
    } catch (fallbackError) {
      console.warn("pokemon-list search fallback failed", fallbackError);
    }
  }

  const items = results.map((row) => mapCacheRowToSummary(row));

  return {
    source: "cache",
    meta: {
      refreshedCount: toRefresh.length,
      refreshedIds: toRefresh,
      cacheTtlMs: CACHE_TTL_MS,
      search,
      filters: {
        types,
        generation,
        region,
      },
    },
    data: buildPaginatedPayload(total, limit, offset, items),
  };
}

function buildPaginatedPayload<T>(total: number, limit: number, offset: number, items: T[]) {
  return {
    items,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    total,
    hasNext: offset + limit < total,
  };
}
