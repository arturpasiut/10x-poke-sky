import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { EvolutionTimelineContainer } from "../EvolutionTimelineContainer";
import type { EvolutionChainDto } from "@/lib/evolution/types";
import * as favoritesApi from "@/lib/favorites/api";
import { useEvolutionStore } from "@/stores/useEvolutionStore";

vi.mock("@/lib/favorites/api", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    saveEvolutionFavoriteGroup: vi.fn().mockResolvedValue({}),
  } satisfies Partial<typeof actual>;
});

const useSessionStoreMock = vi.fn();
vi.mock("@/lib/stores/use-session-store", () => ({
  useSessionStore: (...args: unknown[]) => useSessionStoreMock(...args),
}));

useSessionStoreMock.mockReturnValue({ status: "authenticated" });

const sampleChain: EvolutionChainDto = {
  chainId: "sample",
  title: "Sample chain",
  leadPokemonId: 1,
  leadName: "sample",
  summary: "Test chain",
  branches: [{ id: "main", label: "Główna" }],
  stages: [
    {
      stageId: "stage-1",
      order: 1,
      pokemonId: 1,
      slug: "stage-1",
      name: "stage-1",
      types: [],
      description: null,
      branchIds: ["main"],
      asset: { gif: null, sprite: null, officialArtwork: null, fallback: null },
      requirements: [{ id: "req", summary: "Forma startowa" }],
      stats: [],
      statsDiff: null,
      generation: null,
    },
    {
      stageId: "stage-2",
      order: 2,
      pokemonId: 2,
      slug: "stage-2",
      name: "stage-2",
      types: [],
      description: null,
      branchIds: ["main"],
      asset: { gif: null, sprite: null, officialArtwork: null, fallback: null },
      requirements: [{ id: "req2", summary: "Poziom 16" }],
      stats: [],
      statsDiff: null,
      generation: null,
    },
  ],
};

describe("EvolutionTimelineContainer", () => {
  const saveSpy = favoritesApi.saveEvolutionFavoriteGroup as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveSpy.mockClear();
    useEvolutionStore.setState({
      selectedChainId: null,
      selectedBranchId: null,
      displayMode: "list",
      assetPreference: "gif",
      focusedPokemonId: null,
      showStatDiffs: false,
      isHydrated: true,
    });
  });

  it("calls saveEvolutionFavoriteGroup when user saves team", async () => {
    render(<EvolutionTimelineContainer chain={sampleChain} initialIsAuthenticated assetPreference="gif" />);

    const button = screen.getByRole("button", { name: /Zapisz drużynę/i });
    fireEvent.click(button);

    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1));
    expect(saveSpy).toHaveBeenCalledWith({ chainId: "sample", branchId: null, pokemonIds: [1, 2] });
    expect(screen.getByText(/Drużyna zapisana w ulubionych/i)).toBeInTheDocument();
  });

  it("shows error message when saving fails", async () => {
    saveSpy.mockRejectedValueOnce(new favoritesApi.FavoritesApiError("Nie udało się", { code: 500 }));

    render(<EvolutionTimelineContainer chain={sampleChain} initialIsAuthenticated assetPreference="gif" />);

    fireEvent.click(screen.getByRole("button", { name: /Zapisz drużynę/i }));

    await waitFor(() => expect(screen.getByText(/Nie udało się/i)).toBeInTheDocument());
  });

  it("redirects to login when user is not authenticated", () => {
    const originalLocation = window.location.href;
    Object.defineProperty(window, "location", {
      value: { href: originalLocation },
      writable: true,
    });

    useSessionStoreMock.mockReturnValueOnce({ status: "unauthenticated" });
    render(<EvolutionTimelineContainer chain={sampleChain} assetPreference="gif" />);

    fireEvent.click(screen.getByRole("button", { name: /Zapisz drużynę/i }));

    expect(window.location.href).toContain("/auth/login");
  });
});
