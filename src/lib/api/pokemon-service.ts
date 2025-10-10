import type { PokemonListResponseDto } from "@/types";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error ?? response.statusText;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

interface PokemonListEdgeResponse {
  data: PokemonListResponseDto;
  meta: {
    refreshedCount: number;
    refreshedIds: number[];
    cacheTtlMs: number;
  };
  source: string;
}

export async function fetchPokemonListFromEdge(limit: number, offset: number) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(`/api/pokemon/list?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await handleResponse<PokemonListEdgeResponse>(response);
}
