import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PokemonEvolutionTimeline } from "../PokemonEvolutionTimeline";
import type { EvolutionChain } from "@/lib/types/pokemon";

describe("PokemonEvolutionTimeline", () => {
  const mockSingleStageChain: EvolutionChain = {
    id: 1,
    chain: {
      species: { name: "pikachu", url: "" },
      evolution_details: [],
      evolves_to: [],
    },
  };

  const mockTwoStageChain: EvolutionChain = {
    id: 2,
    chain: {
      species: { name: "bulbasaur", url: "" },
      evolution_details: [],
      evolves_to: [
        {
          species: { name: "ivysaur", url: "" },
          evolution_details: [
            {
              min_level: 16,
              trigger: { name: "level-up", url: "" },
            },
          ],
          evolves_to: [
            {
              species: { name: "venusaur", url: "" },
              evolution_details: [
                {
                  min_level: 32,
                  trigger: { name: "level-up", url: "" },
                },
              ],
              evolves_to: [],
            },
          ],
        },
      ],
    },
  };

  const mockTradeEvolutionChain: EvolutionChain = {
    id: 3,
    chain: {
      species: { name: "kadabra", url: "" },
      evolution_details: [],
      evolves_to: [
        {
          species: { name: "alakazam", url: "" },
          evolution_details: [
            {
              trigger: { name: "trade", url: "" },
            },
          ],
          evolves_to: [],
        },
      ],
    },
  };

  // Rendering tests
  it("should render evolution chain with all species", () => {
    render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    expect(screen.getByText("bulbasaur")).toBeInTheDocument();
    expect(screen.getByText("ivysaur")).toBeInTheDocument();
    expect(screen.getByText("venusaur")).toBeInTheDocument();
  });

  it("should display level requirements", () => {
    render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    expect(screen.getByText("Poziom 16")).toBeInTheDocument();
    expect(screen.getByText("Poziom 32")).toBeInTheDocument();
  });

  it('should display "Forma startowa" for first pokemon', () => {
    render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    expect(screen.getByText("Forma startowa")).toBeInTheDocument();
  });

  it("should render single-stage evolution", () => {
    render(<PokemonEvolutionTimeline chain={mockSingleStageChain} />);

    expect(screen.getByText("pikachu")).toBeInTheDocument();
    expect(screen.getByText("Forma startowa")).toBeInTheDocument();
  });

  // Trigger types tests
  it("should display trade trigger", () => {
    render(<PokemonEvolutionTimeline chain={mockTradeEvolutionChain} />);

    expect(screen.getByText("kadabra")).toBeInTheDocument();
    expect(screen.getByText("alakazam")).toBeInTheDocument();
    expect(screen.getByText("trade")).toBeInTheDocument();
  });

  it("should format trigger names by replacing hyphens with spaces", () => {
    const chainWithFormattedTrigger: EvolutionChain = {
      id: 4,
      chain: {
        species: { name: "eevee", url: "" },
        evolution_details: [],
        evolves_to: [
          {
            species: { name: "espeon", url: "" },
            evolution_details: [
              {
                trigger: { name: "level-up", url: "" },
              },
            ],
            evolves_to: [],
          },
        ],
      },
    };

    render(<PokemonEvolutionTimeline chain={chainWithFormattedTrigger} />);

    expect(screen.getByText("level up")).toBeInTheDocument();
  });

  it('should show generic "Ewolucja" when trigger has no name', () => {
    const chainWithNoTrigger: EvolutionChain = {
      id: 5,
      chain: {
        species: { name: "pokemon1", url: "" },
        evolution_details: [],
        evolves_to: [
          {
            species: { name: "pokemon2", url: "" },
            evolution_details: [
              {
                trigger: null as any,
              },
            ],
            evolves_to: [],
          },
        ],
      },
    };

    render(<PokemonEvolutionTimeline chain={chainWithNoTrigger} />);

    expect(screen.getByText("Ewolucja")).toBeInTheDocument();
  });

  // Empty state tests
  it("should show empty state when chain is null", () => {
    render(<PokemonEvolutionTimeline chain={null} />);

    expect(screen.getByText("Ten Pokémon nie posiada zdefiniowanego łańcucha ewolucji.")).toBeInTheDocument();
  });

  it("should show empty state when chain.chain is missing", () => {
    const emptyChain = {
      id: 1,
      chain: null as any,
    };

    render(<PokemonEvolutionTimeline chain={emptyChain} />);

    expect(screen.getByText("Ten Pokémon nie posiada zdefiniowanego łańcucha ewolucji.")).toBeInTheDocument();
  });

  it("should render unknown species when species.name is null", () => {
    const invalidChain: EvolutionChain = {
      id: 1,
      chain: {
        species: null as any,
        evolution_details: [],
        evolves_to: [],
      },
    };

    render(<PokemonEvolutionTimeline chain={invalidChain} />);

    // Component renders "unknown" for null species instead of showing empty state
    expect(screen.getByText("unknown")).toBeInTheDocument();
    expect(screen.getByText("Forma startowa")).toBeInTheDocument();
  });

  // Structure tests
  it("should render as ordered list", () => {
    const { container } = render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    const list = container.querySelector("ol");
    expect(list).toBeInTheDocument();
  });

  it("should render list items for each evolution stage", () => {
    const { container } = render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(3); // bulbasaur, ivysaur, venusaur
  });

  // Capitalization test
  it("should capitalize species names", () => {
    render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    const bulbasaur = screen.getByText("bulbasaur");
    expect(bulbasaur).toHaveClass("capitalize");
  });

  // Complex evolution chains
  it("should handle branching evolutions (first branch only)", () => {
    const branchingChain: EvolutionChain = {
      id: 6,
      chain: {
        species: { name: "eevee", url: "" },
        evolution_details: [],
        evolves_to: [
          {
            species: { name: "vaporeon", url: "" },
            evolution_details: [
              {
                trigger: { name: "use-item", url: "" },
              },
            ],
            evolves_to: [],
          },
          {
            species: { name: "jolteon", url: "" },
            evolution_details: [
              {
                trigger: { name: "use-item", url: "" },
              },
            ],
            evolves_to: [],
          },
        ],
      },
    };

    render(<PokemonEvolutionTimeline chain={branchingChain} />);

    expect(screen.getByText("eevee")).toBeInTheDocument();
    expect(screen.getByText("vaporeon")).toBeInTheDocument();
    expect(screen.getByText("jolteon")).toBeInTheDocument();
  });

  // Horizontal scrolling
  it("should have horizontal scroll capability", () => {
    const { container } = render(<PokemonEvolutionTimeline chain={mockTwoStageChain} />);

    const list = container.querySelector("ol");
    expect(list).toHaveClass("overflow-x-auto");
  });

  // Edge case with missing evolution details
  it("should handle missing evolution_details array", () => {
    const chainWithNoDetails: EvolutionChain = {
      id: 7,
      chain: {
        species: { name: "pokemon1", url: "" },
        evolution_details: [],
        evolves_to: [
          {
            species: { name: "pokemon2", url: "" },
            evolution_details: null as any,
            evolves_to: [],
          },
        ],
      },
    };

    render(<PokemonEvolutionTimeline chain={chainWithNoDetails} />);

    expect(screen.getByText("pokemon1")).toBeInTheDocument();
    expect(screen.getByText("pokemon2")).toBeInTheDocument();
  });
});
