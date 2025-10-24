import { useEffect, useMemo } from "react";

import clsx from "clsx";

import type { EvolutionChainDto, EvolutionDisplayMode, EvolutionAssetPreference } from "@/lib/evolution/types";
import { EvolutionStageCard } from "@/components/pokemon/evolution/EvolutionStageCard";
import {
  selectEvolutionHydration,
  selectFocusedPokemonId,
  selectSelectedBranchId,
  selectShowStatDiffs,
  useEvolutionStore,
} from "@/stores/useEvolutionStore";

export interface PokemonEvolutionTimelineProps {
  chain: EvolutionChainDto | null;
  displayMode: EvolutionDisplayMode;
  assetPreference: EvolutionAssetPreference;
  onStageFocus?: (pokemonId: number) => void;
}

export function PokemonEvolutionTimeline({
  chain,
  displayMode,
  assetPreference,
  onStageFocus,
}: PokemonEvolutionTimelineProps) {
  const selectedBranchId = useEvolutionStore(selectSelectedBranchId);
  const focusedPokemonId = useEvolutionStore(selectFocusedPokemonId);
  const focusPokemon = useEvolutionStore((state) => state.focusPokemon);
  const setSelectedChainId = useEvolutionStore((state) => state.setSelectedChainId);
  const showStatDiffs = useEvolutionStore(selectShowStatDiffs);
  const isHydrated = useEvolutionStore(selectEvolutionHydration);

  const stages = useMemo(() => {
    if (!chain?.stages?.length) {
      return [];
    }

    if (!selectedBranchId) {
      return chain.stages;
    }

    return chain.stages.filter((stage) => stage.branchIds.includes(selectedBranchId) || stage.order === 1);
  }, [chain, selectedBranchId]);

  useEffect(() => {
    if (chain?.chainId) {
      setSelectedChainId(chain.chainId);
    }
  }, [chain?.chainId, setSelectedChainId]);

  useEffect(() => {
    if (!stages.length || !isHydrated) {
      return;
    }

    if (!focusedPokemonId) {
      focusPokemon(stages[0].pokemonId);
    }
  }, [focusPokemon, focusedPokemonId, isHydrated, stages]);

  if (!chain) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
        Ten Pokémon nie posiada zdefiniowanego łańcucha ewolucji.
      </p>
    );
  }

  if (!stages.length) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
        Nie znaleziono etapów ewolucji dla wybranych filtrów.
      </p>
    );
  }

  const layoutClass =
    displayMode === "graph"
      ? "grid gap-6 lg:grid-cols-2"
      : "flex snap-x gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 text-white">
        <h2 className="text-2xl font-semibold">{chain.title}</h2>
        {chain.summary && <p className="text-sm text-white/70">{chain.summary}</p>}
      </header>

      <ol className={clsx(layoutClass, "relative")}>
        {stages.map((stage, index) => {
          const isActive = stage.pokemonId === focusedPokemonId;
          const item = (
            <EvolutionStageCard
              stage={stage}
              assetPreference={assetPreference}
              isActive={isActive}
              showStatDiffs={showStatDiffs && isHydrated}
              onFocus={(pokemonId) => {
                focusPokemon(pokemonId);
                onStageFocus?.(pokemonId);
              }}
            />
          );

          if (displayMode === "graph") {
            return (
              <li key={stage.stageId} className="relative h-full">
                {item}
              </li>
            );
          }

          return (
            <li key={stage.stageId} className="relative min-w-[280px]">
              {item}
              {index < stages.length - 1 && (
                <span className="absolute top-1/2 right-[-36px] hidden h-[2px] w-16 -translate-y-1/2 bg-gradient-to-r from-white/10 to-white/50 lg:block" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
