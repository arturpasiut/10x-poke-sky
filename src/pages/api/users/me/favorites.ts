import type { APIRoute } from "astro";

import type { FavoritesQueryOptions } from "@/lib/favorites/service";
import {
  fetchFavorites,
  requireUser,
  toFavoritesListResponse,
  upsertFavorite,
  FavoritesServiceError,
} from "@/lib/favorites/service";
import { AddFavoriteSchema, FavoritesQuerySchema, type AddFavoriteInput } from "@/lib/favorites/validation";
import { errorResponse, jsonResponse } from "@/lib/http/responses";

const handleServiceError = (error: unknown): Response => {
  if (error instanceof FavoritesServiceError) {
    const details =
      error.details !== undefined
        ? error.details
        : error.code
          ? {
              code: error.code,
            }
          : undefined;

    return errorResponse(error.status, error.message, { details });
  }

  console.error("[favorites] unexpected handler error", error);
  return errorResponse(500, "Wystąpił nieoczekiwany błąd serwera.");
};

const parseQuery = (request: Request): FavoritesQueryOptions | Response => {
  const url = new URL(request.url);
  const query = {
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    order: url.searchParams.get("order") ?? undefined,
  };

  const result = FavoritesQuerySchema.safeParse(query);

  if (!result.success) {
    return errorResponse(400, "Niepoprawne parametry zapytania.", {
      details: result.error.flatten(),
    });
  }

  return result.data;
};

const parseAddFavoriteBody = async (request: Request): Promise<AddFavoriteInput | Response> => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Nie udało się odczytać danych żądania.");
  }

  const result = AddFavoriteSchema.safeParse(payload);

  if (!result.success) {
    return errorResponse(422, "Niepoprawne dane wejściowe.", {
      details: result.error.flatten(),
    });
  }

  return result.data;
};

const resolveSupabase = (locals: App.Locals): App.Locals["supabase"] | Response => {
  if (!locals.supabase) {
    console.error("[favorites] supabase client missing in locals");
    return errorResponse(500, "Konfiguracja supabase jest niedostępna.");
  }
  return locals.supabase;
};

export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  const query = parseQuery(request);
  if (query instanceof Response) {
    return query;
  }

  try {
    const user = await requireUser(supabase);
    const favorites = await fetchFavorites(supabase, user.id, query);
    const dto = toFavoritesListResponse(favorites, query);

    return jsonResponse(dto, { status: 200 });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  const body = await parseAddFavoriteBody(request);
  if (body instanceof Response) {
    return body;
  }

  try {
    const user = await requireUser(supabase);

    const result = await upsertFavorite(supabase, user.id, body.pokemonId);
    const status = result.isNew ? 201 : 200;

    return jsonResponse(
      {
        pokemonId: result.pokemonId,
        addedAt: result.createdAt,
      },
      {
        status,
        headers: {
          Location: `/api/users/me/favorites/${result.pokemonId}`,
        },
      }
    );
  } catch (error) {
    return handleServiceError(error);
  }
};

export const prerender = false;
