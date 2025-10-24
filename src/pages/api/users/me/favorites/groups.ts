import type { APIRoute } from "astro";

import { errorResponse, jsonResponse } from "@/lib/http/responses";
import { requireUser } from "@/lib/favorites/service";
import { EvolutionServiceError } from "@/lib/evolution/errors";
import { fetchEvolutionChainDto } from "@/lib/evolution/service";
import { createGroupFavorite, listGroupFavorites, removeGroupFavorite } from "@/lib/favorites/groups";
import { z } from "zod";

const resolveSupabase = (locals: App.Locals): App.Locals["supabase"] | Response => {
  if (!locals.supabase) {
    console.error("[favorites.groups] supabase client missing in locals");
    return errorResponse(500, "Konfiguracja supabase jest niedostępna.");
  }

  return locals.supabase;
};

const listQuerySchema = z.object({
  chainId: z.string().optional(),
});

export const GET: APIRoute = async ({ locals, url }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  const parsed = listQuerySchema.safeParse({
    chainId: url.searchParams.get("chainId") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse(400, "Niepoprawne parametry zapytania.", {
      details: parsed.error.flatten(),
    });
  }

  try {
    const user = await requireUser(supabase);
    const groups = await listGroupFavorites(supabase, user.id, parsed.data.chainId ?? null);

    return jsonResponse({
      items: groups,
    });
  } catch (error) {
    console.error("[favorites.groups] failed to list groups", error);
    return errorResponse(500, "Nie udało się pobrać ulubionych łańcuchów.");
  }
};

const addGroupSchema = z.object({
  chainId: z.string().min(1, "Wymagany identyfikator łańcucha"),
  branchId: z.string().optional(),
  pokemonIds: z.array(z.number().int().positive()).min(1, "Wymagany przynajmniej jeden Pokémon"),
});

export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Nie udało się odczytać danych żądania.");
  }

  const parsed = addGroupSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse(422, "Niepoprawne dane wejściowe.", {
      details: parsed.error.flatten(),
    });
  }

  try {
    const user = await requireUser(supabase);

    // Opcjonalnie weryfikujmy, czy przekazane ID pokrywają się z realnym łańcuchem.
    const chain = await fetchEvolutionChainDto(supabase, {
      chainId: parsed.data.chainId,
    });

    const validIds = new Set(chain.stages.map((stage) => stage.pokemonId));
    const invalidIds = parsed.data.pokemonIds.filter((id) => !validIds.has(id));

    if (invalidIds.length) {
      return errorResponse(422, "Niektóre identyfikatory Pokémonów nie należą do wskazanego łańcucha.", {
        details: { invalidIds },
      });
    }

    const group = await createGroupFavorite(supabase, user.id, {
      chainId: parsed.data.chainId,
      branchId: parsed.data.branchId ?? "",
      pokemonIds: parsed.data.pokemonIds,
    });

    return jsonResponse(group, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof EvolutionServiceError) {
      return errorResponse(error.status, error.message, {
        details: error.code ? { code: error.code } : undefined,
      });
    }

    console.error("[favorites.groups] failed to create group", error);
    return errorResponse(500, "Nie udało się zapisać łańcucha jako ulubionego.");
  }
};

const deleteParamsSchema = z.object({
  chainId: z.string(),
  branchId: z.string().optional(),
});

export const DELETE: APIRoute = async ({ locals, url }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  const parsed = deleteParamsSchema.safeParse({
    chainId: url.searchParams.get("chainId") ?? undefined,
    branchId: url.searchParams.get("branchId") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse(400, "Niepoprawne parametry zapytania.", {
      details: parsed.error.flatten(),
    });
  }

  try {
    const user = await requireUser(supabase);
    await removeGroupFavorite(supabase, user.id, parsed.data.chainId, parsed.data.branchId ?? "");

    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[favorites.groups] failed to delete group", error);
    return errorResponse(500, "Nie udało się usunąć ulubionego łańcucha.");
  }
};

export const prerender = false;
