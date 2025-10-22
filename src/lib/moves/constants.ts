import { POKEMON_GENERATION_OPTIONS, POKEMON_REGION_OPTIONS } from "@/lib/pokemon/filters";
import type { PokemonGenerationValue, PokemonRegionValue } from "@/lib/pokemon/types";

export const MOVE_SORT_OPTIONS = [
  { value: "name", label: "Nazwa", description: "Porządkuj alfabetycznie" },
  { value: "power", label: "Moc", description: "Najsilniejsze ruchy na początku" },
  { value: "accuracy", label: "Celność", description: "Najbardziej precyzyjne ruchy na początku" },
  { value: "cachedAt", label: "Ostatnia aktualizacja", description: "Najnowsze wpisy na początku" },
] as const;

export const GENERATION_TO_REGION: Record<PokemonGenerationValue, PokemonRegionValue> = {
  "generation-i": "kanto",
  "generation-ii": "johto",
  "generation-iii": "hoenn",
  "generation-iv": "sinnoh",
  "generation-v": "unova",
  "generation-vi": "kalos",
  "generation-vii": "alola",
  "generation-viii": "galar",
  "generation-ix": "paldea",
};

export const REGION_TO_GENERATIONS = POKEMON_REGION_OPTIONS.reduce<
  Record<PokemonRegionValue, PokemonGenerationValue[]>
>((accumulator, option) => {
  switch (option.value) {
    case "hisui":
      accumulator.hisui = ["generation-viii"];
      break;
    default: {
      const generation = POKEMON_GENERATION_OPTIONS.find(
        (generationOption) => GENERATION_TO_REGION[generationOption.value] === option.value
      );
      accumulator[option.value] = generation ? [generation.value] : [];
    }
  }
  return accumulator;
}, {} as Record<PokemonRegionValue, PokemonGenerationValue[]>);

export const MOVE_MAX_POWER = 300;
export const MOVE_MIN_POWER = 0;

export const MOVE_MAX_SEARCH_LENGTH = 100;

export const MOVE_PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
export const DEFAULT_MOVE_PAGE_SIZE = MOVE_PAGE_SIZE_OPTIONS[0];

export const DEFAULT_MOVE_SORT_KEY = MOVE_SORT_OPTIONS[0].value;
export const DEFAULT_MOVE_SORT_ORDER = "asc" as const;

export const MIN_PAGE = 1;

export const isValidGenerationValue = (value: string): value is PokemonGenerationValue =>
  POKEMON_GENERATION_OPTIONS.some((option) => option.value === value);

export const isValidRegionValue = (value: string): value is PokemonRegionValue =>
  POKEMON_REGION_OPTIONS.some((option) => option.value === value);

export const resolveRegionForGeneration = (
  generation: string | null | undefined
): PokemonRegionValue | null => {
  if (!generation || !isValidGenerationValue(generation)) {
    return null;
  }
  return GENERATION_TO_REGION[generation];
};

export const resolveGenerationsForRegion = (
  region: string | null | undefined
): PokemonGenerationValue[] => {
  if (!region || !isValidRegionValue(region)) {
    return [];
  }
  return REGION_TO_GENERATIONS[region] ?? [];
};
