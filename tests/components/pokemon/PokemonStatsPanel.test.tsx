import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PokemonStatsPanel } from "@/components/pokemon/PokemonStatsPanel";

describe("PokemonStatsPanel", () => {
  it("wyświetla komunikat, gdy brak danych", () => {
    render(<PokemonStatsPanel stats={[]} />);

    expect(screen.getByText(/brak danych/i)).toBeInTheDocument();
  });

  it("renderuje paski dla przekazanych statystyk i normalizuje szerokości", () => {
    const { getByTestId } = render(
      <PokemonStatsPanel
        stats={[
          { base_stat: 45, effort: 0, stat: { name: "hp", url: "" } },
          { base_stat: 90, effort: 0, stat: { name: "attack", url: "" } },
        ]}
      />
    );

    const hpBar = getByTestId("stat-bar-hp");
    const attackBar = getByTestId("stat-bar-attack");

    expect(screen.getByLabelText(/HP 45/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Atak 90/)).toBeInTheDocument();
    expect(parseInt(hpBar.style.width, 10)).toBeLessThan(parseInt(attackBar.style.width, 10));
  });
});
