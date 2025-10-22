import type { MoveListResponseDto, MoveSummaryDto } from "@/types";
import { formatPokemonDisplayName, buildPaginationViewModel } from "@/lib/pokemon/transformers";
import {
  getTypeLabel,
  getTypeBadgeClass,
  getTypeGradientClasses,
  isValidPokemonType,
  isValidGeneration,
  getGenerationLabel,
} from "@/lib/pokemon/filters";
import type { PokemonGenerationValue, PokemonTypeValue } from "@/lib/pokemon/types";
import type { MoveListViewModel, MoveSummaryViewModel } from "./types";

const normalizeType = (type: string | null | undefined): PokemonTypeValue | null => {
  if (!type) {
    return null;
  }

  const lower = type.toLowerCase();
  return isValidPokemonType(lower) ? (lower as PokemonTypeValue) : null;
};

const formatCachedAt = (() => {
  const formatter =
    typeof Intl !== "undefined"
      ? new Intl.DateTimeFormat("pl-PL", { year: "numeric", month: "short", day: "numeric" })
      : null;

  return (value: string) => {
    if (!value) {
      return "Brak danych";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return formatter ? formatter.format(date) : date.toLocaleDateString();
  };
})();

const toMoveSummaryViewModel = (dto: MoveSummaryDto): MoveSummaryViewModel => {
  const type = normalizeType(dto.type);
  const displayName = formatPokemonDisplayName(dto.name);
  const generationValue =
    dto.generation && isValidGeneration(dto.generation) ? (dto.generation as PokemonGenerationValue) : null;

  return {
    ...dto,
    displayName,
    badgeClass: type ? getTypeBadgeClass(type) : null,
    typeLabel: type ? getTypeLabel(type) : null,
    gradientClass: getTypeGradientClasses(type ? [type] : []),
    typeValue: type,
    generationLabel: generationValue ? getGenerationLabel(generationValue) : "Brak danych",
    cachedAtLabel: formatCachedAt(dto.cachedAt),
  };
};

export const buildMoveListViewModel = (list: MoveListResponseDto): MoveListViewModel => {
  const pagination = buildPaginationViewModel(list);

  return {
    items: list.items.map(toMoveSummaryViewModel),
    pagination,
    list,
  };
};
