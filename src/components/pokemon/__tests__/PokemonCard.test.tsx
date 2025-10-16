import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PokemonCard } from "../PokemonCard";
import type { PokemonSummaryViewModel } from "@/lib/pokemon/types";

describe("PokemonCard", () => {
  const mockPokemon: PokemonSummaryViewModel = {
    id: 25,
    name: "pikachu",
    displayName: "Pikachu",
    dexNumber: "#025",
    spriteUrl: "https://example.com/pikachu.png",
    spriteAlt: "Pikachu sprite",
    routeHref: "/pokemon/pikachu",
    cardGradientClass: "bg-gradient-electric",
    typeBadges: [
      {
        value: "electric",
        label: "Electric",
        className: "bg-pokemon-electric/20 text-pokemon-electric",
      },
    ],
  };

  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = { search: "" };
  });

  // Rendering tests
  it("should render pokemon card with all data", () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("#025")).toBeInTheDocument();
    expect(screen.getByText("Electric")).toBeInTheDocument();
    expect(screen.getByAltText("Pikachu sprite")).toBeInTheDocument();
  });

  it("should render correct link href", () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pokemon/pikachu");
  });

  it("should preserve search params in link href", () => {
    (window as any).location.search = "?page=2&type=electric";

    render(<PokemonCard pokemon={mockPokemon} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pokemon/pikachu?page=2&type=electric");
  });

  it("should render pokemon sprite image", () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    const image = screen.getByAltText("Pikachu sprite");
    expect(image).toHaveAttribute("src", "https://example.com/pikachu.png");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("should render fallback sprite when spriteUrl is null", () => {
    const pokemonWithoutSprite = {
      ...mockPokemon,
      spriteUrl: null,
    };

    render(<PokemonCard pokemon={pokemonWithoutSprite} />);

    const image = screen.getByAltText("Pikachu sprite");
    expect(image).toHaveAttribute("src");
    expect(image.getAttribute("src")).toContain("data:image/svg");
  });

  // Type badges tests
  it("should render single type badge", () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    expect(screen.getByText("Electric")).toBeInTheDocument();
    expect(screen.getByText("Electric")).toHaveClass("bg-pokemon-electric/20", "text-pokemon-electric");
  });

  it("should render multiple type badges", () => {
    const dualTypePokemon = {
      ...mockPokemon,
      typeBadges: [
        {
          value: "water",
          label: "Water",
          className: "bg-pokemon-water/20 text-pokemon-water",
        },
        {
          value: "flying",
          label: "Flying",
          className: "bg-pokemon-flying/20 text-pokemon-flying",
        },
      ],
    };

    render(<PokemonCard pokemon={dualTypePokemon} />);

    expect(screen.getByText("Water")).toBeInTheDocument();
    expect(screen.getByText("Flying")).toBeInTheDocument();
  });

  // Accessibility tests
  it("should have proper aria-label", () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "Pikachu #025");
  });

  it("should render as article element", () => {
    const { container } = render(<PokemonCard pokemon={mockPokemon} />);

    const article = container.querySelector("article");
    expect(article).toBeInTheDocument();
  });

  // Styling tests
  it("should apply gradient class", () => {
    const { container } = render(<PokemonCard pokemon={mockPokemon} />);

    const article = container.querySelector("article");
    expect(article).toHaveClass("bg-gradient-electric");
  });

  it("should have hover and focus styles", () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("hover:-translate-y-1", "focus-visible:-translate-y-1");
  });

  // CTA text test
  it('should display "Zobacz szczegóły" text', () => {
    render(<PokemonCard pokemon={mockPokemon} />);

    expect(screen.getByText("Zobacz szczegóły →")).toBeInTheDocument();
  });

  // Different pokemon data tests
  it("should render different pokemon correctly", () => {
    const charizard: PokemonSummaryViewModel = {
      id: 6,
      name: "charizard",
      displayName: "Charizard",
      dexNumber: "#006",
      spriteUrl: "https://example.com/charizard.png",
      spriteAlt: "Charizard sprite",
      routeHref: "/pokemon/charizard",
      cardGradientClass: "bg-gradient-fire",
      typeBadges: [
        {
          value: "fire",
          label: "Fire",
          className: "bg-pokemon-fire/20 text-pokemon-fire",
        },
        {
          value: "flying",
          label: "Flying",
          className: "bg-pokemon-flying/20 text-pokemon-flying",
        },
      ],
    };

    render(<PokemonCard pokemon={charizard} />);

    expect(screen.getByText("Charizard")).toBeInTheDocument();
    expect(screen.getByText("#006")).toBeInTheDocument();
    expect(screen.getByText("Fire")).toBeInTheDocument();
    expect(screen.getByText("Flying")).toBeInTheDocument();
  });
});
