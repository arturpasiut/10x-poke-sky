/* eslint-disable no-console -- Logging in edge functions aids observability during development */
import { config, handleOptions, jsonResponse } from "../_shared/config.ts";
import { CACHE_TTL_MS } from "../_shared/constants.ts";
import {
  fetchPokemonDetails,
  fetchPokemonSpecies,
  getPokemonSprite,
  type PokemonDetail,
  type PokemonSpecies,
} from "../_shared/pokeapi.ts";
import { generationRegionMap } from "../_shared/regions.ts";
import type { MoveSummary, PokemonCacheRow } from "../_shared/types.ts";
import {
  getPokemonCacheRowBy,
  hydratePokemonDetail,
  isCacheExpired,
  mapCacheRowToSummary,
  parsePokemonPayload,
} from "../_shared/pokemon-cache.ts";

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
  const detail = (await fetchPokemonDetails(identifier)) as PokemonDetail;
  const species = (await fetchPokemonSpecies(detail.id)) as PokemonSpecies;

  return {
    source: "mock",
    meta: {
      refreshed: true,
      cacheTtlMs: CACHE_TTL_MS,
      movesCached: 0,
    },
    data: {
      summary: {
        pokemonId: detail.id,
        name: detail.name,
        types: detail.types?.map((type) => type.type.name) ?? [],
        generation: species?.generation?.name ?? null,
        region: species?.generation?.name ? (generationRegionMap[species.generation.name] ?? null) : null,
        spriteUrl: getPokemonSprite(detail),
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
    cachedRow = await getPokemonCacheRowBy("pokemon_id", numericId);
  }

  if (!cachedRow) {
    cachedRow = await getPokemonCacheRowBy("name", normalized);
  }

  const payload = parsePokemonPayload(cachedRow?.payload);
  const stale = !cachedRow || !payload || isCacheExpired(cachedRow.cached_at, CACHE_TTL_MS) || !payload.enrichedAt;

  if (!cachedRow || stale) {
    const { record, payload: refreshedPayload, refreshed } = await hydratePokemonDetail(identifier, cachedRow);
    return {
      source: "cache",
      meta: {
        refreshed,
        cacheTtlMs: CACHE_TTL_MS,
        movesCached: refreshedPayload.moves?.length ?? 0,
      },
      data: {
        summary: mapCacheRowToSummary(record, refreshedPayload),
        pokemon: refreshedPayload.pokemon,
        species: refreshedPayload.species ?? null,
        evolutionChain: refreshedPayload.evolutionChain ?? null,
        moves: refreshedPayload.moves ?? [],
      },
    };
  }

  return {
    source: "cache",
    meta: {
      refreshed: false,
      cacheTtlMs: CACHE_TTL_MS,
      movesCached: payload.moves?.length ?? 0,
    },
    data: {
      summary: mapCacheRowToSummary(cachedRow, payload),
      pokemon: payload.pokemon,
      species: payload.species ?? null,
      evolutionChain: payload.evolutionChain ?? null,
      moves: payload.moves ?? [],
    },
  };
}
