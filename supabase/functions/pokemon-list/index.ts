/* eslint-disable no-console -- Logging in edge functions aids observability during development */
import { config, handleOptions, jsonResponse } from "../_shared/config.ts";
import { CACHE_TTL_MS } from "../_shared/constants.ts";
import { fetchPokemonList } from "../_shared/pokeapi.ts";
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

  try {
    if (config.useMock) {
      return handleMockResponse(limit, offset);
    }

    const response = await handleCachedResponse(limit, offset);
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

function buildPaginatedPayload<T>(total: number, limit: number, offset: number, items: T[]) {
  return {
    items,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    total,
    hasNext: offset + limit < total,
  };
}
