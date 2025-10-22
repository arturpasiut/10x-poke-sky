import type { PokemonRegionValue, PokemonTypeValue } from "@/lib/pokemon/types";
import type { MoveListResponseDto } from "@/types";

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

export interface MoveListQueryOptions extends MoveListQueryState {}

export interface MoveListResult {
  items: MoveListResponseDto["items"];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
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
