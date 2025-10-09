import { act, renderHook, waitFor } from "@testing-library/react"

import type { PokemonListResponseDto } from "@/types"
import { DEFAULT_QUERY_STATE } from "@/lib/pokemon/query"

import { usePokemonListQuery } from "../usePokemonListQuery"

const sampleResponse: PokemonListResponseDto = {
  items: [
    {
      pokemonId: 25,
      name: "pikachu",
      types: ["electric"],
      generation: "generation-i",
      region: "kanto",
      spriteUrl: "https://example.com/pikachu.png",
      highlights: [],
    },
  ],
  page: 1,
  pageSize: 24,
  total: 1,
  hasNext: false,
}

describe("usePokemonListQuery", () => {
  it("zwraca wyniki i mapuje je do widoku", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    })

    const { result } = renderHook(() => usePokemonListQuery(DEFAULT_QUERY_STATE, { fetcher }))

    await waitFor(() => expect(result.current.status).toBe("success"))

    expect(fetcher).toHaveBeenCalled()
    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.pagination.total).toBe(1)
    expect(result.current.data?.items[0]?.displayName).toBe("Pikachu")
  })

  it("obsługuje błąd 429 i ustawia retry", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: "Za dużo zapytań", retryAfterMs: 1000 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleResponse,
      })

    const { result } = renderHook(() => usePokemonListQuery(DEFAULT_QUERY_STATE, { fetcher }))

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error?.code).toBe(429)

    await act(async () => {
      result.current.retry()
    })

    await waitFor(() => expect(result.current.status).toBe("success"))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("zwraca błąd sieci przy wyjątku fetch", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Network error"))

    const { result } = renderHook(() => usePokemonListQuery(DEFAULT_QUERY_STATE, { fetcher }))

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error?.message).toMatch(/Nie udało się/i)
  })
})
