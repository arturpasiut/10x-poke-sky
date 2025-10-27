import { create } from "zustand";

import {
  MIN_PAGE,
  createDefaultQueryState,
  mergeQueryState,
  parseQueryState,
  sanitizePageValue,
  sanitizeQueryState,
  sanitizeSearchValue,
  sanitizeSortKey,
  sanitizeSortOrder,
  toQueryDto,
  toQueryString,
} from "@/lib/pokemon/query";
import { MAX_SELECTED_TYPES, sanitizeSelectedTypes } from "@/lib/pokemon/filters";
import type {
  PokemonGenerationValue,
  PokemonListQueryDto,
  PokemonListQueryState,
  PokemonRegionValue,
  PokemonSortKey,
  PokemonSortOrder,
  PokemonTypeValue,
} from "@/lib/pokemon/types";

export type PokemonSearchStore = PokemonListQueryState & {
  isHydrated: boolean;
  lastAppliedQuery: PokemonListQueryState;
  initialiseFromUrl: (params: string | URLSearchParams | Partial<PokemonListQueryState> | null | undefined) => void;
  replaceFromUrl: (params: string | URLSearchParams | Partial<PokemonListQueryState> | null | undefined) => void;
  setSearch: (value: string) => void;
  setTypes: (values: PokemonTypeValue[]) => void;
  toggleType: (value: PokemonTypeValue) => void;
  setGeneration: (value: PokemonGenerationValue | null) => void;
  setRegion: (value: PokemonRegionValue | null) => void;
  setSort: (value: PokemonSortKey) => void;
  setOrder: (value: PokemonSortOrder) => void;
  toggleOrder: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
  resetAll: () => void;
  commitQuery: () => void;
  restoreLastApplied: () => void;
  toQueryString: () => string;
  toQueryDto: () => PokemonListQueryDto;
};

function selectSanitizedTypes(values: PokemonTypeValue[]): PokemonTypeValue[] {
  return sanitizeSelectedTypes(values);
}

function extractQueryState(source: PokemonSearchStore | PokemonListQueryState): PokemonListQueryState {
  return {
    search: source.search,
    types: [...source.types],
    generation: source.generation,
    region: source.region,
    sort: source.sort,
    order: source.order,
    page: source.page,
    pageSize: source.pageSize,
  };
}

function createInitialState(): PokemonSearchStore {
  const initialState = createDefaultQueryState();

  return {
    ...initialState,
    isHydrated: false,
    lastAppliedQuery: extractQueryState(initialState),
    initialiseFromUrl: () => undefined,
    replaceFromUrl: () => undefined,
    setSearch: () => undefined,
    setTypes: () => undefined,
    toggleType: () => undefined,
    setGeneration: () => undefined,
    setRegion: () => undefined,
    setSort: () => undefined,
    setOrder: () => undefined,
    toggleOrder: () => undefined,
    setPage: () => undefined,
    setPageSize: () => undefined,
    resetFilters: () => undefined,
    resetAll: () => undefined,
    commitQuery: () => undefined,
    restoreLastApplied: () => undefined,
    toQueryString: () => "",
    toQueryDto: () => toQueryDto(initialState),
  };
}

function deriveQueryState(
  params: string | URLSearchParams | Partial<PokemonListQueryState> | null | undefined
): PokemonListQueryState {
  return typeof params === "string" || params instanceof URLSearchParams
    ? parseQueryState(params)
    : sanitizeQueryState(params);
}

export const usePokemonSearchStore = create<PokemonSearchStore>()((set, get) => ({
  ...createInitialState(),
  initialiseFromUrl(params) {
    if (get().isHydrated) {
      return;
    }

    const nextState = deriveQueryState(params);

    set({
      ...nextState,
      isHydrated: true,
      lastAppliedQuery: nextState,
    });
  },
  replaceFromUrl(params) {
    const nextState = deriveQueryState(params);
    set({
      ...nextState,
      isHydrated: true,
      lastAppliedQuery: extractQueryState(nextState),
    });
  },
  setSearch(value) {
    set((state) => mergeQueryState(state, { search: sanitizeSearchValue(value), page: MIN_PAGE }));
  },
  setTypes(values) {
    set((state) => mergeQueryState(state, { types: selectSanitizedTypes(values), page: MIN_PAGE }));
  },
  toggleType(value) {
    set((state) => {
      const alreadySelected = state.types.includes(value);
      const nextTypes = alreadySelected
        ? state.types.filter((type) => type !== value)
        : state.types.length >= MAX_SELECTED_TYPES
          ? state.types
          : [...state.types, value];

      return mergeQueryState(state, { types: nextTypes, page: MIN_PAGE });
    });
  },
  setGeneration(value) {
    set((state) => mergeQueryState(state, { generation: value ?? null, page: MIN_PAGE }));
  },
  setRegion(value) {
    set((state) => mergeQueryState(state, { region: value ?? null, page: MIN_PAGE }));
  },
  setSort(value) {
    set((state) => mergeQueryState(state, { sort: sanitizeSortKey(value), page: MIN_PAGE }));
  },
  setOrder(value) {
    set((state) => mergeQueryState(state, { order: sanitizeSortOrder(value), page: MIN_PAGE }));
  },
  toggleOrder() {
    set((state) =>
      mergeQueryState(state, {
        order: state.order === "asc" ? "desc" : "asc",
        page: MIN_PAGE,
      })
    );
  },
  setPage(page) {
    set((state) => mergeQueryState(state, { page: sanitizePageValue(page) }));
  },
  setPageSize(pageSize) {
    set((state) =>
      mergeQueryState(state, {
        pageSize,
        page: MIN_PAGE,
      })
    );
  },
  resetFilters() {
    set((state) =>
      mergeQueryState(state, {
        types: [],
        generation: null,
        region: null,
        page: MIN_PAGE,
      })
    );
  },
  resetAll() {
    const next = createDefaultQueryState();
    set({
      ...next,
      isHydrated: true,
      lastAppliedQuery: extractQueryState(next),
    });
  },
  commitQuery() {
    const current = get();
    const committed = extractQueryState(current);
    set({ lastAppliedQuery: committed });
  },
  restoreLastApplied() {
    set((state) => {
      const restored = extractQueryState(state.lastAppliedQuery);
      return {
        ...restored,
        lastAppliedQuery: restored,
        isHydrated: true,
      };
    });
  },
  toQueryString() {
    return toQueryString(get());
  },
  toQueryDto() {
    return toQueryDto(get());
  },
}));

export const selectPokemonQueryState = (state: PokemonSearchStore): PokemonListQueryState => ({
  search: state.search,
  types: state.types,
  generation: state.generation,
  region: state.region,
  sort: state.sort,
  order: state.order,
  page: state.page,
  pageSize: state.pageSize,
});

export const selectIsHydrated = (state: PokemonSearchStore) => state.isHydrated;
export const selectLastAppliedQuery = (state: PokemonSearchStore) => state.lastAppliedQuery;
export const selectPokemonQueryString = (state: PokemonSearchStore) => state.toQueryString();
export const selectPokemonQueryDto = (state: PokemonSearchStore) => state.toQueryDto();
