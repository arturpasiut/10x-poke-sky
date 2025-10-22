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
import type {
  MoveListQueryDto,
  MoveListQueryState,
  MoveQueryParseFailure,
  MoveQueryParseResult,
  MoveQueryResolvedFilters,
} from "./types";
import type { MoveSortKey, MoveSortOrder } from "./types";

const MOVE_SORT_KEYS: MoveSortKey[] = ["name", "power", "accuracy", "cachedAt"];
const SORT_ORDERS: MoveSortOrder[] = ["asc", "desc"];

export const sanitizeMoveSearchValue = (value: string | null | undefined): string => {
  const sanitized = sanitizePokemonSearchValue(value ?? "");
  return sanitized.slice(0, MOVE_MAX_SEARCH_LENGTH);
};

export const sanitizeMoveSortKey = (value: string | null | undefined): MoveSortKey => {
  if (!value || !MOVE_SORT_KEYS.includes(value as MoveSortKey)) {
    return DEFAULT_MOVE_SORT_KEY;
  }
  return value as MoveSortKey;
};

export const sanitizeMoveSortOrder = (value: string | null | undefined): MoveSortOrder => {
  if (!value || !SORT_ORDERS.includes(value as MoveSortOrder)) {
    return DEFAULT_MOVE_SORT_ORDER;
  }
  return value as MoveSortOrder;
};

export const sanitizeMovePowerValue = (value: string | number | null | undefined): number | null => {
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

export const sanitizeMovePageSizeValue = (value: string | number | null | undefined): number => {
  if (value == null) {
    return DEFAULT_MOVE_PAGE_SIZE;
  }

  const numeric = Number.parseInt(String(value), 10);

  if (MOVE_PAGE_SIZE_OPTIONS.includes(numeric as (typeof MOVE_PAGE_SIZE_OPTIONS)[number])) {
    return numeric;
  }

  return DEFAULT_MOVE_PAGE_SIZE;
};

const sanitizeMoveRegionValue = (value: string | null | undefined): PokemonRegionValue | null => {
  if (!value) {
    return null;
  }

  return isValidRegionValue(value) ? (value as PokemonRegionValue) : null;
};

const sanitizeMoveTypes = (values: readonly (string | PokemonTypeValue)[] | null | undefined): PokemonTypeValue[] => {
  if (!values || values.length === 0) {
    return [];
  }

  return sanitizeSelectedTypes(values);
};

type RawMoveQueryState = Record<string, unknown> & {
  type?: unknown;
  types?: unknown;
};

const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
};

export const DEFAULT_MOVE_QUERY_STATE: MoveListQueryState = {
  search: "",
  types: [],
  region: null,
  minPower: null,
  maxPower: null,
  sort: DEFAULT_MOVE_SORT_KEY,
  order: DEFAULT_MOVE_SORT_ORDER,
  page: MIN_PAGE,
  pageSize: DEFAULT_MOVE_PAGE_SIZE,
};

export const sanitizeMoveQueryState = (candidate?: RawMoveQueryState | null): MoveListQueryState => {
  const source = (candidate ?? {}) as RawMoveQueryState;

  const search = typeof source.search === "string" ? source.search : "";
  const rawTypes =
    Array.isArray(source.types) && source.types.every((item) => typeof item === "string")
      ? (source.types as (string | PokemonTypeValue)[])
      : toArray(source.type).filter((item): item is string => typeof item === "string");

  const region = typeof source.region === "string" ? source.region : null;
  const sort = typeof source.sort === "string" ? source.sort : null;
  const order = typeof source.order === "string" ? source.order : null;
  const page = typeof source.page === "number" || typeof source.page === "string" ? source.page : null;
  const pageSize =
    typeof source.pageSize === "number" || typeof source.pageSize === "string" ? source.pageSize : null;
  const minPower =
    typeof source.minPower === "number" || typeof source.minPower === "string" ? source.minPower : null;
  const maxPower =
    typeof source.maxPower === "number" || typeof source.maxPower === "string" ? source.maxPower : null;

  return {
    search: sanitizeMoveSearchValue(search),
    types: sanitizeMoveTypes(rawTypes),
    region: sanitizeMoveRegionValue(region),
    minPower: sanitizeMovePowerValue(minPower),
    maxPower: sanitizeMovePowerValue(maxPower),
    sort: sanitizeMoveSortKey(sort),
    order: sanitizeMoveSortOrder(order),
    page: sanitizePageValue(page),
    pageSize: sanitizeMovePageSizeValue(pageSize),
  };
};

export const createDefaultMoveQueryState = (
  overrides: Partial<MoveListQueryState> = {}
): MoveListQueryState => sanitizeMoveQueryState({ ...DEFAULT_MOVE_QUERY_STATE, ...overrides });

export const mergeMoveQueryState = (
  prev: MoveListQueryState,
  next: Partial<MoveListQueryState>
): MoveListQueryState => sanitizeMoveQueryState({ ...prev, ...next });

export const parseMoveQueryState = (input: URLSearchParams | string): MoveListQueryState => {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;

  return sanitizeMoveQueryState({
    search: params.get("search") ?? "",
    types: params.getAll("type"),
    region: params.get("region"),
    minPower: params.get("minPower"),
    maxPower: params.get("maxPower"),
    sort: params.get("sort"),
    order: params.get("order"),
    page: params.get("page"),
    pageSize: params.get("pageSize"),
  } satisfies RawMoveQueryState);
};

export const toMoveQueryDto = (state: MoveListQueryState): MoveListQueryDto => {
  const dto: MoveListQueryDto = {};

  const search = sanitizeMoveSearchValue(state.search);
  if (search) {
    dto.search = search.toLowerCase();
  }

  if (state.types.length > 0) {
    dto.type = sanitizeMoveTypes(state.types);
  }

  const region = sanitizeMoveRegionValue(state.region);
  if (region) {
    dto.region = region;
  }

  const minPower = sanitizeMovePowerValue(state.minPower);
  if (minPower !== null) {
    dto.minPower = minPower;
  }

  const maxPower = sanitizeMovePowerValue(state.maxPower);
  if (maxPower !== null) {
    dto.maxPower = maxPower;
  }

  dto.sort = sanitizeMoveSortKey(state.sort);
  dto.order = sanitizeMoveSortOrder(state.order);
  dto.page = sanitizePageValue(state.page);
  dto.pageSize = sanitizeMovePageSizeValue(state.pageSize);

  return dto;
};

export const toMoveQueryString = (state: MoveListQueryState): string => {
  const dto = toMoveQueryDto(state);
  const params = new URLSearchParams();

  if (dto.search) {
    params.set("search", dto.search);
  }

  dto.type?.forEach((type) => params.append("type", type));

  if (dto.region) {
    params.set("region", dto.region);
  }

  if (dto.minPower !== undefined) {
    params.set("minPower", String(dto.minPower));
  }

  if (dto.maxPower !== undefined) {
    params.set("maxPower", String(dto.maxPower));
  }

  if (dto.sort && dto.sort !== DEFAULT_MOVE_SORT_KEY) {
    params.set("sort", dto.sort);
  }

  if (dto.order && dto.order !== DEFAULT_MOVE_SORT_ORDER) {
    params.set("order", dto.order);
  }

  if (dto.page && dto.page !== MIN_PAGE) {
    params.set("page", String(dto.page));
  }

  if (dto.pageSize && dto.pageSize !== DEFAULT_MOVE_PAGE_SIZE) {
    params.set("pageSize", String(dto.pageSize));
  }

  return params.toString();
};

export const buildMoveRequestUrl = (baseUrl: string, state: MoveListQueryState): string => {
  const query = toMoveQueryString(state);

  if (!query) {
    return baseUrl;
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${query}`;
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
    const sanitized = sanitizeMoveQueryState({
      search: input.search,
      types: input.types,
      region: input.region,
      minPower: input.minPower,
      maxPower: input.maxPower,
      sort: input.sort,
      order: input.order,
      page: input.page,
      pageSize: input.pageSize,
    });

    return sanitized;
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

  return {
    ok: true,
    data: result.data,
  };
};

export const buildMoveQueryFilters = (state: MoveListQueryState): MoveQueryResolvedFilters => {
  const generations = resolveGenerationsForRegion(state.region);

  return {
    ...state,
    generations,
  };
};
