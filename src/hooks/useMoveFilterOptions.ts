import { useMemo } from "react";

import { POKEMON_REGION_OPTIONS, POKEMON_TYPE_OPTIONS } from "@/lib/pokemon/filters";
import type { MoveAvailableFilters } from "@/lib/moves/types";

interface UseMoveFilterOptionsResult {
  filters: MoveAvailableFilters;
  isLoading: false;
  error: undefined;
  refetch: () => void;
}

const staticFilters: MoveAvailableFilters = {
  types: POKEMON_TYPE_OPTIONS,
  regions: POKEMON_REGION_OPTIONS,
};

export function useMoveFilterOptions(): UseMoveFilterOptionsResult {
  const filters = useMemo(
    () => ({
      types: [...staticFilters.types],
      regions: [...staticFilters.regions],
    }),
    []
  );

  return {
    filters,
    isLoading: false,
    error: undefined,
    refetch: () => {
      // Placeholder for future dynamic filters refresh
    },
  };
}
