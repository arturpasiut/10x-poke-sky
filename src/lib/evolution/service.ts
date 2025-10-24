import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { EvolutionChain, ChainLink, Pokemon } from "@/lib/types/pokemon";
import type { PokemonGenerationValue, PokemonTypeValue } from "@/lib/pokemon/types";

import { EvolutionServiceError } from "./errors";
import { fetchEvolutionChainById, fetchEvolutionChainByUrl, fetchPokemonDetail, fetchPokemonSpecies } from "./pokeapi";
import { buildEvolutionChainDto } from "./transformers";
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

const computeCacheMetadata = (dto: EvolutionChainDto) => {
  const typeTags = Array.from(new Set(dto.stages.flatMap((stage) => stage.types))).sort();
  const generationTags = Array.from(
    new Set(
      dto.stages.map((stage) => stage.generation).filter((value): value is PokemonGenerationValue => Boolean(value))
    )
  ).sort();
  const pokemonIds = Array.from(new Set(dto.stages.map((stage) => stage.pokemonId))).sort((a, b) => a - b);
  const branchingCount = Math.max(1, dto.branches.length || 1);
  const searchTerms = `${dto.leadName ?? ""} ${dto.title ?? ""} ${dto.stages.map((stage) => stage.name).join(" ")}`
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return {
    typeTags,
    generationTags,
    pokemonIds,
    branchingCount,
    searchTerms: searchTerms.length ? searchTerms : null,
  };
};

const persistChainCache = async (supabase: SupabaseServerClient | undefined, dto: EvolutionChainDto): Promise<void> => {
  if (!supabase) {
    return;
  }

  try {
    const metadata = computeCacheMetadata(dto);
    const { error } = await supabase.from(EVOLUTION_CACHE_TABLE).upsert(
      {
        chain_id: dto.chainId,
        root_pokemon_id: dto.leadPokemonId,
        lead_pokemon_name: dto.leadName,
        payload: dto,
        branches: dto.branches,
        cached_at: new Date().toISOString(),
        type_tags: metadata.typeTags,
        generation_tags: metadata.generationTags,
        pokemon_ids: metadata.pokemonIds,
        branching_count: metadata.branchingCount,
        search_terms: metadata.searchTerms,
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

  const allowedBranchIds = new Set<string>();
  dto.stages.forEach((stage) => {
    if (matchingStageIds.has(stage.pokemonId)) {
      stage.branchIds.forEach((branchId) => allowedBranchIds.add(branchId));
    }
  });

  if (allowedBranchIds.size === 0 && dto.branches.length > 0) {
    dto.branches.forEach((branch) => allowedBranchIds.add(branch.id));
  }

  const stages = dto.stages.filter((stage) => {
    if (stage.order === 1) {
      return true;
    }

    if (stage.branchIds.length === 0) {
      return true;
    }

    return stage.branchIds.some((branchId) => allowedBranchIds.has(branchId));
  });

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

const findCachedChain = async (
  supabase: SupabaseServerClient | undefined,
  params: EvolutionChainRequest
): Promise<EvolutionChainDto | null> => {
  if (!supabase) {
    return null;
  }

  let query = supabase
    .from(EVOLUTION_CACHE_TABLE)
    .select("payload, type_tags, generation_tags, pokemon_ids, branching_count, lead_pokemon_name, search_terms")
    .order("cached_at", { ascending: false })
    .limit(1);

  if (params.chainId) {
    query = query.eq("chain_id", String(params.chainId));
  } else if (params.pokemonId) {
    query = query.contains("pokemon_ids", [params.pokemonId]);
  } else if (params.identifier) {
    const term = params.identifier.trim().toLowerCase().replace(/[%_]/g, "");
    if (term.length) {
      const safePattern = term.replace(/'/g, "''");
      const pattern = `%${safePattern}%`;
      query = query.or(`lead_pokemon_name.ilike.${pattern},search_terms.ilike.${pattern}`);
    }
  }

  if (params.type) {
    query = query.contains("type_tags", [params.type]);
  }

  if (params.generation) {
    query = query.contains("generation_tags", [params.generation]);
  }

  if (params.branching === "linear") {
    query = query.lte("branching_count", 1);
  } else if (params.branching === "branching") {
    query = query.gt("branching_count", 1);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[evolution] Failed to read cache", error);
    return null;
  }

  const payload = data?.[0]?.payload as EvolutionChainDto | undefined;
  return payload ?? null;
};

export const fetchEvolutionChainDto = async (
  supabase: SupabaseServerClient | undefined,
  params: EvolutionChainRequest
): Promise<EvolutionChainDto> => {
  const cached = await findCachedChain(supabase, params);
  if (cached) {
    return applyEvolutionFilters(cached, {
      type: params.type ?? null,
      generation: params.generation ?? null,
      branching: params.branching ?? null,
    });
  }

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

  const filteredDto = applyEvolutionFilters(fullDto, {
    type: params.type ?? null,
    generation: params.generation ?? null,
    branching: params.branching ?? null,
  });

  await persistChainCache(supabase, fullDto);

  return filteredDto;
};
