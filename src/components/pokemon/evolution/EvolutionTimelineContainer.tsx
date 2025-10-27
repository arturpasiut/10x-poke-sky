import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import clsx from "clsx";
import { BookmarkPlus, Loader2 } from "lucide-react";

import type { EvolutionAssetPreference, EvolutionChainDto } from "@/lib/evolution/types";
import { PokemonEvolutionTimeline } from "@/components/pokemon/evolution/PokemonEvolutionTimeline";
import {
  selectEvolutionAssetPreference,
  selectEvolutionDisplayMode,
  selectSelectedBranchId,
  selectShowStatDiffs,
  useEvolutionStore,
} from "@/stores/useEvolutionStore";
import { useSessionStore } from "@/lib/stores/use-session-store";
import { saveEvolutionFavoriteGroup, FavoritesApiError } from "@/lib/favorites/api";

export interface EvolutionTimelineContainerProps {
  chain: EvolutionChainDto;
  className?: string;
  assetPreference?: EvolutionAssetPreference | null;
  initialIsAuthenticated?: boolean;
  onGroupSaved?: () => void;
}

function Component({
  chain,
  className,
  assetPreference: profilePreference,
  initialIsAuthenticated = false,
  onGroupSaved,
}: EvolutionTimelineContainerProps) {
  const displayMode = useEvolutionStore(selectEvolutionDisplayMode);
  const setDisplayMode = useEvolutionStore((state) => state.setDisplayMode);
  const assetPreference = useEvolutionStore(selectEvolutionAssetPreference);
  const setAssetPreference = useEvolutionStore((state) => state.setAssetPreference);
  const showStatDiffs = useEvolutionStore(selectShowStatDiffs);
  const toggleStatDiffs = useEvolutionStore((state) => state.toggleStatDiffs);
  const hasSyncedAssetPreference = useRef(false);
  const selectedBranchId = useEvolutionStore(selectSelectedBranchId);

  const sessionStatus = useSessionStore((state) => state.status);
  const isAuthenticated = initialIsAuthenticated || sessionStatus === "authenticated";

  const [loginHref, setLoginHref] = useState("/auth/login");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleDisplayModeChange = useCallback(
    (mode: "list" | "graph") => {
      setDisplayMode(mode);
    },
    [setDisplayMode]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams({
      redirectTo: window.location.pathname + window.location.search,
    });
    setLoginHref(`/auth/login?${params.toString()}`);
  }, []);

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

  const visibleStages = useMemo(() => {
    if (!chain.stages?.length) {
      return [];
    }

    if (!selectedBranchId) {
      return chain.stages;
    }

    return chain.stages.filter((stage) => stage.branchIds.includes(selectedBranchId) || stage.order === 1);
  }, [chain, selectedBranchId]);

  const handleSaveGroup = useCallback(async () => {
    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        window.location.href = loginHref;
      }
      return;
    }

    if (!visibleStages.length) {
      setSaveStatus("error");
      setSaveError("Brak etapów do zapisania dla wybranego filtra.");
      return;
    }

    const pokemonIds = Array.from(new Set(visibleStages.map((stage) => stage.pokemonId)));

    setSaveStatus("saving");
    setSaveError(null);
    setSaveMessage(null);

    try {
      await saveEvolutionFavoriteGroup({
        chainId: chain.chainId,
        branchId: selectedBranchId ?? null,
        pokemonIds,
      });

      setSaveStatus("success");
      setSaveMessage("Drużyna zapisana w ulubionych.");
      onGroupSaved?.();

      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage(null);
      }, 4000);
    } catch (error) {
      const message =
        error instanceof FavoritesApiError ? error.message : "Nie udało się zapisać drużyny. Spróbuj ponownie później.";
      setSaveStatus("error");
      setSaveError(message);
    }
  }, [chain.chainId, isAuthenticated, loginHref, onGroupSaved, selectedBranchId, visibleStages]);

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
        <div className="flex flex-wrap items-center gap-2">
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
            {showStatDiffs ? "Ukryj statystyki" : "Pokaż statystyki"}
          </button>
          <button
            type="button"
            onClick={handleSaveGroup}
            disabled={saveStatus === "saving" || visibleStages.length === 0}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
              saveStatus === "saving"
                ? "border-white/20 bg-white/10 text-white/60"
                : "border-primary/50 bg-primary/30 text-white hover:bg-primary/40"
            )}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BookmarkPlus className="size-4" />
            )}
            Zapisz drużynę
          </button>
        </div>
      </div>

      <PokemonEvolutionTimeline
        chain={chain}
        displayMode={displayMode}
        assetPreference={profilePreference ?? assetPreference}
      />

      {saveMessage ? <p className="text-xs text-emerald-300">{saveMessage}</p> : null}
      {saveError ? (
        <p className="text-xs text-red-300" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}

export const EvolutionTimelineContainer = memo(Component);
