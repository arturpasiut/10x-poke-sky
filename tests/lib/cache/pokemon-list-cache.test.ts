import { describe, expect, it, beforeEach } from "vitest";

import { getCachedPokemonList, setCachedPokemonList } from "@/lib/cache/pokemon-list-cache";
import type { PokemonListResponseDto } from "@/types";

const samplePayload: PokemonListResponseDto = {
  items: [
    {
      pokemonId: 1,
      name: "bulbasaur",
      types: ["grass"],
      generation: "generation-i",
      region: "kanto",
      spriteUrl: "https://example.com/bulbasaur.png",
    },
  ],
  page: 1,
  pageSize: 20,
  total: 151,
  hasNext: true,
};

describe("pokemon list cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when cache empty", () => {
    expect(getCachedPokemonList(20, 0)).toBeNull();
  });

  it("stores and retrieves cached payload", () => {
    setCachedPokemonList(20, 0, samplePayload);
    const cached = getCachedPokemonList(20, 0, { ttlMs: 1000 });
    expect(cached?.data).toEqual(samplePayload);
    expect(cached?.metadata).toEqual({ limit: 20, offset: 0 });
  });

  it("respects ttl", () => {
    setCachedPokemonList(20, 0, samplePayload);
    const cached = getCachedPokemonList(20, 0, { ttlMs: -1 });
    expect(cached).toBeNull();
  });
});
