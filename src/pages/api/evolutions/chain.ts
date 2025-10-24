import type { APIRoute } from "astro";
import { z } from "zod";

import { errorResponse, jsonResponse } from "@/lib/http/responses";
import { fetchEvolutionChainDto } from "@/lib/evolution/service";
import { EvolutionServiceError } from "@/lib/evolution/errors";

const querySchema = z.object({
  chainId: z.string().optional(),
  pokemonId: z.string().optional(),
  identifier: z.string().optional(),
});

const parseQuery = (searchParams: URLSearchParams) => {
  const parsed = querySchema.safeParse({
    chainId: searchParams.get("chainId") ?? undefined,
    pokemonId: searchParams.get("pokemonId") ?? undefined,
    identifier: searchParams.get("identifier") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: "Parametry zapytania są nieprawidłowe.",
      details: parsed.error.flatten(),
    } as const;
  }

  const chainIdValue = parsed.data.chainId ? Number.parseInt(parsed.data.chainId, 10) : null;
  const pokemonIdValue = parsed.data.pokemonId ? Number.parseInt(parsed.data.pokemonId, 10) : null;

  const normalizedChainId = Number.isFinite(chainIdValue) && chainIdValue ? chainIdValue : null;
  const normalizedPokemonId = Number.isFinite(pokemonIdValue) && pokemonIdValue ? pokemonIdValue : null;

  const identifierValue = parsed.data.identifier?.trim()?.length ? parsed.data.identifier.trim() : null;

  if (!normalizedChainId && !normalizedPokemonId && !identifierValue) {
    return {
      ok: false,
      status: 400,
      message: "Podaj parametr chainId, pokemonId lub identifier.",
    } as const;
  }

  return {
    ok: true,
    data: {
      chainId: normalizedChainId,
      pokemonId: normalizedPokemonId,
      identifier: identifierValue,
    },
  } as const;
};

const handleServiceError = (error: unknown): Response => {
  if (error instanceof EvolutionServiceError) {
    return errorResponse(error.status, error.message, {
      details: error.code ? { code: error.code } : undefined,
    });
  }

  console.error("[evolutions] Unexpected handler error", error);
  return errorResponse(500, "Wystąpił nieoczekiwany błąd podczas pobierania łańcucha ewolucji.");
};

export const GET: APIRoute = async ({ locals, url }) => {
  const parsed = parseQuery(url.searchParams);

  if (!parsed.ok) {
    return errorResponse(parsed.status, parsed.message, parsed.details ? { details: parsed.details } : undefined);
  }

  try {
    const dto = await fetchEvolutionChainDto(locals.supabase, parsed.data);

    return jsonResponse(
      {
        data: dto,
        source: "pokeapi",
        fetchedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return handleServiceError(error);
  }
};

export const prerender = false;
