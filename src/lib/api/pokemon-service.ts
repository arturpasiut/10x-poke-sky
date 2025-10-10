import { runtimeConfig } from "@/lib/env";
import type { PokemonListResponseDto } from "@/types";

const EDGE_FUNCTION_BASE = `${runtimeConfig.supabaseUrl}/functions/v1`;

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
  const url = new URL(`${EDGE_FUNCTION_BASE}/pokemon-list`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: runtimeConfig.supabaseKey,
      "Content-Type": "application/json",
    },
  });

  return await handleResponse<PokemonListEdgeResponse>(response);
}
