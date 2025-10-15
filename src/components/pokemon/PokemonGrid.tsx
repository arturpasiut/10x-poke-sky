import type { PokemonSummaryViewModel } from "@/lib/pokemon/types";

import { PokemonCard } from "./PokemonCard";

type PokemonGridProps = {
  items: PokemonSummaryViewModel[];
  "aria-busy"?: boolean;
};

export function PokemonGrid({ items, "aria-busy": busy }: PokemonGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="feed"
      aria-busy={busy}
      aria-live="polite"
    >
      {items.map((pokemon) => (
        <PokemonCard key={pokemon.pokemonId} pokemon={pokemon} />
      ))}
    </div>
  );
}
