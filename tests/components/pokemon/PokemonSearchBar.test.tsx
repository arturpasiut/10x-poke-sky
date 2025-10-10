import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PokemonSearchBar } from "@/components/pokemon/PokemonSearchBar";

describe("PokemonSearchBar", () => {
  it("wyświetla kontrolkę wyszukiwania z przekazaną wartością", () => {
    render(<PokemonSearchBar value="pikachu" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Szukaj pokemona po nazwie");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("pikachu");
    expect(input).toHaveAttribute("type", "search");
  });

  it("informuje rodzica o zmianie wartości", () => {
    const handleChange = vi.fn();
    render(<PokemonSearchBar value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText("Szukaj pokemona po nazwie");
    fireEvent.change(input, { target: { value: "bulbasaur" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("bulbasaur");
  });
});
