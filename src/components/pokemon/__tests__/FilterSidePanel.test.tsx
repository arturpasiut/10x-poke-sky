import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  POKEMON_GENERATION_OPTIONS,
  POKEMON_REGION_OPTIONS,
  POKEMON_TYPE_OPTIONS,
  MAX_SELECTED_TYPES,
} from "@/lib/pokemon/filters"

import { FilterSidePanel } from "../FilterSidePanel"

const baseFilters = {
  types: POKEMON_TYPE_OPTIONS.slice(0, 5),
  generations: POKEMON_GENERATION_OPTIONS.slice(0, 2),
  regions: POKEMON_REGION_OPTIONS.slice(0, 2),
}

describe("FilterSidePanel", () => {
  it("wywołuje akcje zmiany filtrów", async () => {
    const user = userEvent.setup()
    const toggleType = vi.fn()
    const setGeneration = vi.fn()
    const setRegion = vi.fn()
    const resetFilters = vi.fn()

    render(
      <FilterSidePanel
        filters={baseFilters}
        selectedTypes={[]}
        selectedGeneration={null}
        selectedRegion={null}
        onToggleType={toggleType}
        onSelectGeneration={setGeneration}
        onSelectRegion={setRegion}
        onResetFilters={resetFilters}
      />,
    )

    await user.click(screen.getByRole("button", { name: baseFilters.types[0]!.label }))

    const generationGroup = screen.getByRole("radiogroup", { name: /generacji/i })
    await user.click(within(generationGroup).getByRole("button", { name: "Wszystkie" }))

    const regionGroup = screen.getByRole("radiogroup", { name: /regionu/i })
    await user.click(within(regionGroup).getByRole("button", { name: baseFilters.regions[0]!.label }))
    await user.click(screen.getByRole("button", { name: /resetuj/i }))

    expect(toggleType).toHaveBeenCalledWith(baseFilters.types[0]!.value)
    expect(setGeneration).toHaveBeenCalledWith(null)
    expect(setRegion).toHaveBeenCalledWith(baseFilters.regions[0]!.value)
    expect(resetFilters).toHaveBeenCalled()
  })

  it("blokuje wybór kolejnych typów po osiągnięciu limitu", () => {
    const selectedTypes = baseFilters.types.slice(0, MAX_SELECTED_TYPES).map((option) => option.value)

    render(
      <FilterSidePanel
        filters={baseFilters}
        selectedTypes={selectedTypes}
        selectedGeneration={null}
        selectedRegion={null}
        onToggleType={vi.fn()}
        onSelectGeneration={vi.fn()}
        onSelectRegion={vi.fn()}
        onResetFilters={vi.fn()}
      />,
    )

    const nextTypeButton = screen.getByRole("button", { name: baseFilters.types[3]!.label })
    expect(nextTypeButton).toBeDisabled()
  })
})
