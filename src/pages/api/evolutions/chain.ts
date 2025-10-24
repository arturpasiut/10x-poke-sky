import type { APIRoute } from "astro";
import { z } from "zod";

import { errorResponse, jsonResponse } from "@/lib/http/responses";
import { fetchEvolutionChainDto } from "@/lib/evolution/service";
import { EvolutionServiceError } from "@/lib/evolution/errors";
import { isValidGeneration, isValidPokemonType } from "@/lib/pokemon/filters";
import type { PokemonGenerationValue, PokemonTypeValue } from "@/lib/pokemon/types";
import type { EvolutionBranchingFilter } from "@/lib/evolution/types";

const querySchema = z.object({
  chainId: z.string().optional(),
  pokemonId: z.string().optional(),
  identifier: z.string().optional(),
  type: z.string().optional(),
  generation: z.string().optional(),
  branching: z.enum(["any", "linear", "branching"]).optional(),
});

const parseQuery = (searchParams: URLSearchParams) => {
  const parsed = querySchema.safeParse({
    chainId: searchParams.get("chainId") ?? undefined,
    pokemonId: searchParams.get("pokemonId") ?? undefined,
    identifier: searchParams.get("identifier") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    generation: searchParams.get("generation") ?? undefined,
    branching: searchParams.get("branching") ?? undefined,
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

  const typeValue = parsed.data.type ? parsed.data.type.trim().toLowerCase() : null;
  const generationValue = parsed.data.generation ? parsed.data.generation.trim().toLowerCase() : null;

  const normalizedType: PokemonTypeValue | null =
    typeValue && isValidPokemonType(typeValue) ? (typeValue as PokemonTypeValue) : null;

  const normalizedGeneration: PokemonGenerationValue | null =
    generationValue && isValidGeneration(generationValue) ? (generationValue as PokemonGenerationValue) : null;

  const branchingValue = parsed.data.branching ?? null;
  const normalizedBranching: EvolutionBranchingFilter | null =
    branchingValue && branchingValue !== "any" ? branchingValue : null;

  return {
    ok: true,
    data: {
      chainId: normalizedChainId,
      pokemonId: normalizedPokemonId,
      identifier: identifierValue,
      type: normalizedType,
      generation: normalizedGeneration,
      branching: normalizedBranching,
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
