import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { PokemonEvolutionTimeline } from "../PokemonEvolutionTimeline";
import type { EvolutionChainDto, EvolutionStageDto, EvolutionRequirementDto } from "@/lib/evolution/types";
import { useEvolutionStore } from "@/stores/useEvolutionStore";

const createStage = (overrides: Partial<EvolutionStageDto> & Pick<EvolutionStageDto, "pokemonId" | "name">) => {
  const requirements: EvolutionRequirementDto[] =
    overrides.requirements ?? [{ id: `req-${overrides.pokemonId}`, summary: "Forma startowa" }];

  return {
    stageId: overrides.stageId ?? `stage-${overrides.pokemonId}`,
    order: overrides.order ?? 1,
    pokemonId: overrides.pokemonId,
    slug: overrides.slug ?? overrides.name,
    name: overrides.name,
    types: overrides.types ?? [],
    description: overrides.description ?? null,
    branchIds: overrides.branchIds ?? ["main"],
    asset: overrides.asset ?? { gif: null, sprite: null, officialArtwork: null, fallback: null },
    requirements,
    stats: overrides.stats ?? [],
    statsDiff: overrides.statsDiff ?? null,
    accentColor: overrides.accentColor,
    generation: overrides.generation ?? null,
  } satisfies EvolutionStageDto;
};

const multiStageChain: EvolutionChainDto = {
  chainId: "two-stage",
  title: "Bulbasaur – łańcuch",
  leadPokemonId: 1,
  leadName: "bulbasaur",
  summary: "Testowy łańcuch dwóch etapów.",
  branches: [{ id: "main", label: "Główna" }],
  stages: [
    createStage({ pokemonId: 1, name: "bulbasaur", order: 1 }),
    createStage({
      pokemonId: 2,
      name: "ivysaur",
      order: 2,
      requirements: [{ id: "lvl-16", summary: "Poziom 16" }],
    }),
    createStage({
      pokemonId: 3,
      name: "venusaur",
      order: 3,
      requirements: [{ id: "lvl-32", summary: "Poziom 32" }],
    }),
  ],
};

const singleStageChain: EvolutionChainDto = {
  chainId: "single",
  title: "Pikachu – łańcuch",
  leadPokemonId: 25,
  leadName: "pikachu",
  branches: [{ id: "main", label: "Główna" }],
  stages: [
    createStage({
      pokemonId: 25,
      name: "pikachu",
      order: 1,
      requirements: [{ id: "start", summary: "Forma startowa" }],
    }),
  ],
};

const branchingChain: EvolutionChainDto = {
  chainId: "eevee",
  title: "Eevee – łańcuch",
  leadPokemonId: 133,
  leadName: "eevee",
  branches: [
    { id: "water", label: "Ścieżka wodna" },
    { id: "electric", label: "Ścieżka elektryczna" },
  ],
  stages: [
    createStage({ pokemonId: 133, name: "eevee", order: 1, branchIds: ["water", "electric"] }),
    createStage({
      pokemonId: 134,
      name: "vaporeon",
      order: 2,
      branchIds: ["water"],
      requirements: [{ id: "water-stone", summary: "Kamień Wodny" }],
    }),
    createStage({
      pokemonId: 135,
      name: "jolteon",
      order: 2,
      branchIds: ["electric"],
      requirements: [{ id: "thunder-stone", summary: "Kamień Błysk" }],
    }),
  ],
};

describe("PokemonEvolutionTimeline (EvolutionChainDto)", () => {
  beforeEach(() => {
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

  afterEach(() => {
    cleanup();
  });

  it("renders all stages for a multi-stage chain", () => {
    render(<PokemonEvolutionTimeline chain={multiStageChain} displayMode="list" assetPreference="gif" />);

    expect(screen.getByText("Bulbasaur – łańcuch")).toBeInTheDocument();
    expect(screen.getByText("bulbasaur")).toBeInTheDocument();
    expect(screen.getByText("ivysaur")).toBeInTheDocument();
    expect(screen.getByText("venusaur")).toBeInTheDocument();
    expect(screen.getByText("Poziom 16")).toBeInTheDocument();
    expect(screen.getByText("Poziom 32")).toBeInTheDocument();
  });

  it("renders Forma startowa for the first stage", () => {
    render(<PokemonEvolutionTimeline chain={multiStageChain} displayMode="list" assetPreference="gif" />);

    expect(screen.getByText("Forma startowa")).toBeInTheDocument();
  });

  it("renders single-stage chain", () => {
    render(<PokemonEvolutionTimeline chain={singleStageChain} displayMode="list" assetPreference="gif" />);

    expect(screen.getByText("pikachu")).toBeInTheDocument();
    expect(screen.getByText("Forma startowa")).toBeInTheDocument();
  });

  it("filters stages when a branch is selected", () => {
    render(<PokemonEvolutionTimeline chain={branchingChain} displayMode="list" assetPreference="gif" />);

    act(() => {
      useEvolutionStore.getState().setSelectedBranchId("water");
    });

    expect(screen.getByText("eevee")).toBeInTheDocument();
    expect(screen.getByText("vaporeon")).toBeInTheDocument();
    expect(screen.queryByText("jolteon")).not.toBeInTheDocument();
  });

  it("shows empty state when chain is null", () => {
    render(<PokemonEvolutionTimeline chain={null} displayMode="list" assetPreference="gif" />);

    expect(screen.getByText("Ten Pokémon nie posiada zdefiniowanego łańcucha ewolucji.")).toBeInTheDocument();
  });

  it("shows empty state when chain has no stages", () => {
    const emptyChain: EvolutionChainDto = {
      chainId: "empty",
      title: "Empty",
      leadPokemonId: 0,
      leadName: "empty",
      branches: [],
      stages: [],
    };

    render(<PokemonEvolutionTimeline chain={emptyChain} displayMode="list" assetPreference="gif" />);

    expect(screen.getByText("Nie znaleziono etapów ewolucji dla wybranych filtrów.")).toBeInTheDocument();
  });
});
