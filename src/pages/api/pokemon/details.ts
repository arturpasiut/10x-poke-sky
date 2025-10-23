import type { APIRoute } from "astro";

import type { PokemonGenerationValue, PokemonRegionValue, PokemonTypeValue } from "@/lib/pokemon/types";
import type { MoveSummaryDto, PokemonDetailResponseDto } from "@/types";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const MAX_MOVES_PREVIEW = 12;

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
  { generation: "generation-vii", region: "alola", from: 722, to: 809 },
  { generation: "generation-viii", region: "galar", from: 810, to: 905 },
  { generation: "generation-ix", region: "paldea", from: 906, to: 1025 },
];

const HISUI_IDS = new Set<number>([899, 900, 901, 902, 903, 904, 905]);

interface PokemonDetailSprites {
  front_default?: string | null;
  other?: {
    "official-artwork"?: { front_default?: string | null };
    home?: { front_default?: string | null };
    dream_world?: { front_default?: string | null };
  };
}

interface MoveDetail {
  id?: number;
  name?: string;
  type?: { name?: string };
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  generation?: { name?: string };
}

interface PokemonMoveEntry {
  move?: {
    url?: string;
  };
}

const jsonResponse = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

const fetchJson = async (url: string) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url} with status ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
};

const mapGenerationAndRegion = (id: number) => {
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
};

const resolveSpriteUrl = (detail: Record<string, unknown>): string | null => {
  const sprites = detail?.sprites as PokemonDetailSprites | undefined;
  const artwork = sprites?.other?.["official-artwork"]?.front_default;
  if (artwork) {
    return artwork;
  }

  const home = sprites?.other?.home?.front_default;
  if (home) {
    return home;
  }

  const dream = sprites?.other?.dream_world?.front_default;
  if (dream) {
    return dream;
  }

  return sprites?.front_default ?? null;
};

const toMoveSummaryDto = (move: MoveDetail): MoveSummaryDto => ({
  moveId: move.id ?? 0,
  name: move.name ?? "unknown",
  type: move.type?.name ?? null,
  power: move.power ?? null,
  accuracy: move.accuracy ?? null,
  pp: move.pp ?? null,
  generation: move.generation?.name ?? null,
  cachedAt: new Date().toISOString(),
  damageClass: move.damage_class?.name?.toLowerCase() ?? null,
});

const buildMoveSummaries = async (moves: PokemonMoveEntry[]): Promise<MoveSummaryDto[]> => {
  const preview = moves.slice(0, MAX_MOVES_PREVIEW);
  const summaries: MoveSummaryDto[] = [];

  for (const entry of preview) {
    const url = entry?.move?.url;
    if (!url) {
      continue;
    }

    try {
      const detail = (await fetchJson(url)) as MoveDetail;
      summaries.push(toMoveSummaryDto(detail));
    } catch (error) {
      console.warn("Failed to fetch move detail", error);
    }
  }

  return summaries;
};

const buildDetailResponse = async (identifier: string): Promise<PokemonDetailResponseDto> => {
  const pokemon = await fetchJson(`${POKEAPI_BASE_URL}/pokemon/${identifier}`);
  const pokemonId = Number(pokemon?.id);

  if (!Number.isFinite(pokemonId)) {
    throw new Error("Invalid Pokémon payload");
  }

  let species: Record<string, unknown> | null = null;
  let evolutionChain: Record<string, unknown> | null = null;

  try {
    const speciesUrl = (pokemon?.species as Record<string, string> | undefined)?.url;
    if (speciesUrl) {
      species = await fetchJson(speciesUrl);
      const evolutionUrl = (species?.evolution_chain as Record<string, string> | undefined)?.url;
      if (evolutionUrl) {
        evolutionChain = await fetchJson(evolutionUrl);
      }
    }
  } catch (error) {
    console.warn("Failed to fetch species/evolution data", error);
  }

  const { generation, region } = mapGenerationAndRegion(pokemonId);
  const types = Array.isArray(pokemon?.types)
    ? (pokemon.types as { type: { name: string } }[]).map((entry) => entry.type.name as PokemonTypeValue)
    : [];

  const moves = Array.isArray(pokemon?.moves) ? await buildMoveSummaries(pokemon.moves as PokemonMoveEntry[]) : [];

  return {
    summary: {
      pokemonId,
      name: (pokemon?.name as string) ?? identifier,
      types,
      generation,
      region,
      spriteUrl: resolveSpriteUrl(pokemon),
      cachedAt: new Date().toISOString(),
      highlights: [],
    },
    pokemon,
    species,
    evolutionChain,
    moves,
  };
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const identifier = url.searchParams.get("identifier")?.trim();

  if (!identifier) {
    return jsonResponse(
      {
        error: "Missing identifier parameter",
      },
      { status: 400 }
    );
  }

  try {
    const data = await buildDetailResponse(identifier);

    return jsonResponse(
      {
        data,
        meta: {
          refreshed: true,
          cacheTtlMs: 0,
          movesCached: data.moves.length,
        },
        source: "pokeapi",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("pokemon-details api error", error);
    return jsonResponse(
      {
        error: "Unable to fetch Pokémon details.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
};

export const prerender = false;
