/**
 * Zarządza logiką zapisów ulubionych Pokémonów, realizując komunikację z Supabase
 * oraz integrację z PokeAPI. Udostępnia operacje do weryfikacji użytkowników,
 * paginowanego pobierania, tworzenia, aktualizowania oraz usuwania zasobów ulubionych,
 * a także transformacje wyników na kontrakty DTO wykorzystywane w interfejsie.
 * Moduł działa po stronie serwera i wymaga aktywnego połączenia z Supabase oraz
 * dostępności `https://pokeapi.co`.
 *
 * @module favorites/service
 */
import type { User } from "@supabase/supabase-js";

import type { Tables } from "@/db/database.types";
import type { FavoriteListItemDto, FavoritesListResponseDto, PokemonFavoriteSnapshot } from "@/types";

type SupabaseServerClient = App.Locals["supabase"];

type FavoriteRow = Tables<"favorites">;
type PokemonCacheRow = Tables<"pokemon_cache">;

/**
 * Dostępne klucze sortowania obsługiwane przez {@link fetchFavorites}.
 * Wartość `createdAt` sortuje według kolumny `created_at`, natomiast `name`
 * sortuje deterministycznie według `pokemon_id`, co odpowiada naturalnej numeracji PokeAPI.
 */
export type FavoriteSortKey = "createdAt" | "name";
/**
 * Kolejność sortowania wykorzystywana przez {@link fetchFavorites}. `asc`
 * oznacza sortowanie rosnące, a `desc` malejące.
 */
export type FavoriteSortOrder = "asc" | "desc";

/**
 * Parametry zapytania przekazywane do {@link fetchFavorites}. Wszystkie wartości
 * są wymagane i oczekiwane w układzie 1-indeksowanej paginacji.
 *
 * @property {number} page Indeks bieżącej strony (wartości ujemne zostaną znormalizowane do 1).
 * @property {number} pageSize Liczba elementów na stronie; wartości mniejsze niż 1 zostaną wymuszone na 1.
 * @property {FavoriteSortKey} sort Klucz sortowania wykorzystywany przy zapytaniu Supabase.
 * @property {FavoriteSortOrder} order Kierunek sortowania.
 */
export interface FavoritesQueryOptions {
  page: number;
  pageSize: number;
  sort: FavoriteSortKey;
  order: FavoriteSortOrder;
}

/**
 * Znormalizowany wynik zwracany przez {@link fetchFavorites}.
 *
 * @property rows Tablica rekordów ulubionych zawierająca identyfikator Pokémona oraz datę dodania.
 * @property total Łączna liczba ulubionych znalezionych w Supabase dla danego użytkownika.
 */
export interface FetchFavoritesResult {
  rows: Pick<FavoriteRow, "pokemon_id" | "created_at">[];
  total: number;
}

/**
 * Migawka danych ulubionego Pokémona rozszerzająca {@link PokemonFavoriteSnapshot}
 * o identyfikator Pokémona wykorzystywany w kontekście interfejsu użytkownika.
 */
export interface FavoritePokemonSnapshot extends PokemonFavoriteSnapshot {
  pokemonId: number;
}

/**
 * Wynik operacji {@link upsertFavorite}. Informuje o utworzonym lub zaktualizowanym
 * zapisie oraz określa, czy operacja utworzyła nowy rekord (`isNew === true`).
 */
export interface UpsertFavoriteResult {
  pokemonId: number;
  createdAt: string;
  isNew: boolean;
}

/**
 * Wynik operacji {@link deleteFavorite}. Własność `deleted` informuje, czy co najmniej
 * jeden rekord został usunięty (Supabase zwraca `count > 0`).
 */
export interface DeleteFavoriteResult {
  deleted: boolean;
}

interface ServiceErrorOptions {
  code?: string;
  details?: unknown;
  cause?: unknown;
}

/**
 * Błąd specyficzny dla modułu ulubionych, niosący status HTTP oraz opcjonalny kod Supabase.
 * W praktyce reprezentuje sytuacje, które powinna obsłużyć warstwa API lub interfejs
 * użytkownika. Klasa rozszerza wbudowany {@link Error} o dodatkowe szczegóły.
 */
export class FavoritesServiceError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  /**
   * Tworzy instancję błędu serwisu ulubionych.
   *
   * @param {number} status Kod statusu HTTP odwzorowujący charakter błędu.
   * @param {string} message Wiadomość przyjazna użytkownikowi końcowemu.
   * @param {ServiceErrorOptions} [options] Dodatkowe szczegóły błędu, m.in. kod Supabase i oryginalna przyczyna.
   */
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
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

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

/**
 * Zapewnia, że aktualny kontekst Supabase dysponuje uwierzytelnionym użytkownikiem.
 *
 * @param supabase Supabase Server Client powiązany z żądaniem HTTP.
 * @returns {Promise<User>} Użytkownik uwierzytelniony w bieżącej sesji.
 * @throws {FavoritesServiceError} Gdy weryfikacja użytkownika nie powiedzie się lub brak uprawnień.
 */
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

/**
 * Pobiera paginowaną listę ulubionych Pokémonów dla wskazanego użytkownika.
 *
 * @param supabase Supabase Server Client wykorzystany do odczytu tabeli `favorites`.
 * @param userId Identyfikator użytkownika (kolumna `user_id`).
 * @param options Parametry zapytania opisane przez {@link FavoritesQueryOptions}.
 * @returns {Promise<FetchFavoritesResult>} Rekordy ulubionych oraz łączna liczba dopasowań.
 * @throws {FavoritesServiceError} Gdy Supabase zwraca błąd lub zapytanie narusza uprawnienia.
 * @remarks Funkcja normalizuje zakres paginacji (limit i offset), co zapobiega negatywnym wartościom.
 */
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
    .select("pokemon_id, created_at, pokemon_name, pokemon_types, pokemon_sprite_url", { count: "exact" })
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

// Removed loadPokemonSnapshots - data is now stored directly in favorites table

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

const fetchPokemonDataFromPokeApi = async (pokemonId: number) => {
  const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${pokemonId}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new FavoritesServiceError(502, `Nie udało się pobrać danych Pokemona #${pokemonId} z PokeAPI.`, {
      code: `POKEAPI_${response.status}`,
      details: `PokeAPI returned status ${response.status}`,
    });
  }

  const payload = (await response.json()) as Record<string, unknown>;

  // Extract name
  const name = extractString(payload.name) ?? `pokemon-${pokemonId}`;

  // Extract types
  const typesRaw = payload.types;
  const types: string[] = [];
  if (Array.isArray(typesRaw)) {
    for (const entry of typesRaw) {
      if (isRecord(entry) && isRecord(entry.type) && typeof entry.type.name === "string") {
        types.push(entry.type.name);
      }
    }
  }

  // Extract sprite URL
  const spritesRaw = payload.sprites;
  let spriteUrl: string | null = null;

  if (isRecord(spritesRaw)) {
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
        spriteUrl = sprite;
        break;
      }
    }
  }

  return {
    name,
    types,
    spriteUrl,
  };
};

/**
 * Tworzy lub aktualizuje ulubionego Pokémona oraz synchronizuje metadane z PokeAPI.
 *
 * @param supabase Supabase Server Client wykorzystany do operacji UPSERT na tabeli `favorites`.
 * @param userId Identyfikator użytkownika, któremu przypisywany jest ulubiony.
 * @param pokemonId Identyfikator Pokémona zgodny ze schematem PokeAPI.
 * @returns {Promise<UpsertFavoriteResult>} Szczegóły zapisanego rekordu wraz z informacją, czy był nowy.
 * @throws {FavoritesServiceError}
 * - Gdy Supabase odrzuci zapis (np. brak uprawnień, konflikty, naruszenie ograniczeń).
 * - Gdy PokeAPI zwróci błąd lub jest niedostępne (status HTTP 502).
 * @remarks Wywołanie wykonuje dodatkowe żądanie HTTP do PokeAPI; zalecane jest stosowanie cache w warstwie wyższej.
 */
export const upsertFavorite = async (
  supabase: SupabaseServerClient,
  userId: string,
  pokemonId: number
): Promise<UpsertFavoriteResult> => {
  // Fetch Pokemon data from PokeAPI
  const pokemonData = await fetchPokemonDataFromPokeApi(pokemonId);

  const { data, error, status } = await supabase
    .from(FAVORITES_TABLE)
    .upsert(
      {
        user_id: userId,
        pokemon_id: pokemonId,
        pokemon_name: pokemonData.name,
        pokemon_types: pokemonData.types,
        pokemon_sprite_url: pokemonData.spriteUrl,
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

/**
 * Usuwa ulubionego Pokémona przypisanego do użytkownika.
 *
 * @param supabase Supabase Server Client wykorzystany do operacji DELETE na tabeli `favorites`.
 * @param userId Identyfikator właściciela ulubionego.
 * @param pokemonId Identyfikator Pokémona przechowywany w kolumnie `pokemon_id`.
 * @returns {Promise<DeleteFavoriteResult>} Informacja, czy rekord został fizycznie usunięty.
 * @throws {FavoritesServiceError} Gdy Supabase zwróci błąd lub wystąpi naruszenie uprawnień.
 */
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

/**
 * Mapuje wynik bazy danych na kontrakt API {@link FavoritesListResponseDto}.
 * Zapewnia wartości domyślne dla brakujących nazw, typów oraz oblicza flagę stronicowania.
 *
 * @param result Wynik zapytania otrzymany z {@link fetchFavorites}.
 * @param options Parametry zapytania wykorzystane przy pobieraniu danych.
 * @returns {FavoritesListResponseDto} Obiekt zgodny z kontraktem DTO używanym w UI/testach E2E.
 */
export const toFavoritesListResponse = (
  result: FetchFavoritesResult,
  options: FavoritesQueryOptions
): FavoritesListResponseDto => {
  const items: FavoriteListItemDto[] = result.rows.map((row) => ({
    pokemonId: row.pokemon_id,
    addedAt: row.created_at,
    pokemon: {
      name: row.pokemon_name ?? `Pokemon #${row.pokemon_id}`,
      types: Array.isArray(row.pokemon_types) ? row.pokemon_types : [],
      spriteUrl: row.pokemon_sprite_url ?? null,
    },
  }));

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

/**
 * Próbuje wydobyć adres URL sprite'a Pokémona z bufora `pokemon_cache`.
 * Obsługuje zarówno bezpośredni format PokeAPI, jak i wzbogacone obiekty zagnieżdżone.
 *
 * @param payload Surowe dane JSON (lub tekst JSON) zapisane w kolumnie `payload`.
 * @returns {string | null} Adres URL sprite'a lub `null`, jeśli nie uda się go odnaleźć.
 * @remarks Funkcja zakłada poprawną serializację JSON; błędne dane są bezpiecznie ignorowane.
 */
export const parseSpriteUrlFromPayload = (payload: PokemonCacheRow["payload"]): string | null => {
  const parsed = parseJson(payload);

  if (!parsed) {
    return null;
  }

  // Try direct sprites first (simple PokeAPI response)
  let spritesRaw = parsed.sprites;

  // If not found, try nested pokemon.sprites (enriched response)
  if (!isRecord(spritesRaw) && isRecord(parsed.pokemon)) {
    spritesRaw = (parsed.pokemon as Record<string, unknown>).sprites;
  }

  if (!isRecord(spritesRaw)) {
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
      return sprite;
    }
  }

  return null;
};
