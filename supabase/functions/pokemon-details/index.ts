/* eslint-disable no-console -- Logging in edge functions aids observability during development */
import { config, handleOptions, jsonResponse } from "../_shared/config.ts";
import { CACHE_TTL_MS, MAX_MOVES_TO_CACHE, MOVES_CACHE_TTL_MS } from "../_shared/constants.ts";
import {
  extractResourceId,
  fetchEvolutionChain,
  fetchEvolutionChainByUrl,
  fetchMove,
  fetchPokemonDetails,
  fetchPokemonSpecies,
  getPokemonSprite,
  type EvolutionChain,
  type MoveDetail,
  type PokemonDetail,
  type PokemonMoveEntry,
  type PokemonSpecies,
} from "../_shared/pokeapi.ts";
import { generationRegionMap } from "../_shared/regions.ts";
import { supabaseAdminClient } from "../_shared/supabase-client.ts";
import type { MoveCacheRow, MoveSummary, PokemonCachePayload, PokemonCacheRow } from "../_shared/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const identifier = url.searchParams.get("identifier")?.trim();

  if (!identifier) {
    return jsonResponse({ error: "Missing identifier query parameter" }, { status: 400 });
  }

  try {
    if (config.useMock) {
      return jsonResponse(await handleMock(identifier));
    }

    return jsonResponse(await handleWithCache(identifier));
  } catch (error) {
    console.error("pokemon-details error", error);
    return jsonResponse(
      {
        error: "Failed to fetch Pokemon details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

async function handleMock(identifier: string) {
  const detail = await fetchPokemonDetails(identifier);
  const species = await fetchPokemonSpecies((detail as PokemonDetail).id);

  return {
    source: "mock",
    meta: {
      refreshed: true,
      cacheTtlMs: CACHE_TTL_MS,
      movesCached: 0,
    },
    data: {
      summary: {
        pokemonId: (detail as PokemonDetail).id,
        name: (detail as PokemonDetail).name,
        types: (detail as PokemonDetail).types?.map((type) => type.type.name) ?? [],
        generation: species?.generation?.name ?? null,
        region: species?.generation?.name ? (generationRegionMap[species.generation.name] ?? null) : null,
        spriteUrl: getPokemonSprite(detail as PokemonDetail),
        cachedAt: new Date().toISOString(),
      },
      pokemon: detail,
      species,
      evolutionChain: null,
      moves: [] as MoveSummary[],
    },
  };
}

async function handleWithCache(identifier: string) {
  const normalized = identifier.toLowerCase();
  const numericId = Number(normalized);
  const isNumeric = !Number.isNaN(numericId);

  let cachedRow: PokemonCacheRow | null = null;

  if (isNumeric) {
    cachedRow = await getCacheRowBy("pokemon_id", numericId);
  }

  if (!cachedRow) {
    cachedRow = await getCacheRowBy("name", normalized);
  }

  let payload = parseCachePayload(cachedRow?.payload);
  const stale =
    !cachedRow || !payload || isCacheExpired(cachedRow.cached_at, CACHE_TTL_MS) || !isPayloadEnriched(payload);

  let refreshed = false;
  if (stale) {
    const hydrated = await hydratePokemonDetail(identifier, cachedRow);
    cachedRow = hydrated;
    payload = parseCachePayload(hydrated.payload);
    refreshed = true;
  }

  if (!cachedRow || !payload) {
    throw new Error("Failed to resolve Pokemon detail payload");
  }

  const summary = mapCacheRowToSummary(cachedRow, payload.pokemon);

  return {
    source: "cache",
    meta: {
      refreshed,
      cacheTtlMs: CACHE_TTL_MS,
      movesCached: payload.moves?.length ?? 0,
    },
    data: {
      summary,
      pokemon: payload.pokemon,
      species: payload.species ?? null,
      evolutionChain: payload.evolutionChain ?? null,
      moves: payload.moves ?? [],
    },
  };
}

async function getCacheRowBy(column: "pokemon_id" | "name", value: number | string) {
  const { data, error } = await supabaseAdminClient
    .from("pokemon_cache")
    .select("*")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

async function hydratePokemonDetail(identifier: string, existingRow: PokemonCacheRow | null) {
  const detail = await fetchPokemonDetails(identifier);
  const species = await fetchPokemonSpecies(detail.id);

  const evolutionChain = await resolveEvolutionChain(species);

  const moveEntries = detail.moves ?? [];
  const moveSummaries = await ensureMoveSummaries(moveEntries);

  const payload: PokemonCachePayload = {
    pokemon: detail,
    species,
    evolutionChain,
    moves: moveSummaries,
    enrichedAt: new Date().toISOString(),
  };

  const record = buildCacheRecord(detail, species, payload);

  const { error: upsertError } = await supabaseAdminClient.from("pokemon_cache").upsert(
    [
      {
        pokemon_id: record.pokemon_id,
        name: record.name,
        types: record.types,
        generation: record.generation,
        region: record.region,
        payload: record.payload,
        cached_at: record.cached_at,
      },
    ],
    { onConflict: "pokemon_id" }
  );

  if (upsertError) {
    throw upsertError;
  }

  return record;
}

async function resolveEvolutionChain(species: PokemonSpecies | null): Promise<EvolutionChain | null> {
  if (!species) {
    return null;
  }

  const chainUrl = species.evolution_chain?.url ?? null;
  if (chainUrl) {
    try {
      return await fetchEvolutionChainByUrl(chainUrl);
    } catch (error) {
      console.warn("Failed to fetch evolution chain by URL", error);
    }
  }

  try {
    return await fetchEvolutionChain(species.id);
  } catch (error) {
    console.warn("Failed to fetch evolution chain by id", error);
    return null;
  }
}

async function ensureMoveSummaries(moves: PokemonMoveEntry[]): Promise<MoveSummary[]> {
  const limited = moves.slice(0, MAX_MOVES_TO_CACHE);
  const moveIds = limited
    .map((entry) => extractResourceId(entry.move?.url, "move"))
    .filter((value): value is number => value !== null);

  if (moveIds.length === 0) {
    return [];
  }

  const { data: cachedMoves, error: cacheError } = await supabaseAdminClient
    .from("moves_cache")
    .select("*")
    .in("move_id", moveIds);

  if (cacheError) {
    throw cacheError;
  }

  const moveMap = new Map<number, MoveCacheRow>();
  cachedMoves?.forEach((row) => moveMap.set(row.move_id, row));

  const staleMoves: number[] = [];
  moveIds.forEach((id) => {
    const cached = moveMap.get(id);
    if (!cached || isCacheExpired(cached.cached_at, MOVES_CACHE_TTL_MS)) {
      staleMoves.push(id);
    }
  });

  if (staleMoves.length > 0) {
    const refreshed = await fetchMoveDetails(staleMoves);
    const upsertPayload = refreshed.map((move) => ({
      move_id: move.id,
      name: move.name,
      type: move.type?.name ?? null,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      generation: move.generation?.name ?? null,
      payload: move,
      cached_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabaseAdminClient.from("moves_cache").upsert(upsertPayload, {
      onConflict: "move_id",
    });

    if (upsertError) {
      throw upsertError;
    }

    upsertPayload.forEach((row) => {
      moveMap.set(row.move_id, row as unknown as MoveCacheRow);
    });
  }

  return limited
    .map((entry) => {
      const moveId = extractResourceId(entry.move?.url, "move");
      if (!moveId) return null;
      const row = moveMap.get(moveId);
      if (!row) return null;
      return buildMoveSummary(row);
    })
    .filter((summary): summary is MoveSummary => summary !== null);
}

async function fetchMoveDetails(ids: number[]) {
  return await Promise.all(ids.map((id) => fetchMove(id)));
}

function buildCacheRecord(
  detail: PokemonDetail,
  species: PokemonSpecies | null,
  payload: PokemonCachePayload
): PokemonCacheRow {
  const generationName = species?.generation?.name ?? null;
  const region = generationName ? (generationRegionMap[generationName] ?? null) : null;

  return {
    pokemon_id: detail.id,
    name: detail.name,
    types: detail.types.map((entry) => entry.type.name),
    generation: generationName,
    region,
    payload,
    cached_at: new Date().toISOString(),
  };
}

function buildMoveSummary(row: MoveCacheRow): MoveSummary | null {
  const payload = row.payload as MoveDetail | undefined;
  return {
    moveId: row.move_id,
    name: row.name,
    type: row.type,
    power: row.power,
    accuracy: row.accuracy,
    pp: row.pp,
    generation: row.generation,
    damageClass: payload?.damage_class?.name ?? null,
    priority: payload?.priority ?? null,
    cachedAt: row.cached_at,
  };
}

function parseCachePayload(payload: unknown): PokemonCachePayload | null {
  if (payload && typeof payload === "object" && "pokemon" in payload) {
    return payload as PokemonCachePayload;
  }
  return null;
}

function isCacheExpired(timestamp: string, ttl: number) {
  return new Date(timestamp).getTime() < Date.now() - ttl;
}

function isPayloadEnriched(payload: PokemonCachePayload | null) {
  if (!payload) return false;
  return Boolean(payload.enrichedAt);
}

function mapCacheRowToSummary(row: PokemonCacheRow, detail: PokemonDetail) {
  return {
    pokemonId: row.pokemon_id,
    name: row.name,
    types: row.types,
    generation: row.generation,
    region: row.region,
    spriteUrl: getPokemonSprite(detail),
    cachedAt: row.cached_at,
  };
}
