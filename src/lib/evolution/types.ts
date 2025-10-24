import type { PokemonStat } from "@/lib/types/pokemon";
import type { PokemonTypeValue } from "@/lib/pokemon/types";

export type EvolutionDisplayMode = "list" | "graph";
export type EvolutionAssetPreference = "gif" | "sprite";

export interface EvolutionAssetSources {
  sprite: string | null;
  gif: string | null;
  officialArtwork: string | null;
  fallback: string | null;
}

export interface EvolutionRequirementDto {
  id: string;
  summary: string;
  icon?: string;
  detail?: string;
}

export interface EvolutionStageDto {
  stageId: string;
  order: number;
  pokemonId: number;
  slug: string;
  name: string;
  types: PokemonTypeValue[];
  description?: string | null;
  branchIds: string[];
  asset: EvolutionAssetSources;
  requirements: EvolutionRequirementDto[];
  stats?: PokemonStat[];
  statsDiff?: Partial<
    Record<"hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed", number>
  > | null;
  accentColor?: string;
}

export interface EvolutionBranchDto {
  id: string;
  label: string;
  description?: string;
}

export interface EvolutionChainDto {
  chainId: string;
  title: string;
  leadPokemonId: number;
  leadName: string;
  stages: EvolutionStageDto[];
  branches: EvolutionBranchDto[];
  summary?: string;
}
