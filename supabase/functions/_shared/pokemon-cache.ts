/* eslint-disable no-console -- shared cache utilities log low level warnings */
import { CACHE_TTL_MS, MAX_MOVES_TO_CACHE, MOVES_CACHE_TTL_MS } from "./constants.ts";
import { generationRegionMap } from "./regions.ts";
import { supabaseAdminClient } from "./supabase-client.ts";
import type { MoveCacheRow, MoveSummary, PokemonCachePayload, PokemonCacheRow } from "./types.ts";
import {
  extractResourceId,
  fetchEvolutionChain,
  fetchEvolutionChainByUrl,
  fetchMove,
  fetchPokemonDetails,
  fetchPokemonList,
  fetchPokemonSpecies,
  getPokemonSprite,
  type EvolutionChain,
  type MoveDetail,
  type PokemonDetail,
  type PokemonMoveEntry,
  type PokemonSpecies,
} from "./pokeapi.ts";

export async function fetchAndRefreshPokemonSummaries(ids: number[], existing?: Map<number, PokemonCacheRow>) {
  const records: PokemonCacheRow[] = [];

  for (const id of ids) {
    const [detail, species] = await Promise.all([fetchPokemonDetails(String(id)), fetchPokemonSpecies(String(id))]);
    const previousPayload = existing ? parsePokemonPayload(existing.get(id)?.payload) : null;
    const record = buildPokemonCacheRecord(detail, species, {
      payload: {
        pokemon: detail,
        species,
        evolutionChain: previousPayload?.evolutionChain ?? null,
        moves: previousPayload?.moves,
        enrichedAt: previousPayload?.enrichedAt,
      },
    });
    records.push(record);
  }

  if (records.length === 0) {
    return records;
  }

  const { error } = await supabaseAdminClient.from("pokemon_cache").upsert(
    records.map((record) => ({
      pokemon_id: record.pokemon_id,
      name: record.name,
      types: record.types,
      generation: record.generation,
      region: record.region,
      payload: record.payload,
      cached_at: record.cached_at,
    })),
    { onConflict: "pokemon_id" }
  );

  if (error) {
    throw error;
  }

  return records;
}

export async function hydratePokemonDetail(identifier: string, existingRow: PokemonCacheRow | null) {
  const detail = await fetchPokemonDetails(identifier);
  const species = await fetchPokemonSpecies(detail.id);
  const evolutionChain = await resolveEvolutionChain(species);
  const moveSummaries = await ensureMoveSummaries(detail.moves ?? []);

  const payload: PokemonCachePayload = {
    pokemon: detail,
    species,
    evolutionChain,
    moves: moveSummaries,
    enrichedAt: new Date().toISOString(),
  };

  const record = buildPokemonCacheRecord(detail, species, { payload });

  const { error } = await supabaseAdminClient.from("pokemon_cache").upsert(
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

  if (error) {
    throw error;
  }

  return {
    record,
    payload,
    refreshed: shouldRefresh(existingRow, payload),
  };
}

function shouldRefresh(existingRow: PokemonCacheRow | null, payload: PokemonCachePayload) {
  if (!existingRow) return true;
  const existingPayload = parsePokemonPayload(existingRow.payload);
  if (!existingPayload) return true;
  return !existingPayload.enrichedAt || existingPayload.enrichedAt < payload.enrichedAt!;
}

export async function fetchAndRefreshMoves(moveIds: number[]) {
  if (moveIds.length === 0) {
    return [];
  }

  const results = await Promise.all(moveIds.map((id) => fetchMove(id)));

  const rows = results.map((move) => ({
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

  const { error } = await supabaseAdminClient.from("moves_cache").upsert(rows, { onConflict: "move_id" });
  if (error) {
    throw error;
  }

  return rows;
}

export async function getPokemonCacheRowBy(column: "pokemon_id" | "name", value: number | string) {
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

async function resolveEvolutionChain(species: PokemonSpecies | null): Promise<EvolutionChain | null> {
  if (!species) return null;

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
    const refreshed = await fetchAndRefreshMoves(staleMoves);
    refreshed.forEach((row) => {
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

export function buildPokemonCacheRecord(
  detail: PokemonDetail,
  species: PokemonSpecies | null,
  overrides?: { payload?: PokemonCachePayload }
): PokemonCacheRow {
  const generationName = species?.generation?.name ?? null;
  const region = generationName ? (generationRegionMap[generationName] ?? null) : null;

  return {
    pokemon_id: detail.id,
    name: detail.name,
    types: detail.types.map((entry) => entry.type.name),
    generation: generationName,
    region,
    payload: overrides?.payload ?? {
      pokemon: detail,
      species,
    },
    cached_at: new Date().toISOString(),
  };
}

export function buildMoveSummary(row: MoveCacheRow): MoveSummary | null {
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

export function parsePokemonPayload(payload: unknown): PokemonCachePayload | null {
  if (payload && typeof payload === "object" && "pokemon" in payload) {
    return payload as PokemonCachePayload;
  }
  return null;
}

export function isCacheExpired(timestamp: string, ttl: number) {
  return new Date(timestamp).getTime() < Date.now() - ttl;
}

export function mapCacheRowToSummary(row: PokemonCacheRow, payload?: PokemonCachePayload) {
  const detail = payload?.pokemon ?? parsePokemonPayload(row.payload)?.pokemon ?? null;

  return {
    pokemonId: row.pokemon_id,
    name: row.name,
    types: row.types,
    generation: row.generation,
    region: row.region,
    spriteUrl: detail ? getPokemonSprite(detail) : null,
    cachedAt: row.cached_at,
  };
}

export async function refreshPopularPokemonFromApi(limit: number) {
  const list = await fetchPokemonList({ limit, offset: 0 });
  const ids = list.results
    .map((item) => extractResourceId(item.url, "pokemon"))
    .filter((value): value is number => value !== null);

  if (ids.length === 0) {
    return [];
  }

  return await fetchAndRefreshPokemonSummaries(ids);
}
