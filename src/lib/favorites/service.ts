import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/db/database.types";
import type { FavoriteListItemDto, FavoritesListResponseDto, PokemonFavoriteSnapshot } from "@/types";

type SupabaseServerClient = App.Locals["supabase"];

type FavoriteRow = Tables<"favorites">;
type PokemonCacheRow = Tables<"pokemon_cache">;

export type FavoriteSortKey = "createdAt" | "name";
export type FavoriteSortOrder = "asc" | "desc";

export interface FavoritesQueryOptions {
  page: number;
  pageSize: number;
  sort: FavoriteSortKey;
  order: FavoriteSortOrder;
}

export interface FetchFavoritesResult {
  rows: Array<Pick<FavoriteRow, "pokemon_id" | "created_at">>;
  total: number;
}

export interface FavoritePokemonSnapshot extends PokemonFavoriteSnapshot {
  pokemonId: number;
}

export interface UpsertFavoriteResult {
  pokemonId: number;
  createdAt: string;
  isNew: boolean;
}

export interface DeleteFavoriteResult {
  deleted: boolean;
}

type ServiceErrorOptions = {
  code?: string;
  details?: unknown;
  cause?: unknown;
};

export class FavoritesServiceError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, options: ServiceErrorOptions = {}) {
    super(message);
    this.name = "FavoritesServiceError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

const FAVORITES_TABLE = "favorites";
const POKEMON_CACHE_TABLE = "pokemon_cache";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
};

const resolveStatusFromCode = (status: number | null | undefined, code?: string) => {
  if (typeof status === "number" && status > 0) {
    return status;
  }

  if (code === "23514") {
    return 422;
  }

  if (code === "23505") {
    return 409;
  }

  return 500;
};

export const requireUser = async (supabase: SupabaseServerClient): Promise<User> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    const status = resolveStatusFromCode(error.status, (error as { code?: string }).code);
    const message =
      status === 403
        ? "Brak uprawnień do zasobu ulubionych."
        : status === 401
          ? "Wymagane logowanie, aby zarządzać ulubionymi."
          : "Nie udało się zweryfikować użytkownika.";

    if (status >= 500) {
      console.error("[favorites] requireUser failed", { error });
    }

    throw new FavoritesServiceError(status, message, {
      code: (error as { code?: string }).code,
      details: error.message,
      cause: error,
    });
  }

  const user = data?.user;

  if (!user) {
    throw new FavoritesServiceError(401, "Wymagane logowanie, aby zarządzać ulubionymi.");
  }

  return user;
};

export const fetchFavorites = async (
  supabase: SupabaseServerClient,
  userId: string,
  { page, pageSize, sort, order }: FavoritesQueryOptions
): Promise<FetchFavoritesResult> => {
  const offset = Math.max(0, (page - 1) * pageSize);
  const limit = Math.max(pageSize, 1);
  const ascending = order === "asc";
  const orderColumn = sort === "createdAt" ? "created_at" : "pokemon_id";

  const upperBound = offset + limit - 1;

  const { data, error, count, status } = await supabase
    .from(FAVORITES_TABLE)
    .select("pokemon_id, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order(orderColumn, { ascending, nullsFirst: false })
    .range(offset, Math.max(offset, upperBound));

  if (error) {
    if (status === 403) {
      throw new FavoritesServiceError(403, "Brak uprawnień do pobrania ulubionych.", {
        code: error.code,
        details: error.details,
      });
    }

    console.error("[favorites] fetchFavorites error", { error, userId, status });
    throw new FavoritesServiceError(500, "Nie udało się pobrać listy ulubionych.", {
      code: error.code,
      details: error.details,
    });
  }

  return {
    rows: data ?? [],
    total: count ?? 0,
  };
};

export const loadPokemonSnapshots = async (
  supabase: SupabaseServerClient,
  pokemonIds: number[]
): Promise<Map<number, FavoritePokemonSnapshot>> => {
  const uniqueIds = Array.from(new Set(pokemonIds.filter((id) => Number.isInteger(id))));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error, status } = await supabase
    .from(POKEMON_CACHE_TABLE)
    .select("pokemon_id, name, types, payload")
    .in("pokemon_id", uniqueIds);

  if (error) {
    console.error("[favorites] loadPokemonSnapshots error", { error, pokemonIds: uniqueIds, status });
    throw new FavoritesServiceError(500, "Nie udało się odczytać danych o Pokemonach.", {
      code: error.code,
      details: error.details,
    });
  }

  const snapshots = new Map<number, FavoritePokemonSnapshot>();

  for (const row of data ?? []) {
    snapshots.set(row.pokemon_id, {
      pokemonId: row.pokemon_id,
      name: row.name,
      types: row.types,
      spriteUrl: parseSpriteUrlFromPayload(row.payload),
    });
  }

  return snapshots;
};

const lookupExistingFavorite = async (
  supabase: SupabaseServerClient,
  userId: string,
  pokemonId: number
): Promise<Pick<FavoriteRow, "pokemon_id" | "created_at"> | null> => {
  const { data, error, status } = await supabase
    .from(FAVORITES_TABLE)
    .select("pokemon_id, created_at")
    .eq("user_id", userId)
    .eq("pokemon_id", pokemonId)
    .maybeSingle();

  if (error) {
    if (status === 404) {
      return null;
    }

    console.error("[favorites] lookupExistingFavorite error", { error, userId, pokemonId, status });
    throw new FavoritesServiceError(500, "Nie udało się zweryfikować istniejącego ulubionego.", {
      code: error.code,
      details: error.details,
    });
  }

  return data ?? null;
};

export const upsertFavorite = async (
  supabase: SupabaseServerClient,
  userId: string,
  pokemonId: number
): Promise<UpsertFavoriteResult> => {
  const { data, error, status } = await supabase
    .from(FAVORITES_TABLE)
    .upsert(
      {
        user_id: userId,
        pokemon_id: pokemonId,
      },
      {
        onConflict: "user_id,pokemon_id",
      }
    )
    .select("pokemon_id, created_at")
    .single();

  if (error) {
    const code = error.code;

    if (code === "23514") {
      throw new FavoritesServiceError(422, "Identyfikator Pokémona jest poza dozwolonym zakresem.", {
        code,
        details: error.details,
      });
    }

    if (code === "23505" || status === 409) {
      const existing = await lookupExistingFavorite(supabase, userId, pokemonId);

      if (existing) {
        return {
          pokemonId: existing.pokemon_id,
          createdAt: existing.created_at,
          isNew: false,
        };
      }
    }

    if (status === 403) {
      throw new FavoritesServiceError(403, "Brak uprawnień do zapisu ulubionych.", {
        code,
        details: error.details,
      });
    }

    console.error("[favorites] upsertFavorite error", { error, userId, pokemonId, status });
    throw new FavoritesServiceError(500, "Nie udało się zapisać ulubionego Pokémona.", {
      code,
      details: error.details,
    });
  }

  if (!data) {
    console.error("[favorites] upsertFavorite returned empty payload", { userId, pokemonId, status });
    throw new FavoritesServiceError(500, "Brak danych po zapisie ulubionego Pokémona.");
  }

  return {
    pokemonId: data.pokemon_id,
    createdAt: data.created_at,
    isNew: status === 201,
  };
};

export const deleteFavorite = async (
  supabase: SupabaseServerClient,
  userId: string,
  pokemonId: number
): Promise<DeleteFavoriteResult> => {
  const { count, error, status } = await supabase
    .from(FAVORITES_TABLE)
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("pokemon_id", pokemonId)
    .select("pokemon_id");

  if (error) {
    if (status === 403) {
      throw new FavoritesServiceError(403, "Brak uprawnień do usunięcia ulubionego.", {
        code: error.code,
        details: error.details,
      });
    }

    console.error("[favorites] deleteFavorite error", { error, userId, pokemonId, status });
    throw new FavoritesServiceError(500, "Nie udało się usunąć ulubionego Pokémona.", {
      code: error.code,
      details: error.details,
    });
  }

  return {
    deleted: (count ?? 0) > 0,
  };
};

const collator = new Intl.Collator("pl", {
  sensitivity: "base",
  usage: "sort",
});

const toSnapshot = (
  favorite: Pick<FavoriteRow, "pokemon_id">,
  snapshot?: FavoritePokemonSnapshot
): PokemonFavoriteSnapshot => ({
  name: snapshot?.name ?? `Pokemon #${favorite.pokemon_id}`,
  types: Array.isArray(snapshot?.types) ? snapshot.types : [],
  spriteUrl: snapshot?.spriteUrl ?? null,
});

export const toFavoriteListItem = (
  favorite: Pick<FavoriteRow, "pokemon_id" | "created_at">,
  snapshot?: FavoritePokemonSnapshot
): FavoriteListItemDto => ({
  pokemonId: favorite.pokemon_id,
  addedAt: favorite.created_at,
  pokemon: toSnapshot(favorite, snapshot),
});

const compareByName = (order: FavoriteSortOrder) => {
  return (a: FavoriteListItemDto, b: FavoriteListItemDto) => {
    const result = collator.compare(a.pokemon.name, b.pokemon.name);
    if (result === 0) {
      return order === "asc" ? a.pokemonId - b.pokemonId : b.pokemonId - a.pokemonId;
    }
    return order === "asc" ? result : -result;
  };
};

export const toFavoritesListResponse = (
  result: FetchFavoritesResult,
  snapshots: Map<number, FavoritePokemonSnapshot>,
  options: FavoritesQueryOptions
): FavoritesListResponseDto => {
  const items = result.rows.map((row) => {
    const snapshot = snapshots.get(row.pokemon_id);
    return toFavoriteListItem(row, snapshot);
  });

  if (options.sort === "name") {
    items.sort(compareByName(options.order));
  }

  const total = Math.max(result.total, items.length);
  const hasNext = options.page * options.pageSize < total;

  return {
    items,
    page: options.page,
    pageSize: options.pageSize,
    total,
    hasNext,
  };
};

const parseJson = (payload: unknown): Record<string, unknown> | null => {
  if (isRecord(payload)) {
    return payload;
  }

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

const getNestedValue = (record: Record<string, unknown>, path: string[]): unknown => {
  return path.reduce<unknown>((value, key) => {
    if (!isRecord(value)) {
      return undefined;
    }
    return value[key];
  }, record);
};

export const parseSpriteUrlFromPayload = (payload: PokemonCacheRow["payload"]): string | null => {
  const parsed = parseJson(payload);

  if (!parsed) {
    console.log("[parseSpriteUrlFromPayload] Failed to parse JSON from payload", payload);
    return null;
  }

  const spritesRaw = parsed.sprites;

  if (!isRecord(spritesRaw)) {
    console.log("[parseSpriteUrlFromPayload] sprites is not a record", { parsed, spritesRaw });
    return null;
  }

  const spritePaths: string[][] = [
    ["other", "official-artwork", "front_default"],
    ["other", "home", "front_default"],
    ["other", "dream_world", "front_default"],
    ["front_default"],
    ["front_shiny"],
  ];

  for (const path of spritePaths) {
    const spriteValue = getNestedValue(spritesRaw, path);
    const sprite = extractString(spriteValue);
    if (sprite) {
      console.log("[parseSpriteUrlFromPayload] Found sprite", { path, sprite });
      return sprite;
    }
  }

  console.log("[parseSpriteUrlFromPayload] No sprite found in any path", { spritesRaw });
  return null;
};
