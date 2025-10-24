import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { EvolutionFavoriteGroupsPanel } from "../EvolutionFavoriteGroupsPanel";
import * as favoritesApi from "@/lib/favorites/api";
import * as evolutionApi from "@/lib/api/evolution-service";

vi.mock("@/lib/stores/use-session-store", () => ({
  useSessionStore: vi.fn().mockReturnValue({ status: "authenticated" }),
}));

vi.mock("@/lib/favorites/api", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchEvolutionFavoriteGroups: vi.fn().mockResolvedValue([
      {
        id: "grp-1",
        chainId: "sample",
        branchId: "main",
        pokemonIds: [1, 2],
        createdAt: new Date("2024-01-01T10:00:00Z").toISOString(),
      },
    ]),
    deleteEvolutionFavoriteGroup: vi.fn().mockResolvedValue(undefined),
  } satisfies Partial<typeof actual>;
});

vi.mock("@/lib/api/evolution-service", () => ({
  fetchEvolutionChainFromEdge: vi.fn().mockResolvedValue({
    data: {
      chainId: "sample",
      title: "Sample",
      leadPokemonId: 1,
      leadName: "sample",
      branches: [{ id: "main", label: "Główna" }],
      stages: [
        { pokemonId: 1, name: "pokemon-1" },
        { pokemonId: 2, name: "pokemon-2" },
      ],
    },
  }),
}));

describe("EvolutionFavoriteGroupsPanel", () => {
  const fetchGroupsSpy = favoritesApi.fetchEvolutionFavoriteGroups as ReturnType<typeof vi.fn>;
  const deleteGroupSpy = favoritesApi.deleteEvolutionFavoriteGroup as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchGroupsSpy.mockClear();
    deleteGroupSpy.mockClear();
  });

  it("renders a list of saved groups", async () => {
    render(<EvolutionFavoriteGroupsPanel initialIsAuthenticated assetPreference="gif" />);

    await waitFor(() => expect(fetchGroupsSpy).toHaveBeenCalled());

    expect(screen.getByText(/Twoje zapisane drużyny/i)).toBeInTheDocument();
    expect(screen.getByText(/Główna/i)).toBeInTheDocument();
    expect(screen.getByText(/pokemon-1/i)).toBeInTheDocument();
    expect(screen.getByText(/pokemon-2/i)).toBeInTheDocument();
  });

  it("handles delete action", async () => {
    render(<EvolutionFavoriteGroupsPanel initialIsAuthenticated assetPreference="gif" />);

    await waitFor(() => expect(fetchGroupsSpy).toHaveBeenCalled());

    const deleteButton = await screen.findByRole("button", { name: /Usuń/i });
    fireEvent.click(deleteButton);

    await waitFor(() => expect(deleteGroupSpy).toHaveBeenCalledWith("sample", "main"));
  });

  it("shows error when delete fails", async () => {
    deleteGroupSpy.mockRejectedValueOnce(new favoritesApi.FavoritesApiError("Nie udało się", { code: 500 }));

    render(<EvolutionFavoriteGroupsPanel initialIsAuthenticated assetPreference="gif" />);

    await waitFor(() => expect(fetchGroupsSpy).toHaveBeenCalled());

    const deleteButton = await screen.findByRole("button", { name: /Usuń/i });
    fireEvent.click(deleteButton);

    await waitFor(() => expect(screen.getByText(/Nie udało się/i)).toBeInTheDocument());
  });
});
