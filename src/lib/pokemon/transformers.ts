import type { PokemonListResponseDto, PokemonSummaryDto } from "@/types"

import {
  getTypeBadgeClass,
  getTypeGradientClasses,
  getTypeLabel,
  isValidPokemonType,
} from "./filters"
import type {
  PaginationViewModel,
  PokemonSummaryViewModel,
  PokemonTypeValue,
} from "./types"

export function formatDexNumber(pokemonId: number): string {
  if (!Number.isFinite(pokemonId)) {
    return "#---"
  }

  return `#${pokemonId.toString().padStart(3, "0")}`
}

export function formatPokemonDisplayName(name: string): string {
  if (!name) {
    return ""
  }

  return name
    .split(/[-\s]+/)
    .map((part) => (part ? part[0]?.toUpperCase() + part.slice(1) : ""))
    .join(" ")
}

function normalizeTypes(types: PokemonSummaryDto["types"]): PokemonTypeValue[] {
  if (!Array.isArray(types)) {
    return []
  }

  return types.filter((value): value is PokemonTypeValue => isValidPokemonType(value))
}

export function toPokemonSummaryViewModel(dto: PokemonSummaryDto): PokemonSummaryViewModel {
  const typeValues = normalizeTypes(dto.types)
  const displayName = formatPokemonDisplayName(dto.name)

  return {
    ...dto,
    displayName,
    dexNumber: formatDexNumber(dto.pokemonId),
    spriteAlt: dto.spriteUrl ? `${displayName} sprite` : `${displayName} sprite niedostępny`,
    routeHref: `/pokemon/${dto.name}`,
    cardGradientClass: getTypeGradientClasses(typeValues),
    typeBadges: typeValues.map((value) => ({
      value,
      label: getTypeLabel(value),
      className: getTypeBadgeClass(value),
    })),
  }
}

export function buildPaginationViewModel(dto: PokemonListResponseDto): PaginationViewModel {
  const pageCount = dto.pageSize > 0 ? Math.ceil(dto.total / dto.pageSize) : 0

  return {
    page: dto.page,
    pageSize: dto.pageSize,
    total: dto.total,
    hasNext: dto.hasNext,
    pageCount,
    hasPrevious: dto.page > 1,
  }
}
