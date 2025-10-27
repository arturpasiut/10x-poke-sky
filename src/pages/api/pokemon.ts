import type { APIRoute } from "astro";

import type { PokemonGenerationValue, PokemonRegionValue, PokemonTypeValue } from "@/lib/pokemon/types";
import { DEFAULT_QUERY_STATE, parseQueryState } from "@/lib/pokemon/query";
import type { PokemonListResponseDto, PokemonSummaryDto } from "@/types";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const MAX_POKEDEX_ID = 1025;
const MIN_SEARCH_LENGTH = 2;

interface GenerationRange {
  generation: PokemonGenerationValue;
  region: PokemonRegionValue;
  from: number;
  to: number;
}

const GENERATION_RANGES: GenerationRange[] = [
  { generation: "generation-i", region: "kanto", from: 1, to: 151 },
  { generation: "generation-ii", region: "johto", from: 152, to: 251 },
  { generation: "generation-iii", region: "hoenn", from: 252, to: 386 },
  { generation: "generation-iv", region: "sinnoh", from: 387, to: 493 },
  { generation: "generation-v", region: "unova", from: 494, to: 649 },
  { generation: "generation-vi", region: "kalos", from: 650, to: 721 },
  // Generation VII obejmuje zarówno Alolę, jak i formy regionalne – przypisujemy większość do Aloli.
  { generation: "generation-vii", region: "alola", from: 722, to: 809 },
  // Generation VIII – główny region Galar, ale ID 899-905 to Hisui; traktujemy osobno w mapowaniu.
  { generation: "generation-viii", region: "galar", from: 810, to: 905 },
  { generation: "generation-ix", region: "paldea", from: 906, to: MAX_POKEDEX_ID },
];

const HISUI_IDS = new Set<number>([899, 900, 901, 902, 903, 904, 905]);

interface PokemonApiDetail {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: {
    front_default?: string | null;
    other?: {
      "official-artwork"?: { front_default?: string | null };
      home?: { front_default?: string | null };
      dream_world?: { front_default?: string | null };
    };
  };
}

interface PokemonSpeciesVariety {
  is_default: boolean;
  pokemon: {
    name: string;
    url: string;
  };
}

interface PokemonTypeEntry {
  pokemon: {
    url: string;
  };
}

interface PokemonIndexEntry {
  id: number;
  name: string;
}

let pokemonIndexCache: PokemonIndexEntry[] | null = null;
let pokemonIndexPromise: Promise<PokemonIndexEntry[]> | null = null;

export const GET: APIRoute = async ({ url }) => {
  const state = parseQueryState(url.searchParams);

  try {
    const response = await buildPokemonList(state);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          message: error.message,
        }),
        { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    console.error("api/pokemon error", error);
    return new Response(
      JSON.stringify({
        message: "Nie udało się pobrać listy Pokémonów.",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
};

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function buildPokemonList(state = DEFAULT_QUERY_STATE): Promise<PokemonListResponseDto> {
  const sanitizedPage = Math.max(1, state.page ?? DEFAULT_QUERY_STATE.page);
  const sanitizedPageSize = clamp(state.pageSize, 1, DEFAULT_QUERY_STATE.pageSize * 4) ?? DEFAULT_QUERY_STATE.pageSize;
  const searchTerm = (state.search ?? "").trim().toLowerCase();

  let candidateIds = await resolveCandidateIds(state);

  if (searchTerm) {
    candidateIds = await filterCandidateIdsBySearch(candidateIds, searchTerm);
  }

  if (candidateIds.length === 0) {
    return {
      items: [],
      page: sanitizedPage,
      pageSize: sanitizedPageSize,
      total: 0,
      hasNext: false,
    };
  }

  const sortedIds = sortCandidateIds(candidateIds, state.sort, state.order);
  const total = sortedIds.length;

  const startIndex = (sanitizedPage - 1) * sanitizedPageSize;
  const endIndex = startIndex + sanitizedPageSize;

  const pageIds = sortedIds.slice(startIndex, endIndex);
  const details = await Promise.all(pageIds.map((id) => fetchPokemonSummary(id)));
  const items = details.filter((item): item is PokemonSummaryDto => Boolean(item));

  return {
    items,
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    total,
    hasNext: endIndex < total,
  };
}

async function resolveCandidateIds(state: typeof DEFAULT_QUERY_STATE): Promise<number[]> {
  let candidateIds: number[] = [];

  if (state.types.length > 0) {
    const typeLists = await Promise.all(state.types.map((type) => fetchTypeIds(type)));
    candidateIds = intersectIds(typeLists);
  } else {
    candidateIds = Array.from({ length: MAX_POKEDEX_ID }, (_, index) => index + 1);
  }

  if (state.generation) {
    const range = GENERATION_RANGES.find((entry) => entry.generation === state.generation);
    if (!range) {
      candidateIds = [];
    } else {
      candidateIds = candidateIds.filter((id) => id >= range.from && id <= range.to);
    }
  }

  if (state.region) {
    candidateIds = candidateIds.filter((id) => mapRegionForId(id) === state.region);
  }

  return candidateIds;
}

export async function filterCandidateIdsBySearch(candidateIds: number[], searchTerm: string): Promise<number[]> {
  if (!searchTerm) {
    return candidateIds;
  }

  if (/^\d+$/.test(searchTerm)) {
    const numericId = Number.parseInt(searchTerm, 10);
    if (!Number.isNaN(numericId) && numericId >= 1 && numericId <= MAX_POKEDEX_ID) {
      return candidateIds.includes(numericId) ? [numericId] : [];
    }
    return [];
  }

  if (searchTerm.length < MIN_SEARCH_LENGTH) {
    return candidateIds;
  }

  const index = await loadPokemonIndex();
  const matchingIds = new Set<number>();

  for (const entry of index) {
    if (entry.name.startsWith(searchTerm)) {
      matchingIds.add(entry.id);
    }
  }

  if (matchingIds.size === 0) {
    return [];
  }

  return candidateIds.filter((id) => matchingIds.has(id));
}

function sortCandidateIds(
  ids: number[],
  sort: typeof DEFAULT_QUERY_STATE.sort,
  order: typeof DEFAULT_QUERY_STATE.order
) {
  const sorted = [...ids];

  if (sort === "name") {
    // Sortowanie po nazwie wymaga dodatkowych zapytań – fallback do sortowania po numerze Pokédexu.
    sorted.sort((a, b) => a - b);
  } else {
    sorted.sort((a, b) => a - b);
  }

  if (order === "desc") {
    sorted.reverse();
  }

  return sorted;
}

async function loadPokemonIndex(): Promise<PokemonIndexEntry[]> {
  if (pokemonIndexCache) {
    return pokemonIndexCache;
  }

  if (pokemonIndexPromise) {
    return pokemonIndexPromise;
  }

  pokemonIndexPromise = (async () => {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=${MAX_POKEDEX_ID}&offset=0`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`PokeAPI index request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: { name: string; url: string }[];
    };

    const entries = (payload.results ?? [])
      .map((result) => ({
        id: extractIdFromUrl(result.url),
        name: result.name,
      }))
      .filter((entry): entry is PokemonIndexEntry => typeof entry.id === "number" && entry.id <= MAX_POKEDEX_ID)
      .sort((a, b) => a.id - b.id);

    pokemonIndexCache = entries;
    return entries;
  })();

  try {
    return await pokemonIndexPromise;
  } finally {
    pokemonIndexPromise = null;
  }
}

export function __resetPokemonIndexCache() {
  pokemonIndexCache = null;
  pokemonIndexPromise = null;
}

export async function fetchPokemonSummary(idOrName: number | string): Promise<PokemonSummaryDto | null> {
  let detail: PokemonApiDetail | null;

  try {
    detail = await fetchPokemonDetail(idOrName);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }

  if (!detail) {
    return null;
  }

  const types = detail.types.map((entry) => entry.type.name as PokemonTypeValue);
  const { generation, region } = mapGenerationAndRegion(detail.id);

  return {
    pokemonId: detail.id,
    name: detail.name,
    types,
    generation,
    region,
    spriteUrl: resolveSpriteUrl(detail),
    highlights: [],
  };
}

async function fetchPokemonDetail(idOrName: number | string): Promise<PokemonApiDetail | null> {
  const url = `${POKEAPI_BASE_URL}/pokemon/${idOrName}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (response.status === 301 || response.status === 302) {
    const location = response.headers.get("Location") ?? response.headers.get("location");
    if (location) {
      return fetchRedirectedPokemonDetail(location);
    }
  }

  if (response.status === 404) {
    throw new NotFoundError("Nie znaleziono Pokémona o podanym identyfikatorze.");
  }

  if (!response.ok) {
    throw new Error(`PokeAPI request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("json")) {
    return fetchPokemonDetailViaSpecies(idOrName, contentType);
  }

  try {
    return await response.json();
  } catch (error) {
    console.warn("PokeAPI JSON parse failed, trying species fallback", error);
    return fetchPokemonDetailViaSpecies(idOrName, contentType);
  }
}

async function fetchRedirectedPokemonDetail(location: string) {
  try {
    const redirectedResponse = await fetch(location, { headers: { Accept: "application/json" } });

    if (!redirectedResponse.ok) {
      throw new Error(`Redirected PokeAPI request failed with status ${redirectedResponse.status}`);
    }

    return redirectedResponse.json();
  } catch (error) {
    console.error("PokeAPI redirect fetch failed", error);
    throw new Error("Nie udało się pobrać danych przekierowanego Pokémona.");
  }
}

async function fetchPokemonDetailViaSpecies(idOrName: number | string, contentType: string) {
  const identifier = String(idOrName);
  const speciesResponse = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${identifier}`, {
    headers: { Accept: "application/json" },
  });

  if (!speciesResponse.ok) {
    throw new Error(
      `PokeAPI species request failed for ${identifier} (content-type: ${contentType}) with status ${speciesResponse.status}`
    );
  }

  const species = (await speciesResponse.json()) as { varieties?: PokemonSpeciesVariety[] };
  const defaultVarietyName = species?.varieties?.find((variant) => variant?.is_default)?.pokemon?.name;

  if (!defaultVarietyName || defaultVarietyName === identifier) {
    throw new Error(`Nie udało się ustalić domyślnej odmiany Pokémona ${identifier}.`);
  }

  const fallbackResponse = await fetch(`${POKEAPI_BASE_URL}/pokemon/${defaultVarietyName}`, {
    headers: { Accept: "application/json" },
  });

  if (!fallbackResponse.ok) {
    throw new Error(`Fallback PokeAPI request failed for ${defaultVarietyName} with status ${fallbackResponse.status}`);
  }

  return fallbackResponse.json();
}

async function fetchTypeIds(type: PokemonTypeValue): Promise<number[]> {
  const response = await fetch(`${POKEAPI_BASE_URL}/type/${type}`, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`PokeAPI type request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { pokemon?: PokemonTypeEntry[] };
  if (!payload.pokemon) {
    return [];
  }

  const ids = payload.pokemon
    .map((entry) => extractIdFromUrl(entry.pokemon.url))
    .filter((id): id is number => typeof id === "number" && id <= MAX_POKEDEX_ID);

  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

function extractIdFromUrl(url: string): number | null {
  const match = url.match(/\/pokemon\/(\d+)\//);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

function intersectIds(idLists: number[][]): number[] {
  if (idLists.length === 0) {
    return [];
  }

  return idLists.slice(1).reduce((acc, list) => acc.filter((id) => list.includes(id)), [...idLists[0]]);
}

function mapGenerationAndRegion(id: number) {
  const range = GENERATION_RANGES.find((entry) => id >= entry.from && id <= entry.to);

  if (!range) {
    return {
      generation: "generation-ix" as PokemonGenerationValue,
      region: "paldea" as PokemonRegionValue,
    };
  }

  if (range.generation === "generation-viii" && HISUI_IDS.has(id)) {
    return {
      generation: "generation-viii" as PokemonGenerationValue,
      region: "hisui" as PokemonRegionValue,
    };
  }

  return {
    generation: range.generation,
    region: range.region,
  };
}

function mapRegionForId(id: number): PokemonRegionValue {
  if (HISUI_IDS.has(id)) {
    return "hisui";
  }

  const range = GENERATION_RANGES.find((entry) => id >= entry.from && id <= entry.to);
  return range?.region ?? "paldea";
}

function resolveSpriteUrl(detail: PokemonApiDetail): string | null {
  const artwork = detail.sprites?.other?.["official-artwork"]?.front_default;
  if (artwork) {
    return artwork;
  }

  const home = detail.sprites?.other?.home?.front_default;
  if (home) {
    return home;
  }

  const dream = detail.sprites?.other?.dream_world?.front_default;
  if (dream) {
    return dream;
  }

  return detail.sprites?.front_default ?? null;
}

function clamp(value: number | undefined, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}
