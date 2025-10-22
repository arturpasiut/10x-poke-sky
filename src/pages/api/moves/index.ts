import type { APIRoute } from "astro";

import { errorResponse, jsonResponse } from "@/lib/http/responses";
import { parseMoveQuery } from "@/lib/moves/query";
import { fetchMoveList, MoveServiceError } from "@/lib/moves/service";
import { buildFallbackMoveList } from "@/lib/moves/pokeapi";

const resolveSupabase = (locals: App.Locals): App.Locals["supabase"] | Response => {
  if (!locals.supabase) {
    console.error("[moves] supabase client missing in locals");
    return errorResponse(500, "Konfiguracja supabase jest niedostępna.");
  }

  return locals.supabase;
};

const handleServiceError = (error: unknown): Response => {
  if (error instanceof MoveServiceError) {
    const details =
      error.cause instanceof Error
        ? {
            code: error.code,
            message: error.cause.message,
          }
        : error.code
          ? { code: error.code }
          : undefined;

    return errorResponse(error.status, error.message, { details });
  }

  console.error("[moves] unexpected handler error", error);
  return errorResponse(500, "Wystąpił nieoczekiwany błąd serwera.");
};

export const GET: APIRoute = async ({ locals, url }) => {
  const supabase = resolveSupabase(locals);
  if (supabase instanceof Response) {
    return supabase;
  }

  const parsed = parseMoveQuery(url.searchParams);
  if (!parsed.ok) {
    return errorResponse(parsed.status, parsed.message, { details: parsed.details });
  }

  try {
    let payload: Awaited<ReturnType<typeof fetchMoveList>>;

    try {
      payload = await fetchMoveList(supabase, parsed.data);
    } catch (error) {
      if (error instanceof MoveServiceError && error.status === 500) {
        console.warn("[moves] fetch from Supabase failed, using PokeAPI fallback.", {
          code: error.code,
          message: error.message,
        });
        payload = await buildFallbackMoveList(parsed.data);
      } else {
        throw error;
      }
    }

    return jsonResponse(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const prerender = false;
