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

  const payload = await response.json();
  return payload;
}
