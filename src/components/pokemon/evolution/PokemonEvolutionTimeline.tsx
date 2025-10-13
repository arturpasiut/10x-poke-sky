import type { ChainLink, EvolutionChain } from "@/lib/types/pokemon";

const STEP_ICON = "➡️";

export interface PokemonEvolutionTimelineProps {
  chain: EvolutionChain | null;
}

export function PokemonEvolutionTimeline({ chain }: PokemonEvolutionTimelineProps) {
  if (!chain?.chain) {
    return (
      <p className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
        Ten Pokémon nie posiada zdefiniowanego łańcucha ewolucji.
      </p>
    );
  }

  const flattened = flattenEvolutionChain(chain.chain);

  if (!flattened.length) {
    return (
      <p className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
        Brak danych o ewolucjach w PokeAPI.
      </p>
    );
  }

  return (
    <ol className="flex snap-x gap-4 overflow-x-auto pb-2">
      {flattened.map((step, index) => (
        <li
          key={`${step.species}-${index}`}
          className="flex min-w-[220px] flex-col items-center gap-3 rounded-2xl border border-border/30 bg-surface/80 px-4 py-5 text-center shadow-sm backdrop-blur"
        >
          <span className="text-sm font-semibold capitalize text-foreground">{step.species}</span>
          <p className="text-xs text-muted-foreground">
            {step.triggers.length ? step.triggers.join(", ") : index === 0 ? "Forma startowa" : STEP_ICON}
          </p>
        </li>
      ))}
    </ol>
  );
}

type FlattenedStep = {
  species: string;
  triggers: string[];
};

export const flattenEvolutionChain = (node: ChainLink | null, acc: FlattenedStep[] = []): FlattenedStep[] => {
  if (!node) return acc;

  const triggers = (node.evolution_details ?? []).map((detail) => {
    if (detail.trigger?.name === "level-up" && detail.min_level) {
      return `Poziom ${detail.min_level}`;
    }
    if (detail.trigger?.name) {
      return detail.trigger.name.replace(/-/g, " ");
    }
    return "Ewolucja";
  });

  acc.push({
    species: node.species?.name ?? "unknown",
    triggers: triggers.filter(Boolean),
  });

  node.evolves_to?.forEach((child) => flattenEvolutionChain(child, acc));
  return acc;
};
