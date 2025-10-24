import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { EvolutionChain, ChainLink, Pokemon } from "@/lib/types/pokemon";
import type { PokemonGenerationValue, PokemonTypeValue } from "@/lib/pokemon/types";

import { EvolutionServiceError } from "./errors";
import { fetchEvolutionChainById, fetchEvolutionChainByUrl, fetchPokemonDetail, fetchPokemonSpecies } from "./pokeapi";
import { buildEvolutionChainDto, collectBranchPaths } from "./transformers";
import type { EvolutionBranchingFilter, EvolutionChainDto } from "./types";
import { extractIdFromResourceUrl } from "./utils";

type SupabaseServerClient = SupabaseClient<Database>;

export interface EvolutionChainRequest {
  chainId?: number | string | null;
  pokemonId?: number | null;
  identifier?: string | null;
  type?: PokemonTypeValue | null;
  generation?: PokemonGenerationValue | null;
  branching?: EvolutionBranchingFilter | null;
}

interface EvolutionChainResult {
  chain: EvolutionChain;
}

const EVOLUTION_CACHE_TABLE = "evolution_chains_cache";

const collectSpeciesIds = (node: ChainLink | null, acc: Set<number>): Set<number> => {
  if (!node) {
    return acc;
  }

  const speciesId = extractIdFromResourceUrl(node.species?.url ?? null);
  if (speciesId) {
    acc.add(speciesId);
  }

  node.evolves_to?.forEach((child) => collectSpeciesIds(child, acc));

  return acc;
};

const fetchPokemonMap = async (speciesIds: number[]): Promise<Map<number, Pokemon | null>> => {
  const map = new Map<number, Pokemon | null>();

  const concurrency = 3;

  for (let index = 0; index < speciesIds.length; index += concurrency) {
    const chunk = speciesIds.slice(index, index + concurrency);

    await Promise.all(
      chunk.map(async (id) => {
        try {
          const detail = await fetchPokemonDetail(id);
          map.set(id, detail);
        } catch (error) {
          console.warn("[evolution] Failed to fetch pokemon detail", { id, error });
          map.set(id, null);
        }
      })
    );
  }

  return map;
};

const resolveChainFromParams = async (params: EvolutionChainRequest): Promise<EvolutionChainResult> => {
  if (params.chainId !== null && params.chainId !== undefined) {
    const numericChainId =
      typeof params.chainId === "string" ? Number.parseInt(params.chainId, 10) : Number(params.chainId);

    if (!Number.isFinite(numericChainId) || numericChainId <= 0) {
      throw new EvolutionServiceError(400, "Parametr chainId jest nieprawidłowy.", { code: "INVALID_INPUT" });
    }

    const chain = await fetchEvolutionChainById(numericChainId);
    return { chain };
  }

  const identifier = params.identifier ?? params.pokemonId;

  if (identifier === null || identifier === undefined || `${identifier}`.trim().length === 0) {
    throw new EvolutionServiceError(400, "Wymagany jest parametr chainId lub pokemonId.", { code: "INVALID_INPUT" });
  }

  const species = await fetchPokemonSpecies(identifier);
  const chainUrl = species?.evolution_chain?.url;

  if (!chainUrl) {
    throw new EvolutionServiceError(502, "Brak danych o łańcuchu ewolucji w PokeAPI.", {
      code: "POKEAPI_ERROR",
    });
  }

  const chain = await fetchEvolutionChainByUrl(chainUrl);
  return { chain };
};

const persistChainCache = async (supabase: SupabaseServerClient | undefined, dto: EvolutionChainDto): Promise<void> => {
  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase.from(EVOLUTION_CACHE_TABLE).upsert(
      {
        chain_id: dto.chainId,
        root_pokemon_id: dto.leadPokemonId,
        lead_pokemon_name: dto.leadName,
        payload: dto,
        branches: dto.branches,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "chain_id" }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("[evolution] Failed to persist chain cache", error);
  }
};

const applyEvolutionFilters = (
  dto: EvolutionChainDto,
  chain: EvolutionChain,
  filters: Pick<EvolutionChainRequest, "type" | "generation" | "branching">
): EvolutionChainDto => {
  const branching = filters.branching ?? "any";

  const branchCount = dto.branches.length;
  if (branching === "linear" && branchCount > 1) {
    throw new EvolutionServiceError(404, "Łańcuch zawiera rozgałęzienia i nie spełnia filtra 'liniowe'.", {
      code: "INVALID_INPUT",
    });
  }

  if (branching === "branching" && branchCount <= 1) {
    throw new EvolutionServiceError(404, "Łańcuch nie posiada alternatywnych ścieżek ewolucji.", {
      code: "INVALID_INPUT",
    });
  }

  const typeFilter = filters.type ?? null;
  const generationFilter = filters.generation ?? null;

  if (!typeFilter && !generationFilter) {
    return dto;
  }

  const matchingStageIds = new Set<number>();

  dto.stages.forEach((stage) => {
    const typeOk = !typeFilter || stage.types.includes(typeFilter);
    const generationOk = !generationFilter || stage.generation === generationFilter;

    if (typeOk && generationOk) {
      matchingStageIds.add(stage.pokemonId);
    }
  });

  if (matchingStageIds.size === 0) {
    throw new EvolutionServiceError(404, "Brak etapów ewolucji spełniających wybrane filtry.", {
      code: "INVALID_INPUT",
    });
  }

  const branchPaths = collectBranchPaths(chain.chain);
  const allowedStageIds = new Set<number>();
  const allowedBranchIds = new Set<string>();

  branchPaths.forEach((path) => {
    const speciesIds = path.nodes
      .map((node) => extractIdFromResourceUrl(node.species?.url ?? null))
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

    const pathMatches = speciesIds.some((id) => matchingStageIds.has(id));
    if (pathMatches) {
      speciesIds.forEach((id) => allowedStageIds.add(id));
      allowedBranchIds.add(path.branchId);
    }
  });

  const stages = dto.stages.filter((stage) => stage.order === 1 || allowedStageIds.has(stage.pokemonId));

  if (stages.length === 0) {
    throw new EvolutionServiceError(404, "Etapy ewolucji zostały odfiltrowane.", {
      code: "INVALID_INPUT",
    });
  }

  const branches = dto.branches.filter((branch) => allowedBranchIds.has(branch.id));

  return {
    ...dto,
    stages,
    branches,
  };
};

export const fetchEvolutionChainDto = async (
  supabase: SupabaseServerClient | undefined,
  params: EvolutionChainRequest
): Promise<EvolutionChainDto> => {
  const { chain } = await resolveChainFromParams(params);

  const speciesIds = Array.from(collectSpeciesIds(chain?.chain ?? null, new Set<number>()));
  if (speciesIds.length === 0) {
    throw new EvolutionServiceError(502, "Łańcuch ewolucji nie zawiera etapów.", { code: "POKEAPI_ERROR" });
  }

  const pokemonMap = await fetchPokemonMap(speciesIds);
  const fullDto = buildEvolutionChainDto({
    chain,
    pokemonMap,
  });

  const filteredDto = applyEvolutionFilters(fullDto, chain, {
    type: params.type ?? null,
    generation: params.generation ?? null,
    branching: params.branching ?? null,
  });

  await persistChainCache(supabase, fullDto);

  return filteredDto;
};
