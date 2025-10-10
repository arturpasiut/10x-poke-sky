import type { PokemonDetail, PokemonSpecies } from "./pokeapi.ts";

export interface PokemonCachePayload {
  pokemon: PokemonDetail;
  species: PokemonSpecies | null;
  evolutionChain?: unknown;
  moves?: MoveSummary[];
  enrichedAt?: string;
}

export interface PokemonCacheRow {
  id?: number;
  pokemon_id: number;
  name: string;
  types: string[];
  generation: string | null;
  region: string | null;
  payload: unknown;
  cached_at: string;
}

export interface MoveSummary {
  moveId: number;
  name: string;
  type: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  generation: string | null;
  damageClass: string | null;
  priority: number | null;
  cachedAt: string;
}

export interface MoveCacheRow {
  move_id: number;
  name: string;
  type: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  generation: string | null;
  payload: unknown;
  cached_at: string;
}
