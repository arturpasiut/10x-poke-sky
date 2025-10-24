import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import type { EvolutionChain, ChainLink, Pokemon } from "@/lib/types/pokemon";

import { EvolutionServiceError } from "./errors";
import { fetchEvolutionChainById, fetchEvolutionChainByUrl, fetchPokemonDetail, fetchPokemonSpecies } from "./pokeapi";
import { buildEvolutionChainDto } from "./transformers";
import type { EvolutionChainDto } from "./types";
import { extractIdFromResourceUrl } from "./utils";

type SupabaseServerClient = SupabaseClient<Database>;

export interface EvolutionChainRequest {
  chainId?: number | string | null;
  pokemonId?: number | null;
  identifier?: string | null;
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
  const dto = buildEvolutionChainDto({
    chain,
    pokemonMap,
  });

  await persistChainCache(supabase, dto);

  return dto;
};
