import type { APIRoute } from "astro";

import { deleteFavorite, requireUser, FavoritesServiceError } from "@/lib/favorites/service";
import { PokemonIdParamSchema } from "@/lib/favorites/validation";
import { errorResponse } from "@/lib/http/responses";

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

const resolveSupabase = (locals: App.Locals): App.Locals["supabase"] | Response => {
  if (!locals.supabase) {
    console.error("[favorites] supabase client missing in locals");
    return errorResponse(500, "Konfiguracja supabase jest niedostępna.");
  }
  return locals.supabase;
};

const parsePokemonId = (params: Record<string, string | undefined>): number | Response => {
  const result = PokemonIdParamSchema.safeParse(params.pokemonId);

  if (!result.success) {
    return errorResponse(422, "Niepoprawny parametr pokemonId.", {
      details: result.error.flatten(),
    });
  }

  return result.data;
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  const pokemonId = parsePokemonId(params);
  if (pokemonId instanceof Response) {
    return pokemonId;
  }

  try {
    const user = await requireUser(supabase);
    const result = await deleteFavorite(supabase, user.id, pokemonId);

    if (!result.deleted) {
      return errorResponse(404, "Ulubiony Pokémon nie został znaleziony.");
    }

    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const prerender = false;
