import type { PokemonSummaryDto } from "@/types";

export type PokemonSummaryLookup = Record<number, PokemonSummaryDto | undefined>;

const buildSummaryUrl = (ids: number[]): string => {
  const params = new URLSearchParams();
  params.set("ids", ids.join(","));
  return `/api/pokemon/summary?${params.toString()}`;
};

export const fetchPokemonSummaryLookup = async (
  ids: number[],
  options: { signal?: AbortSignal } = {}
): Promise<PokemonSummaryLookup> => {
  if (ids.length === 0) {
    return {};
  }

  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id > 0)));

  if (uniqueIds.length === 0) {
    return {};
  }

  const response = await fetch(buildSummaryUrl(uniqueIds), {
    method: "GET",
    signal: options.signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać szczegółów Pokémonów (status ${response.status}).`);
  }

  const payload = (await response.json()) as {
    items: PokemonSummaryDto[];
  };

  return payload.items.reduce<PokemonSummaryLookup>((acc, item) => {
    acc[item.pokemonId] = item;
    return acc;
  }, {});
};
