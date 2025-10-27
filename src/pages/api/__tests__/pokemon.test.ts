import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetPokemonIndexCache, filterCandidateIdsBySearch } from "../pokemon";

type FetchMock = ReturnType<typeof vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>>;

describe("filterCandidateIdsBySearch", () => {
  let originalFetch: typeof fetch | undefined;

  beforeEach(() => {
    originalFetch = global.fetch;
    __resetPokemonIndexCache();
  });

  afterEach(() => {
    __resetPokemonIndexCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  it("returns original candidates when search term is empty", async () => {
    const candidates = [1, 2, 3];
    const result = await filterCandidateIdsBySearch(candidates, "");
    expect(result).toEqual(candidates);
  });

  it("returns specific candidate when numeric identifier matches", async () => {
    const candidates = [25, 133, 150];
    const fetchSpy = createFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await filterCandidateIdsBySearch(candidates, "25");

    expect(result).toEqual([25]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not filter when prefix is shorter than minimum length", async () => {
    const candidates = [25, 172, 35];
    const fetchSpy = createFetchMock();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await filterCandidateIdsBySearch(candidates, "p");

    expect(result).toEqual(candidates);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns matching candidates for prefix search", async () => {
    const fetchSpy = createFetchMock([
      { id: 25, name: "pikachu" },
      { id: 26, name: "raichu" },
      { id: 172, name: "pichu" },
    ]);
    vi.stubGlobal("fetch", fetchSpy);

    const result = await filterCandidateIdsBySearch([25, 26, 172, 133], "pi");

    expect(result).toEqual([25, 172]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no names match prefix", async () => {
    const fetchSpy = createFetchMock([
      { id: 1, name: "bulbasaur" },
      { id: 4, name: "charmander" },
    ]);
    vi.stubGlobal("fetch", fetchSpy);

    const result = await filterCandidateIdsBySearch([1, 4, 7], "zy");

    expect(result).toEqual([]);
  });

  it("reuses cached index results on subsequent calls", async () => {
    const fetchSpy = createFetchMock([
      { id: 54, name: "psyduck" },
      { id: 55, name: "golduck" },
    ]);
    vi.stubGlobal("fetch", fetchSpy);

    const candidates = [54, 55, 108];

    const first = await filterCandidateIdsBySearch(candidates, "ps");
    const second = await filterCandidateIdsBySearch(candidates, "ps");

    expect(first).toEqual([54]);
    expect(second).toEqual([54]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

function createFetchMock(entries: { id: number; name: string }[] = []): FetchMock {
  const payload = {
    results: entries.map((entry) => ({
      name: entry.name,
      url: `https://pokeapi.co/api/v2/pokemon/${entry.id}/`,
    })),
  };

  return vi.fn(async () => {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
}
