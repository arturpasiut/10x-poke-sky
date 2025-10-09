import { render, screen } from "@testing-library/react"

import type { PokemonSummaryViewModel } from "@/lib/pokemon/types"

import { PokemonGrid } from "../PokemonGrid"

const createPokemon = (overrides: Partial<PokemonSummaryViewModel> = {}): PokemonSummaryViewModel => ({
  pokemonId: 1,
  name: "bulbasaur",
  types: ["grass"],
  generation: "generation-i",
  region: "kanto",
  spriteUrl: null,
  highlights: [],
  displayName: "Bulbasaur",
  dexNumber: "#001",
  spriteAlt: "Bulbasaur sprite niedostępny",
  routeHref: "/pokemon/bulbasaur",
  cardGradientClass: "bg-gradient-to-br from-emerald-500 to-emerald-700",
  typeBadges: [
    { value: "grass", label: "Grass", className: "bg-green-500 text-white" },
  ],
  ...overrides,
})

describe("PokemonGrid", () => {
  it("renderuje listę kart Pokémonów oraz ustawia aria-busy", () => {
    const pokemons = [
      createPokemon(),
      createPokemon({
        pokemonId: 4,
        name: "charmander",
        displayName: "Charmander",
        dexNumber: "#004",
        routeHref: "/pokemon/charmander",
      }),
    ]

    render(<PokemonGrid items={pokemons} aria-busy />)

    expect(screen.getByRole("feed")).toHaveAttribute("aria-busy", "true")

    expect(screen.getByRole("link", { name: /Bulbasaur/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Charmander/i })).toBeInTheDocument()
  })
})
