import { z } from "zod";

import {
  DEFAULT_MOVE_PAGE_SIZE,
  DEFAULT_MOVE_SORT_KEY,
  DEFAULT_MOVE_SORT_ORDER,
  MIN_PAGE,
  MOVE_MAX_POWER,
  MOVE_MAX_SEARCH_LENGTH,
  MOVE_MIN_POWER,
  MOVE_PAGE_SIZE_OPTIONS,
  isValidRegionValue,
  resolveGenerationsForRegion,
} from "./constants";
import { sanitizeSelectedTypes } from "@/lib/pokemon/filters";
import { sanitizeSearchValue as sanitizePokemonSearchValue, sanitizePageValue } from "@/lib/pokemon/query";
import type { PokemonGenerationValue, PokemonRegionValue, PokemonTypeValue } from "@/lib/pokemon/types";
import type { MoveListQueryState, MoveQueryParseFailure, MoveQueryParseResult } from "./types";
import { type MoveSortKey, type MoveSortOrder } from "./types";

const MOVE_SORT_KEYS: MoveSortKey[] = ["name", "power", "accuracy", "cachedAt"];
const SORT_ORDERS: MoveSortOrder[] = ["asc", "desc"];

const sanitizeSearchValue = (value: string | null | undefined): string => {
  const sanitized = sanitizePokemonSearchValue(value ?? "");
  return sanitized.slice(0, MOVE_MAX_SEARCH_LENGTH);
};

const sanitizeSortKey = (value: string | null | undefined): MoveSortKey => {
  if (!value || !MOVE_SORT_KEYS.includes(value as MoveSortKey)) {
    return DEFAULT_MOVE_SORT_KEY;
  }
  return value as MoveSortKey;
};

const sanitizeSortOrder = (value: string | null | undefined): MoveSortOrder => {
  if (!value || !SORT_ORDERS.includes(value as MoveSortOrder)) {
    return DEFAULT_MOVE_SORT_ORDER;
  }
  return value as MoveSortOrder;
};

const sanitizePowerValue = (value: string | number | null | undefined): number | null => {
  if (value == null) {
    return null;
  }

  const numeric = Number.parseInt(String(value), 10);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric < MOVE_MIN_POWER || numeric > MOVE_MAX_POWER) {
    return null;
  }

  return numeric;
};

const sanitizePageSize = (value: string | number | null | undefined): number => {
  if (value == null) {
    return DEFAULT_MOVE_PAGE_SIZE;
  }

  const numeric = Number.parseInt(String(value), 10);

  if (MOVE_PAGE_SIZE_OPTIONS.includes(numeric as (typeof MOVE_PAGE_SIZE_OPTIONS)[number])) {
    return numeric;
  }

  return DEFAULT_MOVE_PAGE_SIZE;
};

const MoveQuerySchema = z
  .object({
    search: z.string().optional(),
    region: z.string().optional(),
    minPower: z.string().optional(),
    maxPower: z.string().optional(),
    sort: z.string().optional(),
    order: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
    types: z.array(z.string()).optional(),
  })
  .transform((input) => {
    const sanitizedSearch = sanitizeSearchValue(input.search);
    const sanitizedTypes = sanitizeSelectedTypes(input.types ?? []);
    const region = input.region && isValidRegionValue(input.region) ? (input.region as PokemonRegionValue) : null;
    const minPower = sanitizePowerValue(input.minPower);
    const maxPower = sanitizePowerValue(input.maxPower);
    const sort = sanitizeSortKey(input.sort);
    const order = sanitizeSortOrder(input.order);
    const page = sanitizePageValue(input.page ?? MIN_PAGE);
    const pageSize = sanitizePageSize(input.pageSize);

    return {
      search: sanitizedSearch,
      types: sanitizedTypes,
      region,
      minPower,
      maxPower,
      sort,
      order,
      page,
      pageSize,
    };
  })
  .superRefine((value, ctx) => {
    if (value.minPower !== null && value.maxPower !== null && value.minPower > value.maxPower) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parametr `minPower` nie może być większy niż `maxPower`.",
        path: ["minPower"],
      });
    }
  });

export const parseMoveQuery = (params: URLSearchParams): MoveQueryParseResult => {
  const raw = {
    search: params.get("search") ?? undefined,
    types: params.getAll("type"),
    region: params.get("region") ?? undefined,
    minPower: params.get("minPower") ?? undefined,
    maxPower: params.get("maxPower") ?? undefined,
    sort: params.get("sort") ?? undefined,
    order: params.get("order") ?? undefined,
    page: params.get("page") ?? undefined,
    pageSize: params.get("pageSize") ?? undefined,
  };

  const result = MoveQuerySchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.flatten();
    return {
      ok: false,
      status: 400,
      message: "Niepoprawne parametry zapytania.",
      details,
    } satisfies MoveQueryParseFailure;
  }

  const data: MoveListQueryState = {
    ...result.data,
  };

  return {
    ok: true,
    data,
  };
};

export interface MoveQueryResolvedFilters extends MoveListQueryState {
  generations: PokemonGenerationValue[];
}

export const buildMoveQueryFilters = (state: MoveListQueryState): MoveQueryResolvedFilters => {
  const generations = resolveGenerationsForRegion(state.region);

  return {
    ...state,
    generations,
  };
};
