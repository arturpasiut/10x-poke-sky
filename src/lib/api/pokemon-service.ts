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
    search?: string;
  };
  source: string;
}

export interface PokemonListQueryParams {
  search?: string;
  types?: string[];
  generation?: string;
  region?: string;
}

export async function fetchPokemonListFromEdge(
  limit: number,
  offset: number,
  queryParams: PokemonListQueryParams = {}
) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (queryParams.search && queryParams.search.trim().length > 0) {
    query.set("search", queryParams.search.trim());
  }
  query.delete("type");
  query.delete("generation");
  query.delete("region");

  queryParams.types?.forEach((type) => {
    if (type.trim()) {
      query.append("type", type.trim().toLowerCase());
    }
  });

  if (queryParams.generation && queryParams.generation !== "all") {
    query.set("generation", queryParams.generation);
  }

  if (queryParams.region && queryParams.region !== "all") {
    query.set("region", queryParams.region);
  }

  const response = await fetch(`/api/pokemon/list?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await handleResponse<PokemonListEdgeResponse>(response);
}
