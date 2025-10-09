import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SearchHeader } from "../SearchHeader"

describe("SearchHeader", () => {
  it("wyświetla liczbę wyników i reaguje na wpisywanie tekstu", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <SearchHeader
        search=""
        total={150}
        onSearchChange={handleChange}
        onSubmit={vi.fn()}
        onReset={vi.fn()}
      />,
    )

    expect(screen.getByText("150 Pokémonów")).toBeInTheDocument()

    const input = screen.getByRole("searchbox", { name: /wyszukaj/i })
    await user.type(input, "pikachu")

    expect(handleChange).toHaveBeenCalled()
    expect(handleChange).toHaveBeenCalledTimes("pikachu".length)
  })

  it("wywołuje submit i reset przy odpowiednich akcjach", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    const handleReset = vi.fn()

    render(
      <SearchHeader
        search="mew"
        total={0}
        onSearchChange={vi.fn()}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />,
    )

    const submitButton = screen.getByRole("button", { name: /szukaj/i })
    await user.click(submitButton)
    expect(handleSubmit).toHaveBeenCalled()

    const resetButton = screen.getByRole("button", { name: /wyczyść/i })
    await user.click(resetButton)
    expect(handleReset).toHaveBeenCalled()
  })
})
