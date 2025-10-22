import { pokeApiEndpoints } from "@/lib/env";
import { resolveRegionForGeneration } from "./constants";
import type { MoveListQueryState } from "./types";
import type { MoveListResponseDto, MoveSummaryDto } from "@/types";

interface MoveSeedEntry {
  summary: MoveSummaryDto;
  payload: Record<string, unknown>;
}

const MOVE_REQUEST_LIMIT = 2000;
const MOVE_FETCH_BATCH_SIZE = 20;

let cachedMoves: MoveSeedEntry[] | null = null;
let loadPromise: Promise<MoveSeedEntry[]> | null = null;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI request failed for ${url} with status ${response.status}`);
  }

  return (await response.json()) as T;
};

const extractIdFromUrl = (url: string): number => {
  const segments = url
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const id = Number.parseInt(segments[segments.length - 1] ?? "", 10);
  return Number.isFinite(id) ? id : 0;
};

const toSummary = (payload: Record<string, unknown>): MoveSummaryDto => {
  const rawId = Number(payload?.id);
  const moveId = Number.isFinite(rawId) ? rawId : 0;

  return {
    moveId,
    name: (payload?.name as string) ?? "unknown",
    type: (payload?.type as { name?: string } | undefined)?.name ?? null,
    power: typeof payload?.power === "number" ? payload.power : null,
    accuracy: typeof payload?.accuracy === "number" ? payload.accuracy : null,
    pp: typeof payload?.pp === "number" ? payload.pp : null,
    generation: (payload?.generation as { name?: string } | undefined)?.name ?? null,
    cachedAt: new Date().toISOString(),
  };
};

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
};

const loadAllMovesFromPokeApi = async (): Promise<MoveSeedEntry[]> => {
  const list = await fetchJson<{
    results: { name: string; url: string }[];
  }>(`${pokeApiEndpoints.moves}?limit=${MOVE_REQUEST_LIMIT}`);

  const results = Array.isArray(list.results) ? list.results : [];
  const batches = chunk(results, MOVE_FETCH_BATCH_SIZE);
  const aggregated: MoveSeedEntry[] = [];

  for (const batch of batches) {
    const details = await Promise.all(
      batch.map(async (item) => {
        const payload = await fetchJson<Record<string, unknown>>(item.url);
        const summary = toSummary(payload);

        if (!summary.moveId) {
          summary.moveId = extractIdFromUrl(item.url);
        }

        return {
          summary,
          payload,
        } satisfies MoveSeedEntry;
      })
    );

    aggregated.push(...details);
  }

  return aggregated;
};

export const getCachedMoveSeedData = async (): Promise<MoveSeedEntry[]> => {
  if (cachedMoves) {
    return cachedMoves;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = loadAllMovesFromPokeApi()
    .then((entries) => {
      cachedMoves = entries;
      return entries;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
};

const compareValues = (a: unknown, b: unknown): number => {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  const stringA = String(a).toLowerCase();
  const stringB = String(b).toLowerCase();

  if (stringA === stringB) {
    return 0;
  }

  return stringA < stringB ? -1 : 1;
};

const sortMoves = (
  moves: MoveSummaryDto[],
  sortKey: MoveListQueryState["sort"],
  order: MoveListQueryState["order"]
) => {
  const direction = order === "asc" ? 1 : -1;

  return moves.sort((left, right) => {
    let comparison = 0;

    switch (sortKey) {
      case "power":
        comparison = compareValues(left.power, right.power);
        break;
      case "accuracy":
        comparison = compareValues(left.accuracy, right.accuracy);
        break;
      case "cachedAt":
        comparison = compareValues(left.cachedAt, right.cachedAt);
        break;
      case "name":
      default:
        comparison = compareValues(left.name, right.name);
        break;
    }

    return comparison * direction;
  });
};

const filterMoves = (moves: MoveSummaryDto[], state: MoveListQueryState): MoveSummaryDto[] => {
  return moves.filter((move) => {
    if (state.search) {
      if (!move.name.toLowerCase().includes(state.search.toLowerCase())) {
        return false;
      }
    }

    if (state.types.length > 0 && (move.type == null || !state.types.includes(move.type))) {
      return false;
    }

    if (state.region) {
      const region = resolveRegionForGeneration(move.generation);
      if (region !== state.region) {
        return false;
      }
    }

    if (state.minPower !== null) {
      if (move.power == null || move.power < state.minPower) {
        return false;
      }
    }

    if (state.maxPower !== null) {
      if (move.power == null || move.power > state.maxPower) {
        return false;
      }
    }

    return true;
  });
};

export const buildMoveListFromDataset = (dataset: MoveSummaryDto[], state: MoveListQueryState): MoveListResponseDto => {
  const filtered = filterMoves([...dataset], state);
  sortMoves(filtered, state.sort, state.order);

  const total = filtered.length;
  const startIndex = (state.page - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  const items = filtered.slice(startIndex, endIndex);

  return {
    items,
    page: state.page,
    pageSize: state.pageSize,
    total,
    hasNext: endIndex < total,
  };
};

export const buildFallbackMoveList = async (state: MoveListQueryState): Promise<MoveListResponseDto> => {
  const dataset = await getCachedMoveSeedData();
  const summaries = dataset.map((entry) => entry.summary);

  return buildMoveListFromDataset(summaries, state);
};
