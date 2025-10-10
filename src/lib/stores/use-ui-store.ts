import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

interface UiStoreState {
  theme: ThemePreference;
  isMobileNavOpen: boolean;
  isFilterDrawerOpen: boolean;
}

interface UiStoreActions {
  setTheme: (theme: ThemePreference) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (isOpen: boolean) => void;
  setFilterDrawerOpen: (isOpen: boolean) => void;
  closeOverlays: () => void;
}

export type UiStore = UiStoreState & UiStoreActions;

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const createStorage = () => (typeof window === "undefined" ? noopStorage : window.localStorage);

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      theme: "system",
      isMobileNavOpen: false,
      isFilterDrawerOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
      setMobileNavOpen: (isOpen) => set({ isMobileNavOpen: isOpen }),
      setFilterDrawerOpen: (isOpen) => set({ isFilterDrawerOpen: isOpen }),
      closeOverlays: () =>
        set({
          isMobileNavOpen: false,
          isFilterDrawerOpen: false,
        }),
    }),
    {
      name: "ui-preferences",
      storage: createJSONStorage(createStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

export const resolveEffectiveTheme = (theme: ThemePreference, systemPrefersDark: boolean): "light" | "dark" => {
  if (theme === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return theme;
};
