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

interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

interface PokemonSprites {
  front_default: string | null;
  other?: {
    ["official-artwork"]?: {
      front_default: string | null;
    };
  };
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonType[];
  sprites: PokemonSprites;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  generation?: {
    name: string;
  };
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
