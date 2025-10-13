import type { PokemonSummaryDto } from "@/types";
import { useEffect, useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TYPE_GRADIENTS: Record<string, string> = {
  grass: "from-pokemon-grass/20 via-pokemon-grass/10 to-transparent",
  poison: "from-pokemon-poison/20 via-pokemon-poison/5 to-transparent",
  fire: "from-pokemon-fire/20 via-pokemon-fire/10 to-transparent",
  water: "from-pokemon-water/20 via-pokemon-water/10 to-transparent",
  electric: "from-pokemon-electric/30 via-pokemon-electric/10 to-transparent",
  bug: "from-pokemon-bug/20 via-pokemon-bug/5 to-transparent",
  flying: "from-pokemon-flying/20 via-pokemon-flying/5 to-transparent",
  psychic: "from-pokemon-psychic/20 via-pokemon-psychic/5 to-transparent",
  rock: "from-pokemon-rock/20 via-pokemon-rock/5 to-transparent",
  ground: "from-pokemon-ground/20 via-pokemon-ground/5 to-transparent",
  ice: "from-pokemon-ice/20 via-pokemon-ice/5 to-transparent",
  dragon: "from-pokemon-dragon/20 via-pokemon-dragon/5 to-transparent",
  dark: "from-pokemon-dark/20 via-pokemon-dark/5 to-transparent",
  ghost: "from-pokemon-ghost/20 via-pokemon-ghost/5 to-transparent",
  steel: "from-pokemon-steel/20 via-pokemon-steel/5 to-transparent",
  fairy: "from-pokemon-fairy/20 via-pokemon-fairy/5 to-transparent",
  fighting: "from-pokemon-fighting/20 via-pokemon-fighting/5 to-transparent",
  normal: "from-neutral-light/30 via-neutral-light/10 to-transparent",
};

function getGradient(types: string[]) {
  if (types.length === 0) return "from-neutral-light/20 via-neutral-light/5 to-transparent";
  return TYPE_GRADIENTS[types[0]] ?? "from-neutral-light/20 via-neutral-light/5 to-transparent";
}

function formatDexNumber(id: number) {
  return `#${id.toString().padStart(3, "0")}`;
}

const GENERATION_LABELS: Record<string, string> = {
  "generation-i": "I",
  "generation-ii": "II",
  "generation-iii": "III",
  "generation-iv": "IV",
  "generation-v": "V",
  "generation-vi": "VI",
  "generation-vii": "VII",
  "generation-viii": "VIII",
  "generation-ix": "IX",
};

function formatGeneration(value: string | null | undefined) {
  if (!value) return "?";
  return GENERATION_LABELS[value] ?? value.replace("generation-", "").toUpperCase();
}

function formatRegion(value: string | null | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTypeLabel(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface PokemonCardProps {
  pokemon: PokemonSummaryDto;
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  const gradient = getGradient(pokemon.types ?? []);
  const [searchSuffix, setSearchSuffix] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setSearchSuffix(window.location.search);
  }, []);

  const detailHref = `/pokemon/${pokemon.pokemonId}${searchSuffix}`;

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-border/40 bg-gradient-to-br transition-transform hover:-translate-y-1 hover:shadow-floating",
        gradient
      )}
    >
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>{formatDexNumber(pokemon.pokemonId)}</span>
          <span>{formatRegion(pokemon.region)}</span>
        </div>
        <CardTitle className="text-2xl font-semibold capitalize text-foreground sm:text-3xl">{pokemon.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center gap-4">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-white/40 p-4 backdrop-blur-sm shadow-inner shadow-black/10 transition group-hover:scale-105 dark:bg-white/10">
          {pokemon.spriteUrl ? (
            <img
              src={pokemon.spriteUrl}
              alt={pokemon.name}
              loading="lazy"
              className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
            />
          ) : (
            <span className="text-sm text-muted-foreground">Brak obrazu</span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {pokemon.types?.map((type) => (
            <Badge key={type} tone={type.toLowerCase() as BadgeTone} variant="surface">
              {formatTypeLabel(type)}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between border-t border-border/30 bg-background/60 px-4 pt-4 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">Generacja {formatGeneration(pokemon.generation)}</span>
        <a
          href={detailHref}
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Szczegóły
        </a>
      </CardFooter>
    </Card>
  );
}
