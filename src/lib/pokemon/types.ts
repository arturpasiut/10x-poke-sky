import type { PokemonListResponseDto, PokemonSummaryDto } from "@/types"

export type PokemonTypeValue =
  | "normal"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy"

export type PokemonGenerationValue =
  | "generation-i"
  | "generation-ii"
  | "generation-iii"
  | "generation-iv"
  | "generation-v"
  | "generation-vi"
  | "generation-vii"
  | "generation-viii"
  | "generation-ix"

export type PokemonRegionValue =
  | "kanto"
  | "johto"
  | "hoenn"
  | "sinnoh"
  | "unova"
  | "kalos"
  | "alola"
  | "galar"
  | "paldea"
  | "hisui"

export type PokemonSortKey = "pokedex" | "name" | "cachedAt"
export type PokemonSortOrder = "asc" | "desc"

export type FilterOption<TValue extends string = string> = {
  value: TValue
  label: string
  count?: number
  icon?: string
}

export type PokemonListQueryFilters = {
  search: string
  types: PokemonTypeValue[]
  generation: PokemonGenerationValue | null
  region: PokemonRegionValue | null
}

export type PokemonListQueryState = PokemonListQueryFilters & {
  sort: PokemonSortKey
  order: PokemonSortOrder
  page: number
  pageSize: number
}

export type PokemonListQueryDto = {
  search?: string
  type?: PokemonTypeValue[]
  generation?: PokemonGenerationValue
  region?: PokemonRegionValue
  sort?: PokemonSortKey
  order?: PokemonSortOrder
  page?: number
  pageSize?: number
}

export type FilterChipViewModel = {
  id: string
  label: string
  onRemove: () => void
}

export type SortOption = {
  value: PokemonSortKey
  label: string
  description?: string
}

export type PokemonAvailableFilters = {
  types: FilterOption<PokemonTypeValue>[]
  generations: FilterOption<PokemonGenerationValue>[]
  regions: FilterOption<PokemonRegionValue>[]
}

export type PokemonSummaryViewModel = PokemonSummaryDto & {
  displayName: string
  dexNumber: string
  spriteAlt: string
  routeHref: string
  cardGradientClass: string
  typeBadges: Array<{
    value: PokemonTypeValue
    label: string
    className: string
  }>
}

export type PaginationViewModel = {
  page: number
  pageSize: number
  total: number
  hasNext: boolean
  pageCount: number
  hasPrevious: boolean
}

export type ApiError = {
  code: number
  message: string
  details?: string
  retryAfterMs?: number
}

export type PokemonListQueryResult = {
  status: "idle" | "loading" | "success" | "error"
  data?: {
    list: PokemonListResponseDto
    items: PokemonSummaryViewModel[]
    pagination: PaginationViewModel
  }
  error?: ApiError
  isFetching: boolean
  retry: () => void
}

export type PokemonSpriteVariant = "official-artwork" | "dream-world" | "home"
