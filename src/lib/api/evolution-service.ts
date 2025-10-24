import type { EvolutionChainDto, EvolutionBranchingFilter } from "@/lib/evolution/types";
import type { PokemonGenerationValue, PokemonTypeValue } from "@/lib/pokemon/types";

interface EvolutionChainEdgeResponse {
  data: EvolutionChainDto;
  source: string;
  fetchedAt: string;
}

export interface EvolutionChainQueryParams {
  chainId?: number | string | null;
  pokemonId?: number | null;
  identifier?: string | null;
  type?: PokemonTypeValue | null;
  generation?: PokemonGenerationValue | null;
  branching?: EvolutionBranchingFilter | null;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { message?: string })?.message ?? response.statusText;
    throw new Error(message);
  }

  return (await response.json()) as T;
};

const buildQueryString = (params: EvolutionChainQueryParams = {}): string => {
  const search = new URLSearchParams();

  if (params.chainId !== null && params.chainId !== undefined) {
    search.set("chainId", String(params.chainId));
  }

  if (params.pokemonId !== null && params.pokemonId !== undefined) {
    search.set("pokemonId", String(params.pokemonId));
  }

  if (params.identifier) {
    search.set("identifier", params.identifier.trim());
  }

  if (params.type) {
    search.set("type", params.type);
  }

  if (params.generation) {
    search.set("generation", params.generation);
  }

  if (params.branching && params.branching !== "any") {
    search.set("branching", params.branching);
  }

  return search.toString();
};

interface FetchOptions {
  baseUrl?: string | URL;
}

export const fetchEvolutionChainFromEdge = async (
  params: EvolutionChainQueryParams = {},
  options: FetchOptions = {}
): Promise<EvolutionChainEdgeResponse> => {
  const query = buildQueryString(params);
  const pathname = query.length ? `/api/evolutions/chain?${query}` : "/api/evolutions/chain";

  const requestUrl = options.baseUrl !== undefined ? new URL(pathname, options.baseUrl).toString() : pathname;

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<EvolutionChainEdgeResponse>(response);
};
