import {
  type PokemonGenerationValue,
  type PokemonListQueryDto,
  type PokemonListQueryState,
  type PokemonRegionValue,
  type PokemonSortKey,
  type PokemonSortOrder,
  type PokemonTypeValue,
} from "./types"
import {
  POKEMON_SORT_OPTIONS,
  isValidGeneration,
  isValidRegion,
  isValidSortKey,
  isValidPokemonType,
  sanitizeSelectedTypes,
} from "./filters"

export const MAX_SEARCH_LENGTH = 100
export const PAGE_SIZE_OPTIONS = [24, 48, 96] as const
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]
export const DEFAULT_SORT_KEY: PokemonSortKey = "pokedex"
export const DEFAULT_SORT_ORDER: PokemonSortOrder = "asc"
export const MIN_PAGE = 1

const sortOrders: PokemonSortOrder[] = ["asc", "desc"]

export const DEFAULT_QUERY_STATE: PokemonListQueryState = {
  search: "",
  types: [],
  generation: null,
  region: null,
  sort: DEFAULT_SORT_KEY,
  order: DEFAULT_SORT_ORDER,
  page: MIN_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
}

export function createDefaultQueryState(
  overrides: Partial<PokemonListQueryState> = {},
): PokemonListQueryState {
  return {
    ...DEFAULT_QUERY_STATE,
    ...overrides,
  }
}

export function sanitizeSearchValue(value: string): string {
  if (!value) {
    return ""
  }

  return value.trim().slice(0, MAX_SEARCH_LENGTH)
}

export function sanitizePageValue(page: number | string | null | undefined): number {
  if (page == null) {
    return MIN_PAGE
  }

  const parsed = Number.parseInt(String(page), 10)
  if (Number.isNaN(parsed) || parsed < MIN_PAGE) {
    return MIN_PAGE
  }

  return parsed
}

export function sanitizePageSizeValue(pageSize: number | string | null | undefined): number {
  if (pageSize == null) {
    return DEFAULT_PAGE_SIZE
  }

  const parsed = Number.parseInt(String(pageSize), 10)
  if (PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number])) {
    return parsed
  }

  return DEFAULT_PAGE_SIZE
}

export function sanitizeSortKey(value: string | null | undefined): PokemonSortKey {
  if (!value) {
    return DEFAULT_SORT_KEY
  }

  return isValidSortKey(value) ? value : DEFAULT_SORT_KEY
}

export function sanitizeSortOrder(value: string | null | undefined): PokemonSortOrder {
  if (!value) {
    return DEFAULT_SORT_ORDER
  }

  return sortOrders.includes(value as PokemonSortOrder) ? (value as PokemonSortOrder) : DEFAULT_SORT_ORDER
}

export function sanitizeGeneration(value: string | null | undefined): PokemonGenerationValue | null {
  if (!value) {
    return null
  }

  return isValidGeneration(value) ? value : null
}

export function sanitizeRegion(value: string | null | undefined): PokemonRegionValue | null {
  if (!value) {
    return null
  }

  return isValidRegion(value) ? value : null
}

export function sanitizeTypes(
  values: readonly (string | PokemonTypeValue)[] | null | undefined,
): PokemonTypeValue[] {
  if (!values || values.length === 0) {
    return []
  }

  return sanitizeSelectedTypes(values)
}

type RawQueryState = Record<string, unknown> & {
  type?: unknown
  types?: unknown
}

export function sanitizeQueryState(candidate?: RawQueryState | null): PokemonListQueryState {
  const source = (candidate ?? {}) as RawQueryState

  const search = typeof source.search === "string" ? source.search : ""
  const rawTypes =
    Array.isArray(source.types) && source.types.every((value) => typeof value === "string")
      ? (source.types as (string | PokemonTypeValue)[])
      : toArray(source.type).filter((value): value is string => typeof value === "string")

  const generation = typeof source.generation === "string" ? source.generation : null
  const region = typeof source.region === "string" ? source.region : null
  const sort = typeof source.sort === "string" ? source.sort : null
  const order = typeof source.order === "string" ? source.order : null
  const page = typeof source.page === "number" || typeof source.page === "string" ? source.page : null
  const pageSize =
    typeof source.pageSize === "number" || typeof source.pageSize === "string" ? source.pageSize : null

  return {
    search: sanitizeSearchValue(search),
    types: sanitizeTypes(rawTypes),
    generation: sanitizeGeneration(generation),
    region: sanitizeRegion(region),
    sort: sanitizeSortKey(sort),
    order: sanitizeSortOrder(order),
    page: sanitizePageValue(page),
    pageSize: sanitizePageSizeValue(pageSize),
  }
}

export function parseQueryState(searchParams: URLSearchParams | string): PokemonListQueryState {
  const params = typeof searchParams === "string" ? new URLSearchParams(searchParams) : searchParams

  const search = params.get("search") ?? ""
  const types = params.getAll("type")

  return sanitizeQueryState({
    search,
    types,
    generation: params.get("generation"),
    region: params.get("region"),
    sort: params.get("sort"),
    order: params.get("order"),
    page: params.get("page"),
    pageSize: params.get("pageSize"),
  } satisfies RawQueryState)
}

export function toQueryDto(state: PokemonListQueryState): PokemonListQueryDto {
  const dto: PokemonListQueryDto = {}

  const search = sanitizeSearchValue(state.search)
  if (search) {
    dto.search = search.toLowerCase()
  }

  if (state.types.length > 0) {
    dto.type = sanitizeTypes(state.types)
  }

  const generation = sanitizeGeneration(state.generation)
  if (generation) {
    dto.generation = generation
  }

  const region = sanitizeRegion(state.region)
  if (region) {
    dto.region = region
  }

  const sort = sanitizeSortKey(state.sort)
  const sortOption = POKEMON_SORT_OPTIONS.find((option) => option.value === sort)
  dto.sort = sortOption?.value ?? DEFAULT_SORT_KEY

  dto.order = sanitizeSortOrder(state.order)
  dto.page = sanitizePageValue(state.page)
  dto.pageSize = sanitizePageSizeValue(state.pageSize)

  return dto
}

export function toQueryString(state: PokemonListQueryState): string {
  const dto = toQueryDto(state)
  const params = new URLSearchParams()

  if (dto.search) {
    params.set("search", dto.search)
  }

  if (dto.type?.length) {
    for (const value of dto.type) {
      if (isValidPokemonType(value)) {
        params.append("type", value)
      }
    }
  }

  if (dto.generation) {
    params.set("generation", dto.generation)
  }

  if (dto.region) {
    params.set("region", dto.region)
  }

  if (dto.sort) {
    params.set("sort", dto.sort)
  }

  if (dto.order) {
    params.set("order", dto.order)
  }

  if (dto.page && dto.page !== DEFAULT_QUERY_STATE.page) {
    params.set("page", String(dto.page))
  } else if (dto.page === DEFAULT_QUERY_STATE.page) {
    params.delete("page")
  }

  if (dto.pageSize && dto.pageSize !== DEFAULT_QUERY_STATE.pageSize) {
    params.set("pageSize", String(dto.pageSize))
  }

  return params.toString()
}

export function mergeQueryState(
  prev: PokemonListQueryState,
  next: Partial<PokemonListQueryState>,
): PokemonListQueryState {
  const combined = {
    ...(prev as unknown as RawQueryState),
    ...(next as unknown as RawQueryState),
  }

  return sanitizeQueryState(combined)
}

export function buildRequestUrl(baseUrl: string, state: PokemonListQueryState): string {
  const query = toQueryString(state)
  if (!query) {
    return baseUrl
  }

  const separator = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${separator}${query}`
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value == null) {
    return []
  }
  return [value]
}
