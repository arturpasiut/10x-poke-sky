import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { EvolutionAssetPreference, EvolutionDisplayMode } from "@/lib/evolution/types";

const STORAGE_KEY = "10x:evolution-ui";

export interface EvolutionStoreState {
  selectedChainId: string | null;
  selectedBranchId: string | null;
  displayMode: EvolutionDisplayMode;
  assetPreference: EvolutionAssetPreference;
  focusedPokemonId: number | null;
  showStatDiffs: boolean;
  isHydrated: boolean;
  setSelectedChainId: (chainId: string | null) => void;
  setSelectedBranchId: (branchId: string | null) => void;
  setDisplayMode: (mode: EvolutionDisplayMode) => void;
  setAssetPreference: (preference: EvolutionAssetPreference) => void;
  focusPokemon: (pokemonId: number | null) => void;
  toggleStatDiffs: () => void;
  markHydrated: () => void;
}

const storage = typeof window === "undefined" ? undefined : createJSONStorage(() => window.localStorage);

export const useEvolutionStore = create<EvolutionStoreState>()(
  persist(
    (set) => ({
      selectedChainId: null,
      selectedBranchId: null,
      displayMode: "list",
      assetPreference: "gif",
      focusedPokemonId: null,
      showStatDiffs: false,
      isHydrated: typeof window === "undefined",
      setSelectedChainId(chainId) {
        set({ selectedChainId: chainId });
      },
      setSelectedBranchId(branchId) {
        set({ selectedBranchId: branchId });
      },
      setDisplayMode(mode) {
        set({ displayMode: mode });
      },
      setAssetPreference(preference) {
        set({ assetPreference: preference });
      },
      focusPokemon(pokemonId) {
        set({ focusedPokemonId: pokemonId });
      },
      toggleStatDiffs() {
        set((state) => ({ showStatDiffs: !state.showStatDiffs }));
      },
      markHydrated() {
        set({ isHydrated: true });
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({
        selectedChainId: state.selectedChainId,
        selectedBranchId: state.selectedBranchId,
        displayMode: state.displayMode,
        assetPreference: state.assetPreference,
        showStatDiffs: state.showStatDiffs,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[useEvolutionStore] Failed to hydrate evolution store state", error);
        }
        state?.markHydrated();
      },
    }
  )
);

export const selectEvolutionDisplayMode = (state: EvolutionStoreState) => state.displayMode;
export const selectEvolutionAssetPreference = (state: EvolutionStoreState) => state.assetPreference;
export const selectSelectedBranchId = (state: EvolutionStoreState) => state.selectedBranchId;
export const selectFocusedPokemonId = (state: EvolutionStoreState) => state.focusedPokemonId;
export const selectShowStatDiffs = (state: EvolutionStoreState) => state.showStatDiffs;
export const selectEvolutionHydration = (state: EvolutionStoreState) => state.isHydrated;
