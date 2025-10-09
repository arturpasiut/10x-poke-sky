import { useMemo } from "react"

import {
  POKEMON_GENERATION_OPTIONS,
  POKEMON_REGION_OPTIONS,
  POKEMON_TYPE_OPTIONS,
} from "@/lib/pokemon/filters"
import type { PokemonAvailableFilters } from "@/lib/pokemon/types"

type UsePokemonFilterOptionsResult = {
  filters: PokemonAvailableFilters
  isLoading: false
  error: undefined
  /**
   * API compatibility – future async implementation may expose a refresh handler.
   */
  refetch: () => void
}

const staticFilters: PokemonAvailableFilters = {
  types: POKEMON_TYPE_OPTIONS,
  generations: POKEMON_GENERATION_OPTIONS,
  regions: POKEMON_REGION_OPTIONS,
}

export function usePokemonFilterOptions(): UsePokemonFilterOptionsResult {
  const filters = useMemo(
    () => ({
      types: [...staticFilters.types],
      generations: [...staticFilters.generations],
      regions: [...staticFilters.regions],
    }),
    [],
  )

  return {
    filters,
    isLoading: false,
    error: undefined,
    refetch: () => {
      // Placeholder for future async refresh; keeps API compatible with potential data fetching.
    },
  }
}
