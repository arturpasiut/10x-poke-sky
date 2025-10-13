import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PokemonEvolutionTimeline, flattenEvolutionChain } from "@/components/pokemon/evolution/PokemonEvolutionTimeline";

const mockChain = {
  is_baby: false,
  species: { name: "bulbasaur", url: "" },
  evolution_details: [],
  evolves_to: [
    {
      is_baby: false,
      species: { name: "ivysaur", url: "" },
      evolution_details: [
        {
          trigger: { name: "level-up", url: "" },
          min_level: 16,
        },
      ],
      evolves_to: [],
    },
  ],
};

describe("PokemonEvolutionTimeline", () => {
  it("flattenuje łańcuch z warunkami", () => {
    const steps = flattenEvolutionChain(mockChain);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toEqual({ species: "bulbasaur", triggers: [] });
    expect(steps[1].triggers).toContain("Poziom 16");
  });

  it("renderuje komunikat, gdy brak danych", () => {
    render(<PokemonEvolutionTimeline chain={null} />);
    expect(screen.getByText(/nie posiada zdefiniowanego łańcucha/i)).toBeInTheDocument();
  });

  it("renderuje elementy dla dostępnych ewolucji", () => {
    render(
      <PokemonEvolutionTimeline
        chain={{ id: 1, baby_trigger_item: null, chain: mockChain }}
      />
    );

    expect(screen.getByText(/bulbasaur/i)).toBeInTheDocument();
    expect(screen.getByText(/ivysaur/i)).toBeInTheDocument();
  });
});
