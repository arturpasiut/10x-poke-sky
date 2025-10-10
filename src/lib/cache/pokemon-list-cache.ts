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
}

export interface CachedPokemonList {
  data: PokemonListResponseDto;
  metadata: CacheMetadata;
  timestamp: number;
}

export function buildListCacheKey(limit: number, offset: number) {
  return normalizeKey([LIST_CACHE_PREFIX, limit, offset]);
}

export function getCachedPokemonList(limit: number, offset: number, options?: PokemonListCacheOptions) {
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const key = buildListCacheKey(limit, offset);
  const entry = readCache<CachedPokemonList>(key);
  if (!entry || isEntryExpired(entry, ttl)) {
    return null;
  }
  return entry;
}

export function setCachedPokemonList(limit: number, offset: number, payload: PokemonListResponseDto) {
  const key = buildListCacheKey(limit, offset);
  writeCache<CachedPokemonList>(key, {
    data: payload,
    metadata: { limit, offset },
    timestamp: Date.now(),
  });
}
