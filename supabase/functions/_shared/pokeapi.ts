import { config, withBase } from "./config.ts";
import { mockPokemonDetails, mockPokemonList } from "./mock-data.ts";

interface PokemonListResult {
  name: string;
  url: string;
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListResult[];
}

interface NamedResource {
  name: string;
  url: string;
}

interface PokemonType {
  slot: number;
  type: NamedResource;
}

interface PokemonSprites {
  front_default: string | null;
  other?: {
    ["official-artwork"]?: {
      front_default: string | null;
    };
  };
}

interface PokemonMoveVersion {
  level_learned_at: number;
  move_learn_method: NamedResource;
  version_group: NamedResource;
}

export interface PokemonMoveEntry {
  move: NamedResource;
  version_group_details: PokemonMoveVersion[];
}

interface PokemonStat {
  base_stat: number;
  stat: NamedResource;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonType[];
  sprites: PokemonSprites;
  moves: PokemonMoveEntry[];
  stats: PokemonStat[];
  base_experience?: number;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  generation?: NamedResource | null;
  evolution_chain?: {
    url: string | null;
  } | null;
}

export interface EvolutionChainLink {
  is_baby: boolean;
  species: NamedResource;
  evolution_details: unknown[];
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedResource | null;
  chain: EvolutionChainLink;
}

export interface MoveDetail {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  priority: number;
  type: NamedResource;
  damage_class: NamedResource | null;
  generation: NamedResource | null;
}

export async function fetchPokemonList({
  limit = 20,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<PokemonListResponse> {
  if (config.useMock) {
    return mockPokemonList;
  }

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safeOffset = Math.max(0, offset);

  const url = new URL(withBase("/pokemon"));
  url.searchParams.set("limit", String(safeLimit));
  url.searchParams.set("offset", String(safeOffset));

  const response = await fetch(url, {
    headers: {
      "user-agent": "10x-poke-sky-edge-function/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI list request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as PokemonListResponse;
  return payload;
}

export async function fetchPokemonDetails(identifier: string) {
  if (!identifier) {
    throw new Error("Pokemon identifier is required");
  }

  if (config.useMock) {
    return mockPokemonDetails;
  }

  const url = withBase(`/pokemon/${identifier.toLowerCase()}`);
  const response = await fetch(url, {
    headers: {
      "user-agent": "10x-poke-sky-edge-function/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI detail request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as PokemonDetail;
  return payload;
}

export async function fetchPokemonSpecies(identifier: number | string) {
  if (config.useMock) {
    return {
      id: Number(identifier),
      name: String(identifier),
      generation: { name: "generation-i" },
    } as PokemonSpecies;
  }

  const url = withBase(`/pokemon-species/${identifier}`);
  const response = await fetch(url, {
    headers: {
      "user-agent": "10x-poke-sky-edge-function/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI species request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as PokemonSpecies;
  return payload;
}

export async function fetchEvolutionChain(identifier: number | string) {
  if (config.useMock) {
    return {
      id: Number(identifier),
      baby_trigger_item: null,
      chain: {
        is_baby: false,
        species: { name: "bulbasaur", url: withBase("/pokemon-species/1/") },
        evolution_details: [],
        evolves_to: [],
      },
    } as EvolutionChain;
  }

  const url = withBase(`/evolution-chain/${identifier}`);
  const response = await fetch(url, {
    headers: {
      "user-agent": "10x-poke-sky-edge-function/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI evolution request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as EvolutionChain;
  return payload;
}

export async function fetchEvolutionChainByUrl(url: string) {
  if (!url) {
    throw new Error("Evolution chain URL is required");
  }

  if (config.useMock) {
    return fetchEvolutionChain(1);
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "10x-poke-sky-edge-function/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI evolution request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as EvolutionChain;
  return payload;
}

export async function fetchMove(identifier: number | string) {
  if (config.useMock) {
    return {
      id: Number(identifier),
      name: `mock-move-${identifier}`,
      accuracy: 100,
      power: 60,
      pp: 25,
      priority: 0,
      type: { name: "normal", url: withBase("/type/1/") },
      damage_class: { name: "physical", url: withBase("/move-damage-class/2/") },
      generation: { name: "generation-i", url: withBase("/generation/1/") },
    } as MoveDetail;
  }

  const url = withBase(`/move/${identifier}`);
  const response = await fetch(url, {
    headers: {
      "user-agent": "10x-poke-sky-edge-function/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI move request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as MoveDetail;
  return payload;
}

export function extractResourceId(url: string | null | undefined, resource: string) {
  if (!url) return null;
  const pattern = new RegExp(`/${resource}/(\\d+)/?`);
  const match = url.match(pattern);
  if (!match) return null;
  return Number(match[1]);
}

export function getPokemonSprite(detail: PokemonDetail) {
  return detail.sprites.other?.["official-artwork"]?.front_default ?? detail.sprites.front_default ?? null;
}
