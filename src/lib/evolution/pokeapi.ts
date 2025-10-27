import type { EvolutionChain, Pokemon, PokemonSpecies } from "@/lib/types/pokemon";

import { EvolutionServiceError } from "./errors";
import { buildPokeapiUrl } from "./utils";

const DEFAULT_TIMEOUT_MS = 12_000;

interface FetchOptions {
  timeoutMs?: number;
}

const fetchJson = async <T>(input: string, options: FetchOptions = {}): Promise<T> => {
  const requestUrl = buildPokeapiUrl(input);

  const controller = options.timeoutMs ? new AbortController() : null;
  const timeoutHandle =
    options.timeoutMs && controller ? setTimeout(() => controller.abort(), options.timeoutMs) : null;

  const executor = async () => {
    let response: Response;
    try {
      response = await fetch(requestUrl, {
        headers: {
          Accept: "application/json",
        },
        signal: controller?.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new EvolutionServiceError(504, "Timeout podczas komunikacji z PokeAPI.", {
          code: "POKEAPI_TIMEOUT",
          cause: error,
        });
      }

      throw new EvolutionServiceError(502, "Nie udało się nawiązać połączenia z PokeAPI.", {
        code: "POKEAPI_ERROR",
        cause: error,
      });
    }

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502;
      const message =
        response.status === 404
          ? "Żądane zasoby ewolucji nie zostały znalezione."
          : "PokeAPI zwróciło błąd podczas pobierania danych ewolucji.";

      throw new EvolutionServiceError(status, message, {
        code: response.status === 404 ? "POKEAPI_NOT_FOUND" : "POKEAPI_ERROR",
      });
    }

    try {
      return (await response.json()) as T;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  };

  return executor();
};

export const fetchEvolutionChainById = async (chainId: number, options: FetchOptions = {}): Promise<EvolutionChain> => {
  if (!Number.isFinite(chainId) || chainId <= 0) {
    throw new EvolutionServiceError(400, "Nieprawidłowy identyfikator łańcucha ewolucji.", {
      code: "INVALID_INPUT",
    });
  }

  return fetchJson<EvolutionChain>(`evolution-chain/${chainId}`, options);
};

export const fetchEvolutionChainByUrl = async (chainUrl: string, options: FetchOptions = {}): Promise<EvolutionChain> =>
  fetchJson<EvolutionChain>(chainUrl, options);

export const fetchPokemonSpecies = async (
  identifier: number | string,
  options: FetchOptions = {}
): Promise<PokemonSpecies> => fetchJson<PokemonSpecies>(`pokemon-species/${identifier}`, options);

export const fetchPokemonDetail = async (identifier: number | string, options: FetchOptions = {}): Promise<Pokemon> =>
  fetchJson<Pokemon>(`pokemon/${identifier}`, { timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS });
