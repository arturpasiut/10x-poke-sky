import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildMoveRequestUrl, toMoveQueryString } from "@/lib/moves/query";
import { buildMoveListViewModel } from "@/lib/moves/transformers";
import type { MoveListQueryResult, MoveListQueryState } from "@/lib/moves/types";
import type { MoveListResponseDto } from "@/types";
import type { ApiError } from "@/lib/pokemon/types";

interface UseMoveListQueryOptions {
  enabled?: boolean;
  fetcher?: typeof fetch;
  endpoint?: string;
}

const DEFAULT_ENDPOINT = "/api/moves";

interface RequestSnapshot {
  state: MoveListQueryState;
  url: string;
}

type QueryStatus = MoveListQueryResult["status"];

const defaultFetcher: typeof fetch | undefined = typeof fetch === "function" ? fetch.bind(globalThis) : undefined;

export function useMoveListQuery(
  queryState: MoveListQueryState,
  options: UseMoveListQueryOptions = {}
): MoveListQueryResult {
  const { enabled = true, fetcher = defaultFetcher, endpoint = DEFAULT_ENDPOINT } = options;
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<RequestSnapshot | null>(null);
  const mountedRef = useRef(false);

  const [status, setStatus] = useState<QueryStatus>("idle");
  const [isFetching, setIsFetching] = useState(false);
  const [response, setResponse] = useState<MoveListResponseDto | undefined>(undefined);
  const [error, setError] = useState<ApiError | undefined>(undefined);

  const requestKey = toMoveQueryString(queryState);
  const querySnapshot = useMemo<MoveListQueryState>(
    () => ({
      ...queryState,
      types: [...queryState.types],
    }),
    [queryState]
  );

  const latestQueryRef = useRef<MoveListQueryState>(querySnapshot);

  useEffect(() => {
    latestQueryRef.current = {
      ...querySnapshot,
      types: [...querySnapshot.types],
    };
  }, [querySnapshot]);

  const applyResponse = useCallback((payload: MoveListResponseDto) => {
    if (!mountedRef.current) {
      return;
    }

    setResponse(payload);
    setStatus("success");
    setError(undefined);
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
    async (state: MoveListQueryState) => {
      if (!fetcher) {
        applyError({
          code: 0,
          message: "Środowisko nie obsługuje fetch().",
        });
        return;
      }

      const url = buildMoveRequestUrl(endpoint, state);
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
          const apiError = await resolveMoveApiError(response);
          applyError(apiError);
          return;
        }

        const payload = (await response.json()) as MoveListResponseDto;
        applyResponse(payload);
      } catch (thrown: unknown) {
        if (isAbortError(thrown)) {
          return;
        }
        applyError(resolveMoveNetworkError(thrown));
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

    performFetch({
      ...latestQueryRef.current,
      types: [...latestQueryRef.current.types],
    });
  }, [enabled, performFetch, requestKey]);

  const viewModel = useMemo(() => (response ? buildMoveListViewModel(response) : undefined), [response]);

  const result = useMemo<MoveListQueryResult>(() => {
    const data = viewModel;

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
  }, [error, isFetching, retryLatest, status, viewModel]);

  return result;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function resolveMoveApiError(response: Response): Promise<ApiError> {
  const code = response.status;
  let message = defaultMoveErrorMessage(code);
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
    // ignore malformed JSON
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

function resolveMoveNetworkError(error: unknown): ApiError {
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

function defaultMoveErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Wybrane filtry ruchów są nieprawidłowe. Zresetuj ustawienia i spróbuj ponownie.";
    case 401:
      return "Musisz być zalogowany, aby zobaczyć tę listę ruchów.";
    case 403:
      return "Nie masz uprawnień do przeglądania tej listy ruchów.";
    case 404:
      return "Nie znaleziono ruchów dla podanych parametrów.";
    case 429:
      return "Przekroczono limit zapytań. Spróbuj ponownie za chwilę.";
    case 500:
    default:
      return "Wystąpił błąd podczas ładowania listy ruchów. Spróbuj ponownie.";
  }
}
