import type { PokemonListResponseDto } from "@/types";

import { normalizeKey, readCache, writeCache, isEntryExpired } from "./storage";

const LIST_CACHE_PREFIX = "pokemon:list";
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface PokemonListCacheOptions {
  ttlMs?: number;
}

interface CacheMetadata {
  limit: number;
  offset: number;
  search: string;
  typesKey: string;
  generation: string;
  region: string;
}

export interface CachedPokemonList {
  data: PokemonListResponseDto;
  metadata: CacheMetadata;
  timestamp: number;
}

function buildTypesKey(types: string[]) {
  if (types.length === 0) return "";
  return [...new Set(types.map((type) => type.trim().toLowerCase()))].sort().join(",");
}

export function buildListCacheKey(
  limit: number,
  offset: number,
  search: string,
  types: string[],
  generation: string,
  region: string
) {
  const normalizedSearch = search.trim().toLowerCase();
  const typesKey = buildTypesKey(types);
  const generationKey = generation.trim().toLowerCase();
  const regionKey = region.trim().toLowerCase();
  return normalizeKey([LIST_CACHE_PREFIX, limit, offset, normalizedSearch, typesKey, generationKey, regionKey]);
}

export function getCachedPokemonList(
  limit: number,
  offset: number,
  search: string,
  types: string[],
  generation: string,
  region: string,
  options?: PokemonListCacheOptions
) {
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const key = buildListCacheKey(limit, offset, search, types, generation, region);
  const entry = readCache<CachedPokemonList>(key);
  if (!entry || isEntryExpired(entry, ttl)) {
    return null;
  }
  return entry.value;
}

export function setCachedPokemonList(
  limit: number,
  offset: number,
  search: string,
  types: string[],
  generation: string,
  region: string,
  payload: PokemonListResponseDto
) {
  const key = buildListCacheKey(limit, offset, search, types, generation, region);
  writeCache<CachedPokemonList>(key, {
    data: payload,
    metadata: {
      limit,
      offset,
      search,
      typesKey: buildTypesKey(types),
      generation,
      region,
    },
    timestamp: Date.now(),
  });
}
