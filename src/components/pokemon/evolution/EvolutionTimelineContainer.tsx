import { memo, useCallback } from "react";

import clsx from "clsx";

import { useEffect, useRef } from "react";

import type { EvolutionAssetPreference, EvolutionChainDto } from "@/lib/evolution/types";
import { PokemonEvolutionTimeline } from "@/components/pokemon/evolution/PokemonEvolutionTimeline";
import {
  selectEvolutionAssetPreference,
  selectEvolutionDisplayMode,
  selectShowStatDiffs,
  useEvolutionStore,
} from "@/stores/useEvolutionStore";

export interface EvolutionTimelineContainerProps {
  chain: EvolutionChainDto;
  className?: string;
  assetPreference?: EvolutionAssetPreference | null;
}

function Component({ chain, className, assetPreference: profilePreference }: EvolutionTimelineContainerProps) {
  const displayMode = useEvolutionStore(selectEvolutionDisplayMode);
  const setDisplayMode = useEvolutionStore((state) => state.setDisplayMode);
  const assetPreference = useEvolutionStore(selectEvolutionAssetPreference);
  const setAssetPreference = useEvolutionStore((state) => state.setAssetPreference);
  const showStatDiffs = useEvolutionStore(selectShowStatDiffs);
  const toggleStatDiffs = useEvolutionStore((state) => state.toggleStatDiffs);
  const hasSyncedAssetPreference = useRef(false);

  const handleDisplayModeChange = useCallback(
    (mode: "list" | "graph") => {
      setDisplayMode(mode);
    },
    [setDisplayMode]
  );

  useEffect(() => {
    if (!profilePreference) {
      return;
    }

    if (!hasSyncedAssetPreference.current && assetPreference !== profilePreference) {
      setAssetPreference(profilePreference);
    }

    if (profilePreference) {
      hasSyncedAssetPreference.current = true;
    }
  }, [assetPreference, profilePreference, setAssetPreference]);

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/70">
          <span className="uppercase tracking-[0.2em] text-white/40">Widok</span>
          <div className="inline-flex rounded-full bg-white/10 p-1">
            <button
              type="button"
              onClick={() => handleDisplayModeChange("list")}
              className={clsx(
                "rounded-full px-3 py-1 font-semibold uppercase tracking-wide transition",
                displayMode === "list" ? "bg-primary/80 text-white shadow" : "text-white/70 hover:text-white"
              )}
            >
              Oś czasu
            </button>
            <button
              type="button"
              onClick={() => handleDisplayModeChange("graph")}
              className={clsx(
                "rounded-full px-3 py-1 font-semibold uppercase tracking-wide transition",
                displayMode === "graph" ? "bg-primary/80 text-white shadow" : "text-white/70 hover:text-white"
              )}
            >
              Siatka
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleStatDiffs}
          className={clsx(
            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
            showStatDiffs
              ? "border-primary/60 bg-primary/25 text-white shadow"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
          )}
        >
          {showStatDiffs ? "Ukryj zmiany statystyk" : "Pokaż zmiany statystyk"}
        </button>
      </div>

      <PokemonEvolutionTimeline
        chain={chain}
        displayMode={displayMode}
        assetPreference={profilePreference ?? assetPreference}
      />
    </div>
  );
}

export const EvolutionTimelineContainer = memo(Component);
