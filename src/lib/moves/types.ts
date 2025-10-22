import type {
  ApiError,
  FilterOption,
  PaginationViewModel,
  PokemonGenerationValue,
  PokemonRegionValue,
  PokemonTypeValue,
} from "@/lib/pokemon/types";
import type { MoveListResponseDto, MoveSummaryDto } from "@/types";

export type MoveSortKey = "name" | "power" | "accuracy" | "cachedAt";
export type MoveSortOrder = "asc" | "desc";

export interface MoveListQueryFilters {
  search: string;
  types: PokemonTypeValue[];
  region: PokemonRegionValue | null;
  minPower: number | null;
  maxPower: number | null;
}

export type MoveListQueryState = MoveListQueryFilters & {
  sort: MoveSortKey;
  order: MoveSortOrder;
  page: number;
  pageSize: number;
};

export interface MoveListResult {
  items: MoveListResponseDto["items"];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

export interface MoveListQueryDto {
  search?: string;
  type?: PokemonTypeValue[];
  region?: PokemonRegionValue;
  minPower?: number;
  maxPower?: number;
  sort?: MoveSortKey;
  order?: MoveSortOrder;
  page?: number;
  pageSize?: number;
}

export interface MoveQueryParseSuccess {
  ok: true;
  data: MoveListQueryState;
}

export interface MoveQueryParseFailure {
  ok: false;
  status: number;
  message: string;
  details?: unknown;
}

export type MoveQueryParseResult = MoveQueryParseSuccess | MoveQueryParseFailure;

export interface MoveSummaryViewModel extends MoveSummaryDto {
  displayName: string;
  badgeClass: string | null;
  typeLabel: string | null;
  gradientClass: string;
  typeValue: PokemonTypeValue | null;
  generationLabel: string;
  cachedAtLabel: string;
}

export interface MoveListViewModel {
  items: MoveSummaryViewModel[];
  pagination: PaginationViewModel;
  list: MoveListResponseDto;
}

export interface MoveListQueryResult {
  status: "idle" | "loading" | "success" | "error";
  data?: MoveListViewModel;
  error?: ApiError;
  isFetching: boolean;
  retry: () => void;
}

export interface MoveAvailableFilters {
  types: FilterOption<PokemonTypeValue>[];
  regions: FilterOption<PokemonRegionValue>[];
}

export interface MoveQueryResolvedFilters extends MoveListQueryState {
  generations: PokemonGenerationValue[];
}
