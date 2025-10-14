import type { ApiError } from "@/lib/pokemon/types";
import { mapFavoritesList } from "@/lib/favorites/transformers";
import type { FavoritesListResponseDto } from "@/types";

const BASE_ENDPOINT = "/api/users/me/favorites";

export type FavoritesListParams = {
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "name";
  order?: "asc" | "desc";
};

export class FavoritesApiError extends Error {
  readonly code: number;
  readonly details?: string;
  readonly retryAfterMs?: number;

  constructor(message: string, options: { code: number; details?: string; retryAfterMs?: number }) {
    super(message);
    this.name = "FavoritesApiError";
    this.code = options.code;
    this.details = options.details;
    this.retryAfterMs = options.retryAfterMs;
  }
}

const buildUrl = (params: FavoritesListParams = {}): string => {
  const query = new URLSearchParams();

  if (params.page && Number.isFinite(params.page)) {
    query.set("page", String(params.page));
  }

  if (params.pageSize && Number.isFinite(params.pageSize)) {
    query.set("pageSize", String(params.pageSize));
  }

  if (params.sort) {
    query.set("sort", params.sort);
  }

  if (params.order) {
    query.set("order", params.order);
  }

  const suffix = query.toString();
  return suffix ? `${BASE_ENDPOINT}?${suffix}` : BASE_ENDPOINT;
};

const parseErrorPayload = async (response: Response): Promise<ApiError> => {
  let message = response.statusText || "Nie udało się pobrać ulubionych.";
  let details: string | undefined;
  let retryAfterMs: number | undefined;

  try {
    const payload = await response.json();

    if (payload && typeof payload === "object") {
      if (typeof payload.message === "string" && payload.message.trim()) {
        message = payload.message;
      }
      if (typeof payload.details === "string") {
        details = payload.details;
      }
      if (typeof payload.retryAfterMs === "number") {
        retryAfterMs = payload.retryAfterMs;
      }
    }
  } catch {
    // ignorujemy błędne JSON
  }

  if (!retryAfterMs) {
    const retryAfterHeader = response.headers.get("Retry-After");
    if (retryAfterHeader) {
      const seconds = Number.parseInt(retryAfterHeader, 10);
      if (Number.isFinite(seconds)) {
        retryAfterMs = seconds * 1000;
      }
    }
  }

  return {
    code: response.status,
    message,
    details,
    retryAfterMs,
  };
};

export const fetchFavoritesList = async (params: FavoritesListParams = {}) => {
  const url = buildUrl(params);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await parseErrorPayload(response);
    throw new FavoritesApiError(error.message, {
      code: error.code,
      details: error.details,
      retryAfterMs: error.retryAfterMs,
    });
  }

  const payload = (await response.json()) as FavoritesListResponseDto;

  return {
    dto: payload,
    items: mapFavoritesList(payload),
  };
};

export const addFavoriteToApi = async (pokemonId: number) => {
  const response = await fetch(BASE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ pokemonId }),
  });

  if (!response.ok) {
    const error = await parseErrorPayload(response);
    throw new FavoritesApiError(error.message, {
      code: error.code,
      details: error.details,
      retryAfterMs: error.retryAfterMs,
    });
  }

  const payload = await response.json();

  return {
    pokemonId: payload.pokemonId,
    addedAt: payload.addedAt,
    isNew: response.status === 201,
  };
};

export const checkIsFavorite = async (pokemonId: number): Promise<boolean> => {
  try {
    const result = await fetchFavoritesList({ pageSize: 50 });
    return result.items.some((item) => item.pokemonId === pokemonId);
  } catch (error) {
    if (error instanceof FavoritesApiError && error.code === 401) {
      return false;
    }
    throw error;
  }
};

export const deleteFavoriteFromApi = async (pokemonId: number) => {
  const url = `${BASE_ENDPOINT}/${pokemonId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await parseErrorPayload(response);
    throw new FavoritesApiError(error.message, {
      code: error.code,
      details: error.details,
      retryAfterMs: error.retryAfterMs,
    });
  }
};
