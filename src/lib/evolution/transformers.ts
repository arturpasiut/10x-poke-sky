import type { EvolutionChain, EvolutionDetail, ChainLink, Pokemon } from "@/lib/types/pokemon";

import { isValidPokemonType } from "@/lib/pokemon/filters";
import { formatPokemonDisplayName } from "@/lib/pokemon/transformers";
import type { PokemonTypeValue } from "@/lib/pokemon/types";

import type { EvolutionChainDto, EvolutionStageDto, EvolutionRequirementDto, EvolutionBranchDto } from "./types";
import { extractIdFromResourceUrl, formatLabel, slugify } from "./utils";

interface BranchPath {
  branchId: string;
  nodes: ChainLink[];
  label: string;
}

interface StageAccumulator {
  slug: string;
  order: number;
  branchIds: Set<string>;
  evolutionDetails: EvolutionDetail[];
}

const formatPokemonTypes = (types: Pokemon["types"]): PokemonTypeValue[] =>
  Array.isArray(types)
    ? types
        .map((entry) => entry?.type?.name ?? "")
        .filter((value): value is PokemonTypeValue => isValidPokemonType(value))
    : [];

const buildAssetSources = (pokemon: Pokemon) => {
  const fallbackSprite = `/images/pokemon/${pokemon.id}.png`;
  const officialArtwork = pokemon?.sprites?.other?.["official-artwork"]?.front_default ?? null;
  const sprite =
    pokemon?.sprites?.front_default ??
    pokemon?.sprites?.other?.home?.front_default ??
    pokemon?.sprites?.other?.dream_world?.front_default ??
    officialArtwork ??
    null;

  return {
    gif: null,
    sprite,
    officialArtwork,
    fallback: fallbackSprite,
  };
};

const describeGender = (gender: number | null): string | null => {
  if (gender === 1) {
    return "Wyłącznie samica";
  }
  if (gender === 2) {
    return "Wyłącznie samiec";
  }
  return null;
};

const describeEvolutionDetail = (detail: EvolutionDetail): string => {
  const parts: string[] = [];

  if (detail.trigger?.name === "trade") {
    parts.push("Wymiana z trenerem");
  } else if (detail.trigger?.name === "use-item" && detail.item?.name) {
    parts.push(`Użyj ${formatLabel(detail.item.name)}`);
  } else if (detail.trigger?.name === "level-up" && detail.min_level) {
    parts.push(`Poziom ${detail.min_level}`);
  } else if (detail.trigger?.name && detail.trigger.name !== "level-up") {
    parts.push(formatLabel(detail.trigger.name));
  }

  if (detail.time_of_day) {
    parts.push(`Pora dnia: ${formatLabel(detail.time_of_day)}`);
  }

  if (detail.gender !== null && detail.gender !== undefined) {
    const genderDescription = describeGender(detail.gender);
    if (genderDescription) {
      parts.push(genderDescription);
    }
  }

  if (detail.location?.name) {
    parts.push(`Miejsce: ${formatLabel(detail.location.name)}`);
  }

  if (detail.known_move?.name) {
    parts.push(`Zna ruch: ${formatLabel(detail.known_move.name)}`);
  }

  if (detail.known_move_type?.name) {
    parts.push(`Zna ruch typu ${formatLabel(detail.known_move_type.name)}`);
  }

  if (detail.min_affection) {
    parts.push(`Potrzebna przyjaźń: ${detail.min_affection}`);
  }

  if (detail.min_beauty) {
    parts.push(`Potrzebna uroda: ${detail.min_beauty}`);
  }

  if (detail.min_happiness) {
    parts.push(`Potrzebne szczęście: ${detail.min_happiness}`);
  }

  if (detail.relative_physical_stats === 1) {
    parts.push("Atak fizyczny > obrona");
  } else if (detail.relative_physical_stats === -1) {
    parts.push("Atak fizyczny < obrona");
  } else if (detail.relative_physical_stats === 0) {
    parts.push("Atak fizyczny = obrona");
  }

  if (detail.needs_overworld_rain) {
    parts.push("W czasie deszczu");
  }

  if (detail.turn_upside_down) {
    parts.push("Odwróć konsolę");
  }

  if (detail.trade_species?.name) {
    parts.push(`Wymień z ${formatLabel(detail.trade_species.name)}`);
  }

  if (detail.party_species?.name) {
    parts.push(`W drużynie: ${formatLabel(detail.party_species.name)}`);
  }

  if (detail.party_type?.name) {
    parts.push(`W drużynie Pokémon typu ${formatLabel(detail.party_type.name)}`);
  }

  const summary = parts.length ? parts.join(", ") : formatLabel(detail.trigger?.name ?? "Ewolucja");

  return summary;
};

const toRequirements = (details: EvolutionDetail[], isBaseStage: boolean): EvolutionRequirementDto[] => {
  if (isBaseStage) {
    return [
      {
        id: "base",
        summary: "Forma startowa",
      },
    ];
  }

  const dedup = new Map<string, EvolutionRequirementDto>();

  details.forEach((detail, index) => {
    const summary = describeEvolutionDetail(detail);
    const key = summary.toLowerCase();

    if (!dedup.has(key)) {
      dedup.set(key, {
        id: `detail-${index}`,
        summary,
      });
    }
  });

  return Array.from(dedup.values());
};

const collectBranchPaths = (node: ChainLink): BranchPath[] => {
  const traverse = (link: ChainLink, path: ChainLink[]): ChainLink[][] => {
    const nextPath = [...path, link];

    if (!link.evolves_to?.length) {
      return [nextPath];
    }

    return link.evolves_to.flatMap((child) => traverse(child, nextPath));
  };

  const paths = traverse(node, []);

  return paths.map((nodes, index) => {
    const last = nodes[nodes.length - 1];
    const label = formatLabel(last?.species?.name ?? `Ścieżka ${index + 1}`);
    const branchId = `branch-${index + 1}-${slugify(last?.species?.name ?? `path-${index + 1}`)}`;

    return {
      branchId,
      nodes,
      label,
    };
  });
};

const buildStageAccumulators = (branches: BranchPath[]): Map<number, StageAccumulator> => {
  const stageMap = new Map<number, StageAccumulator>();

  branches.forEach(({ branchId, nodes }) => {
    nodes.forEach((node, depthIndex) => {
      const speciesUrl = node?.species?.url ?? null;
      const speciesId = extractIdFromResourceUrl(speciesUrl);

      if (!speciesId) {
        return;
      }

      const slug = node?.species?.name ?? `pokemon-${speciesId}`;
      const entry = stageMap.get(speciesId) ?? {
        slug,
        order: depthIndex + 1,
        branchIds: new Set<string>(),
        evolutionDetails: [],
      };

      entry.order = Math.min(entry.order, depthIndex + 1);
      entry.branchIds.add(branchId);

      if (depthIndex > 0 && Array.isArray(node.evolution_details)) {
        entry.evolutionDetails.push(...node.evolution_details);
      }

      stageMap.set(speciesId, entry);
    });
  });

  return stageMap;
};

interface BuildEvolutionChainArgs {
  chain: EvolutionChain;
  pokemonMap: Map<number, Pokemon | null>;
}

export const buildEvolutionChainDto = ({ chain, pokemonMap }: BuildEvolutionChainArgs): EvolutionChainDto => {
  const root = chain?.chain;
  if (!root) {
    throw new Error("Łańcuch ewolucji nie zawiera danych o formach.");
  }

  const branches = collectBranchPaths(root);
  const accumulators = buildStageAccumulators(branches);

  const stages: EvolutionStageDto[] = [];
  const sortedStageEntries = Array.from(accumulators.entries()).sort((a, b) => a[1].order - b[1].order);

  for (const [pokemonId, accumulator] of sortedStageEntries) {
    const pokemon = pokemonMap.get(pokemonId) ?? null;
    const isBaseStage = accumulator.order === 1;

    const types = pokemon ? formatPokemonTypes(pokemon.types) : [];
    const stats = pokemon?.stats ?? undefined;

    stages.push({
      stageId: `${pokemonId}-${accumulator.slug}`,
      order: accumulator.order,
      pokemonId,
      slug: accumulator.slug,
      name: formatPokemonDisplayName(accumulator.slug),
      types,
      description: null,
      branchIds: Array.from(accumulator.branchIds),
      asset: pokemon ? buildAssetSources(pokemon) : { gif: null, sprite: null, officialArtwork: null, fallback: null },
      requirements: toRequirements(accumulator.evolutionDetails, isBaseStage),
      stats,
      statsDiff: null,
      accentColor: undefined,
    });
  }

  const branchDtos: EvolutionBranchDto[] = branches.map((entry) => ({
    id: entry.branchId,
    label: entry.label,
    description: entry.nodes.length > 1 ? `Ścieżka prowadząca do ${entry.label}` : undefined,
  }));

  const leadStage = stages.find((stage) => stage.order === 1) ?? stages[0];
  const summary =
    branches.length > 1
      ? `Łańcuch zawiera ${branches.length} alternatywnych ścieżek rozwoju.`
      : `Łańcuch zawiera ${stages.length} etap${stages.length === 1 ? "" : "y"} ewolucji.`;

  return {
    chainId: String(chain.id ?? leadStage?.pokemonId ?? "unknown"),
    title: leadStage ? `${leadStage.name} – łańcuch ewolucji` : "Łańcuch ewolucji",
    leadPokemonId: leadStage?.pokemonId ?? 0,
    leadName: leadStage?.name ?? "Nieznany Pokémon",
    stages,
    branches: branchDtos,
    summary,
  };
};
