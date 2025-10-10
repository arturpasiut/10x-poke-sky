import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PokemonFilters } from "@/components/pokemon/PokemonFilters";

const defaultProps = () => ({
  selectedTypes: [],
  onToggleType: vi.fn(),
  selectedGeneration: "",
  onSelectGeneration: vi.fn(),
  selectedRegion: "",
  onSelectRegion: vi.fn(),
  onReset: vi.fn(),
});

describe("PokemonFilters", () => {
  it("pozwala przełączać typy, gdy limit nie został osiągnięty", () => {
    const props = defaultProps();
    render(<PokemonFilters {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /fire/i }));

    expect(props.onToggleType).toHaveBeenCalledTimes(1);
    expect(props.onToggleType).toHaveBeenCalledWith("fire");
  });

  it("blokuje wybór kolejnego typu po przekroczeniu limitu trzech", () => {
    const props = defaultProps();
    props.selectedTypes = ["fire", "water", "grass"];
    render(<PokemonFilters {...props} />);

    const target = screen.getByRole("button", { name: /electric/i });
    expect(target).toBeDisabled();
  });

  it("przekazuje wybór generacji i regionu do rodzica", () => {
    const props = defaultProps();
    render(<PokemonFilters {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Generacja II" }));
    fireEvent.click(screen.getByRole("button", { name: "Johto" }));

    expect(props.onSelectGeneration).toHaveBeenCalledWith("generation-ii");
    expect(props.onSelectRegion).toHaveBeenCalledWith("johto");
  });

  it("pozwala zresetować wszystkie filtry", () => {
    const props = defaultProps();
    render(<PokemonFilters {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Resetuj" }));
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });
});
