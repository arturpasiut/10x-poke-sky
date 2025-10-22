import type { MoveListResponseDto, MoveSummaryDto } from "@/types";
import { formatPokemonDisplayName, buildPaginationViewModel } from "@/lib/pokemon/transformers";
import { getTypeLabel, getTypeBadgeClass, isValidPokemonType } from "@/lib/pokemon/filters";
import type { PokemonTypeValue } from "@/lib/pokemon/types";
import type { MoveListViewModel, MoveSummaryViewModel } from "./types";

const normalizeType = (type: string | null | undefined): PokemonTypeValue | null => {
  if (!type) {
    return null;
  }

  const lower = type.toLowerCase();
  return isValidPokemonType(lower) ? (lower as PokemonTypeValue) : null;
};

const toMoveSummaryViewModel = (dto: MoveSummaryDto): MoveSummaryViewModel => {
  const type = normalizeType(dto.type);
  const displayName = formatPokemonDisplayName(dto.name);

  return {
    ...dto,
    displayName,
    badgeClass: type ? getTypeBadgeClass(type) : null,
    typeLabel: type ? getTypeLabel(type) : null,
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
