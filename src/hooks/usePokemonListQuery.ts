import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildRequestUrl, toQueryString } from "@/lib/pokemon/query";
import { buildPaginationViewModel, toPokemonSummaryViewModel } from "@/lib/pokemon/transformers";
import type {
  ApiError,
  PaginationViewModel,
  PokemonListQueryResult,
  PokemonListQueryState,
  PokemonSummaryViewModel,
} from "@/lib/pokemon/types";
import type { PokemonListResponseDto } from "@/types";

interface UsePokemonListQueryOptions {
  enabled?: boolean;
  /**
   * Override fetch implementation for testing.
   */
  fetcher?: typeof fetch;
  /**
   * Custom endpoint (defaults to `/api/pokemon`).
   */
  endpoint?: string;
}

const DEFAULT_ENDPOINT = "/api/pokemon";

interface RequestSnapshot {
  state: PokemonListQueryState;
  url: string;
}

type QueryStatus = PokemonListQueryResult["status"];

const defaultFetcher: typeof fetch | undefined = typeof fetch === "function" ? fetch.bind(globalThis) : undefined;

export function usePokemonListQuery(
  queryState: PokemonListQueryState,
  options: UsePokemonListQueryOptions = {}
): PokemonListQueryResult {
  const { enabled = true, fetcher = defaultFetcher, endpoint = DEFAULT_ENDPOINT } = options;
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<RequestSnapshot | null>(null);
  const mountedRef = useRef(false);

  const [status, setStatus] = useState<QueryStatus>("idle");
  const [isFetching, setIsFetching] = useState(false);
  const [response, setResponse] = useState<PokemonListResponseDto | undefined>(undefined);
  const [items, setItems] = useState<PokemonSummaryViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationViewModel | undefined>(undefined);
  const [error, setError] = useState<ApiError | undefined>(undefined);

  const requestKey = toQueryString(queryState);
  // Using the serialized key lets downstream effects react only to meaningful query changes.
  const querySnapshot = useMemo<PokemonListQueryState>(
    () => ({
      ...queryState,
      types: [...queryState.types],
    }),
    [queryState]
  );
  const latestQueryRef = useRef<PokemonListQueryState>(querySnapshot);

  useEffect(() => {
    latestQueryRef.current = {
      ...querySnapshot,
      types: [...querySnapshot.types],
    };
  }, [querySnapshot]);

  const applyResponse = useCallback((payload: PokemonListResponseDto) => {
    if (!mountedRef.current) {
      return;
    }

    setResponse(payload);
    setItems(payload.items.map(toPokemonSummaryViewModel));
    setPagination(buildPaginationViewModel(payload));
    setError(undefined);
    setStatus("success");
    setIsFetching(false);
  }, []);

  const applyError = useCallback((apiError: ApiError) => {
    if (!mountedRef.current) {
      return;
    }

    setError(apiError);
    setStatus("error");
    setIsFetching(false);
  }, []);

  const performFetch = useCallback(
    async (state: PokemonListQueryState) => {
      if (!fetcher) {
        applyError({
          code: 0,
          message: "Środowisko nie obsługuje fetch().",
        });
        return;
      }

      const url = buildRequestUrl(endpoint, state);
      const controller = new AbortController();

      abortRef.current?.abort();
      abortRef.current = controller;
      lastRequestRef.current = {
        state: {
          ...state,
          types: [...state.types],
        },
        url,
      };

      setStatus("loading");
      setIsFetching(true);
      setError(undefined);

      try {
        const response = await fetcher(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (controller.signal.aborted) {
          return;
        }

        if (!response.ok) {
          const apiError = await resolveApiError(response);
          applyError(apiError);
          return;
        }

        const payload = (await response.json()) as PokemonListResponseDto;
        applyResponse(payload);
      } catch (error: unknown) {
        if (isAbortError(error)) {
          return;
        }

        applyError(resolveNetworkError(error));
      }
    },
    [applyError, applyResponse, endpoint, fetcher]
  );

  const retryLatest = useCallback(() => {
    const snapshot = lastRequestRef.current;
    const nextState = snapshot?.state ?? latestQueryRef.current;

    if (!enabled) {
      return;
    }

    performFetch({
      ...nextState,
      types: [...nextState.types],
    });
  }, [enabled, performFetch]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      setIsFetching(false);
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
      return;
    }

    performFetch(latestQueryRef.current);
  }, [enabled, requestKey, performFetch]);

  const result = useMemo<PokemonListQueryResult>(() => {
    const data =
      response && pagination
        ? {
            list: response,
            items,
            pagination,
          }
        : undefined;

    if (status === "success" && data) {
      return {
        status: "success",
        data,
        error: undefined,
        isFetching,
        retry: retryLatest,
      };
    }

    if (status === "error" && error) {
      return {
        status: "error",
        data,
        error,
        isFetching,
        retry: retryLatest,
      };
    }

    if (status === "loading") {
      return {
        status: "loading",
        data,
        error: undefined,
        isFetching: true,
        retry: retryLatest,
      };
    }

    return {
      status: "idle",
      data: data && status !== "idle" ? data : undefined,
      error: undefined,
      isFetching: false,
      retry: retryLatest,
    };
  }, [error, isFetching, items, pagination, response, retryLatest, status]);

  return result;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function resolveApiError(response: Response): Promise<ApiError> {
  const code = response.status;
  let message = defaultErrorMessage(code);
  let details: string | undefined;
  let retryAfterMs: number | undefined;

  try {
    const payload = await response.json();

    if (payload && typeof payload === "object") {
      if (typeof payload.message === "string") {
        message = payload.message;
      }

      if (typeof payload.details === "string") {
        details = payload.details;
      }

      if (typeof payload.retryAfterMs === "number") {
        retryAfterMs = payload.retryAfterMs;
      } else if (typeof payload.retryAfter === "number") {
        retryAfterMs = payload.retryAfter * 1000;
      }
    }
  } catch {
    // Ignore malformed JSON.
  }

  if (!retryAfterMs) {
    const retryAfterHeader = response.headers.get("Retry-After");
    if (retryAfterHeader) {
      const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
      if (Number.isFinite(retryAfterSeconds)) {
        retryAfterMs = retryAfterSeconds * 1000;
      }
    }
  }

  return {
    code,
    message,
    details,
    retryAfterMs,
  };
}

function resolveNetworkError(error: unknown): ApiError {
  const offline = typeof navigator !== "undefined" && navigator !== null && navigator.onLine === false;
  const fallbackMessage = offline
    ? "Brak połączenia z siecią. Sprawdź swoje połączenie."
    : "Nie udało się połączyć z serwerem.";

  return {
    code: offline ? 0 : 500,
    message: fallbackMessage,
    details: error instanceof Error ? error.message : undefined,
  };
}

function defaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Wybrane filtry są nieprawidłowe. Zresetuj ustawienia i spróbuj ponownie.";
    case 401:
      return "Musisz być zalogowany, aby zobaczyć Pokédex.";
    case 403:
      return "Nie masz uprawnień do przeglądania tej listy.";
    case 404:
      return "Nie udało się odnaleźć wyników dla podanych parametrów.";
    case 429:
      return "Przekroczono limit zapytań. Spróbuj ponownie za chwilę.";
    case 500:
    default:
      return "Wystąpił błąd podczas ładowania Pokédexu. Spróbuj ponownie.";
  }
}
