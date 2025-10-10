import { runtimeConfig } from "@/lib/env";
import type {
  EvolutionChain,
  Move,
  PaginatedResponse,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
} from "@/lib/types/pokemon";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_COUNT = 2;

type HttpMethod = "GET";

export interface PokeApiErrorPayload {
  status: number;
  message: string;
  url: string;
  method: HttpMethod;
  originalError?: unknown;
}

export class PokeApiError extends Error {
  status: number;
  url: string;
  method: HttpMethod;
  originalError?: unknown;

  constructor(payload: PokeApiErrorPayload) {
    super(payload.message);
    this.name = "PokeApiError";
    this.status = payload.status;
    this.url = payload.url;
    this.method = payload.method;
    this.originalError = payload.originalError;
  }
}

export interface FetchOptions {
  /**
   * Number of automatic retries on network errors or >=500 responses.
   */
  retry?: number;
  /**
   * Timeout in milliseconds before aborting the request.
   */
  timeoutMs?: number;
  signal?: AbortSignal;
}

const shouldRetry = (error: unknown, response?: Response) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  if (response) {
    return response.status >= 500;
  }

  return true;
};

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, controller: AbortController) => {
  if (timeoutMs <= 0) {
    return promise;
  }

  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return promise.finally(() => clearTimeout(timeout));
};

const pokeApiFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const url = `${runtimeConfig.pokeApiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const retryCount = options.retry ?? DEFAULT_RETRY_COUNT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= retryCount) {
    const abortController = new AbortController();
    const signal = options.signal ? AbortSignal.any([options.signal, abortController.signal]) : abortController.signal;

    try {
      const responsePromise = fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      const response = await withTimeout(responsePromise, timeoutMs, abortController);

      if (!response.ok) {
        lastError = await normalizeError(response);
        if (attempt < retryCount && shouldRetry(undefined, response)) {
          attempt += 1;
          await delay(getBackoffDelay(attempt));
          continue;
        }
        throw lastError;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = normalizeUnknownError(error, url);
      if (attempt < retryCount && shouldRetry(error)) {
        attempt += 1;
        await delay(getBackoffDelay(attempt));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("Unexpected error while fetching PokeAPI");
};

const getBackoffDelay = (attempt: number) => Math.min(2 ** attempt * 200, 1500);

const normalizeError = async (response: Response) => {
  const message = await extractErrorMessage(response);
  return new PokeApiError({
    status: response.status,
    message,
    url: response.url,
    method: "GET",
  });
};

const extractErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { detail?: string; message?: string };
    return data.detail ?? data.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const normalizeUnknownError = (error: unknown, url: string) => {
  if (error instanceof PokeApiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return new PokeApiError({
    status: error instanceof PokeApiError ? error.status : 0,
    message,
    url,
    method: "GET",
    originalError: error,
  });
};

export type PokeApiClientOptions = FetchOptions;

export const pokeApi = {
  listPokemon: (params?: { limit?: number; offset?: number }, options?: FetchOptions) => {
    const query = new URLSearchParams();
    if (typeof params?.limit === "number") query.set("limit", params.limit.toString());
    if (typeof params?.offset === "number") query.set("offset", params.offset.toString());

    const path = query.toString() ? `pokemon?${query.toString()}` : "pokemon";
    return pokeApiFetch<PokemonListResponse>(path, options);
  },

  getPokemon: (identifier: number | string, options?: FetchOptions) =>
    pokeApiFetch<Pokemon>(`pokemon/${identifier}`, options),

  getPokemonSpecies: (identifier: number | string, options?: FetchOptions) =>
    pokeApiFetch<PokemonSpecies>(`pokemon-species/${identifier}`, options),

  getEvolutionChain: (identifier: number | string | URL, options?: FetchOptions) => {
    if (identifier instanceof URL) {
      const relativePath = identifier.pathname.replace(/^\/?api\/v2\//, "");
      return pokeApiFetch<EvolutionChain>(relativePath, options);
    }
    return pokeApiFetch<EvolutionChain>(`evolution-chain/${identifier}`, options);
  },

  getMove: (identifier: number | string, options?: FetchOptions) => pokeApiFetch<Move>(`move/${identifier}`, options),

  paginated: <T>(path: string, options?: FetchOptions) => pokeApiFetch<PaginatedResponse<T>>(path, options),
};

export type PokeApiClient = typeof pokeApi;
