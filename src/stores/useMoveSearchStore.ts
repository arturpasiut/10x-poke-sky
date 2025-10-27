import { create } from "zustand";

import { MIN_PAGE } from "@/lib/moves/constants";
import {
  createDefaultMoveQueryState,
  mergeMoveQueryState,
  parseMoveQueryState,
  sanitizeMovePowerValue,
  sanitizeMoveSortKey,
  sanitizeMoveSortOrder,
  sanitizeMoveQueryState,
  sanitizeMoveSearchValue,
  sanitizeMoveDamageClasses,
  sanitizeMovePageSizeValue,
  toMoveQueryDto,
  toMoveQueryString,
} from "@/lib/moves/query";
import type { MoveListQueryDto, MoveListQueryState, MoveSortKey, MoveSortOrder } from "@/lib/moves/types";
import type { MoveDamageClassValue } from "@/types";
import type { PokemonRegionValue, PokemonTypeValue } from "@/lib/pokemon/types";

export type MoveSearchStore = MoveListQueryState & {
  isHydrated: boolean;
  lastAppliedQuery: MoveListQueryState;
  initialiseFromUrl: (params: string | URLSearchParams | Partial<MoveListQueryState> | null | undefined) => void;
  replaceFromUrl: (params: string | URLSearchParams | Partial<MoveListQueryState> | null | undefined) => void;
  setSearch: (value: string) => void;
  setTypes: (values: PokemonTypeValue[]) => void;
  toggleType: (value: PokemonTypeValue) => void;
  setDamageClasses: (values: MoveDamageClassValue[]) => void;
  toggleDamageClass: (value: MoveDamageClassValue) => void;
  setRegion: (value: PokemonRegionValue | null) => void;
  setSort: (value: MoveSortKey) => void;
  setOrder: (value: MoveSortOrder) => void;
  toggleOrder: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setMinPower: (value: number | null) => void;
  setMaxPower: (value: number | null) => void;
  resetFilters: () => void;
  resetAll: () => void;
  commitQuery: () => void;
  restoreLastApplied: () => void;
  toQueryString: () => string;
  toQueryDto: () => MoveListQueryDto;
};

const selectSanitizedTypes = (values: PokemonTypeValue[]): PokemonTypeValue[] => {
  const sanitized = sanitizeMoveQueryState({ types: values }).types;
  return sanitized;
};

const extractQueryState = (source: MoveSearchStore | MoveListQueryState): MoveListQueryState => ({
  search: source.search,
  types: [...source.types],
  damageClasses: [...source.damageClasses],
  region: source.region,
  minPower: source.minPower,
  maxPower: source.maxPower,
  sort: source.sort,
  order: source.order,
  page: source.page,
  pageSize: source.pageSize,
});

const createInitialState = (): MoveSearchStore => {
  const initialState = createDefaultMoveQueryState();

  return {
    ...initialState,
    isHydrated: false,
    lastAppliedQuery: extractQueryState(initialState),
    initialiseFromUrl: () => undefined,
    replaceFromUrl: () => undefined,
    setSearch: () => undefined,
    setTypes: () => undefined,
    toggleType: () => undefined,
    setDamageClasses: () => undefined,
    toggleDamageClass: () => undefined,
    setRegion: () => undefined,
    setSort: () => undefined,
    setOrder: () => undefined,
    toggleOrder: () => undefined,
    setPage: () => undefined,
    setPageSize: () => undefined,
    setMinPower: () => undefined,
    setMaxPower: () => undefined,
    resetFilters: () => undefined,
    resetAll: () => undefined,
    commitQuery: () => undefined,
    restoreLastApplied: () => undefined,
    toQueryString: () => "",
    toQueryDto: () => toMoveQueryDto(initialState),
  };
};

const deriveQueryState = (
  params: string | URLSearchParams | Partial<MoveListQueryState> | null | undefined
): MoveListQueryState => {
  if (typeof params === "string" || params instanceof URLSearchParams) {
    return parseMoveQueryState(params);
  }
  return sanitizeMoveQueryState(params ?? {});
};

export const useMoveSearchStore = create<MoveSearchStore>()((set, get) => ({
  ...createInitialState(),
  initialiseFromUrl(params) {
    if (get().isHydrated) {
      return;
    }
    const nextState = deriveQueryState(params);
    set({
      ...nextState,
      isHydrated: true,
      lastAppliedQuery: extractQueryState(nextState),
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
    set((state) =>
      mergeMoveQueryState(state, {
        search: sanitizeMoveSearchValue(value),
        page: MIN_PAGE,
      })
    );
  },
  setTypes(values) {
    set((state) =>
      mergeMoveQueryState(state, {
        types: selectSanitizedTypes(values),
        page: MIN_PAGE,
      })
    );
  },
  toggleType(value) {
    set((state) => {
      const alreadySelected = state.types.includes(value);

      const nextTypes = alreadySelected ? state.types.filter((type) => type !== value) : [...state.types, value];

      return mergeMoveQueryState(state, {
        types: selectSanitizedTypes(nextTypes),
        page: MIN_PAGE,
      });
    });
  },
  setDamageClasses(values) {
    set((state) =>
      mergeMoveQueryState(state, {
        damageClasses: sanitizeMoveDamageClasses(values),
        page: MIN_PAGE,
      })
    );
  },
  toggleDamageClass(value) {
    set((state) => {
      const alreadySelected = state.damageClasses.includes(value);

      const next = alreadySelected
        ? state.damageClasses.filter((entry) => entry !== value)
        : [...state.damageClasses, value];

      return mergeMoveQueryState(state, {
        damageClasses: sanitizeMoveDamageClasses(next),
        page: MIN_PAGE,
      });
    });
  },
  setRegion(value) {
    set((state) =>
      mergeMoveQueryState(state, {
        region: value ?? null,
        page: MIN_PAGE,
      })
    );
  },
  setSort(value) {
    set((state) =>
      mergeMoveQueryState(state, {
        sort: sanitizeMoveSortKey(value),
        page: MIN_PAGE,
      })
    );
  },
  setOrder(value) {
    set((state) =>
      mergeMoveQueryState(state, {
        order: sanitizeMoveSortOrder(value),
        page: MIN_PAGE,
      })
    );
  },
  toggleOrder() {
    set((state) =>
      mergeMoveQueryState(state, {
        order: state.order === "asc" ? "desc" : "asc",
        page: MIN_PAGE,
      })
    );
  },
  setPage(page) {
    set((state) =>
      mergeMoveQueryState(state, {
        page,
      })
    );
  },
  setPageSize(pageSize) {
    const sanitized = sanitizeMovePageSizeValue(pageSize);
    set((state) =>
      mergeMoveQueryState(state, {
        pageSize: sanitized,
        page: MIN_PAGE,
      })
    );
  },
  setMinPower(value) {
    set((state) => {
      const nextMin = sanitizeMovePowerValue(value);
      let nextMax = state.maxPower;

      if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
        nextMax = nextMin;
      }

      if (nextMin === null) {
        return mergeMoveQueryState(state, {
          minPower: null,
          maxPower: nextMax,
          page: MIN_PAGE,
        });
      }

      return mergeMoveQueryState(state, {
        minPower: nextMin,
        maxPower: nextMax,
        page: MIN_PAGE,
      });
    });
  },
  setMaxPower(value) {
    set((state) => {
      const nextMax = sanitizeMovePowerValue(value);
      let nextMin = state.minPower;

      if (nextMax !== null && nextMin !== null && nextMax < nextMin) {
        nextMin = nextMax;
      }

      if (nextMax === null) {
        return mergeMoveQueryState(state, {
          maxPower: null,
          minPower: nextMin,
          page: MIN_PAGE,
        });
      }

      return mergeMoveQueryState(state, {
        maxPower: nextMax,
        minPower: nextMin,
        page: MIN_PAGE,
      });
    });
  },
  resetFilters() {
    set((state) =>
      mergeMoveQueryState(state, {
        types: [],
        damageClasses: [],
        region: null,
        minPower: null,
        maxPower: null,
        page: MIN_PAGE,
      })
    );
  },
  resetAll() {
    const next = createDefaultMoveQueryState();
    set({
      ...next,
      isHydrated: true,
      lastAppliedQuery: extractQueryState(next),
    });
  },
  commitQuery() {
    const current = get();
    const committed = extractQueryState(current);
    set({
      lastAppliedQuery: committed,
    });
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
    return toMoveQueryString(get());
  },
  toQueryDto() {
    return toMoveQueryDto(get());
  },
}));

export const selectMoveQueryState = (state: MoveSearchStore): MoveListQueryState => ({
  search: state.search,
  types: state.types,
  damageClasses: state.damageClasses,
  region: state.region,
  minPower: state.minPower,
  maxPower: state.maxPower,
  sort: state.sort,
  order: state.order,
  page: state.page,
  pageSize: state.pageSize,
});

export const selectMoveQueryString = (state: MoveSearchStore): string => state.toQueryString();
export const selectMoveQueryDto = (state: MoveSearchStore): MoveListQueryDto => state.toQueryDto();
export const selectMoveIsHydrated = (state: MoveSearchStore): boolean => state.isHydrated;
export const selectMoveLastApplied = (state: MoveSearchStore): MoveListQueryState => state.lastAppliedQuery;
