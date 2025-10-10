import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PokemonCard } from "@/components/pokemon/PokemonCard";

describe("PokemonCard", () => {
  it("renderuje podstawowe informacje o pokemonie", () => {
    render(
      <PokemonCard
        pokemon={{
          pokemonId: 25,
          name: "pikachu",
          types: ["electric"],
          generation: "generation-i",
          region: "kanto",
          spriteUrl: "https://example.com/pikachu.png",
          highlights: ["ulubiony starter"],
        }}
      />
    );

    expect(screen.getByRole("heading", { level: 3, name: /pikachu/i })).toBeInTheDocument();
    expect(screen.getByText("#025")).toBeInTheDocument();
    expect(screen.getByText("Kanto")).toBeInTheDocument();
    expect(screen.getByText(/Generacja\s+I/)).toBeInTheDocument();
    expect(screen.getByText("Electric")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Szczegóły" });
    expect(link.getAttribute("href")).toBe("/pokemon/25");

    const image = screen.getByRole("img", { name: /pikachu/i });
    expect(image).toHaveAttribute("src", "https://example.com/pikachu.png");
  });
});
