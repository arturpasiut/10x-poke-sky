import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types.ts";
import type { MoveListResponseDto, MoveSummaryDto } from "@/types";
import { buildMoveQueryFilters } from "./query";
import type { MoveListQueryState, MoveQueryResolvedFilters, MoveSortKey } from "./types";

type Supabase = SupabaseClient<Database>;

const SORT_COLUMN_MAP: Record<MoveSortKey, keyof Database["public"]["Tables"]["moves_cache"]["Row"]> = {
  name: "name",
  power: "power",
  accuracy: "accuracy",
  cachedAt: "cached_at",
};

export class MoveServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "MoveServiceError";
  }
}

const toMoveSummaryDto = (row: Database["public"]["Tables"]["moves_cache"]["Row"]): MoveSummaryDto => ({
  moveId: row.move_id,
  name: row.name,
  type: row.type,
  power: row.power,
  accuracy: row.accuracy,
  pp: row.pp,
  generation: row.generation,
  cachedAt: row.cached_at,
});

const applyFilters = (
  query: ReturnType<Supabase["from"]>,
  filters: MoveQueryResolvedFilters
): ReturnType<Supabase["from"]> => {
  let builder = query;

  if (filters.search) {
    builder = builder.ilike("name", `%${filters.search}%`);
  }

  if (filters.types.length > 0) {
    builder = builder.in("type", filters.types);
  }

  if (filters.generations.length > 0) {
    builder = builder.in("generation", filters.generations);
  }

  if (filters.minPower !== null) {
    builder = builder.gte("power", filters.minPower);
  }

  if (filters.maxPower !== null) {
    builder = builder.lte("power", filters.maxPower);
  }

  return builder;
};

export const fetchMoveList = async (
  supabase: Supabase,
  state: MoveListQueryState
): Promise<MoveListResponseDto> => {
  const filters = buildMoveQueryFilters(state);
  const from = (state.page - 1) * state.pageSize;
  const to = from + state.pageSize - 1;

  const sortColumn = SORT_COLUMN_MAP[state.sort];

  let query = supabase
    .from("moves_cache")
    .select("move_id,name,type,power,accuracy,pp,generation,cached_at", { count: "exact" })
    .order(sortColumn, {
      ascending: state.order === "asc",
      nullsLast: true,
    })
    .order("move_id", { ascending: true });

  query = applyFilters(query, filters).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new MoveServiceError("Nie udało się pobrać listy ruchów.", 500, error.code, error);
  }

  const items = (data ?? []).map(toMoveSummaryDto);
  const total = count ?? items.length;
  const page = state.page;
  const pageSize = state.pageSize;
  const hasNext = to + 1 < total;

  return {
    items,
    page,
    pageSize,
    total,
    hasNext,
  };
};
