import { useEffect, useMemo, useState } from "react";

import { fetchPokemonListFromEdge } from "@/lib/api/pokemon-service";
import { getCachedPokemonList, setCachedPokemonList } from "@/lib/cache/pokemon-list-cache";
import type { PokemonListResponseDto } from "@/types";

export interface UsePokemonListOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UsePokemonListResult {
  data: PokemonListResponseDto | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fromCache: boolean;
}

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

export function usePokemonList(options?: UsePokemonListOptions): UsePokemonListResult {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const offset = options?.offset ?? DEFAULT_OFFSET;
  const search = options?.search?.trim() ?? "";

  const cacheKey = useMemo(() => ({ limit, offset, search }), [limit, offset, search]);
  const [state, setState] = useState(() => {
    const cached = getCachedPokemonList(limit, offset, search);
    return {
      data: cached?.data ?? null,
      isLoading: !cached,
      error: null as string | null,
      fromCache: Boolean(cached),
    };
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = getCachedPokemonList(cacheKey.limit, cacheKey.offset, cacheKey.search);
      if (cached && !cancelled) {
        setState({ data: cached.data, isLoading: false, error: null, fromCache: true });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null, fromCache: false }));

      try {
        const { data } = await fetchPokemonListFromEdge(cacheKey.limit, cacheKey.offset, cacheKey.search);
        setCachedPokemonList(cacheKey.limit, cacheKey.offset, cacheKey.search, data);
        if (!cancelled) {
          setState({ data, isLoading: false, error: null, fromCache: false });
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }));
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [cacheKey.limit, cacheKey.offset, cacheKey.search]);

  const refresh = async () => {
    const { data } = await fetchPokemonListFromEdge(cacheKey.limit, cacheKey.offset, cacheKey.search);
    setCachedPokemonList(cacheKey.limit, cacheKey.offset, cacheKey.search, data);
    setState({ data, isLoading: false, error: null, fromCache: false });
  };

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    fromCache: state.fromCache,
  };
}
