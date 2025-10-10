import { expect, test } from "@playwright/test";

type PokemonListItem = {
  pokemonId: number;
  name: string;
  types: string[];
  generation: string;
  region: string;
  spriteUrl: string | null;
};

function buildList(items: PokemonListItem[]) {
  return {
    data: {
      items,
      page: 1,
      pageSize: 20,
      total: items.length,
      hasNext: false,
    },
    meta: {
      refreshedCount: 0,
      refreshedIds: [],
      cacheTtlMs: 60_000,
    },
    source: "ui-test",
  };
}

const fixtures = {
  default: buildList([
    {
      pokemonId: 1,
      name: "Bulbasaur",
      types: ["grass", "poison"],
      generation: "generation-i",
      region: "kanto",
      spriteUrl: "https://img.poketest/bulbasaur.png",
    },
    {
      pokemonId: 4,
      name: "Charmander",
      types: ["fire"],
      generation: "generation-i",
      region: "kanto",
      spriteUrl: "https://img.poketest/charmander.png",
    },
  ]),
  pikachu: buildList([
    {
      pokemonId: 25,
      name: "Pikachu",
      types: ["electric"],
      generation: "generation-i",
      region: "kanto",
      spriteUrl: "https://img.poketest/pikachu.png",
    },
  ]),
  johtoWater: buildList([
    {
      pokemonId: 158,
      name: "Totodile",
      types: ["water"],
      generation: "generation-ii",
      region: "johto",
      spriteUrl: "https://img.poketest/totodile.png",
    },
  ]),
  empty: buildList([]),
};

test.describe("Pokédex discovery flow", () => {
  test("użytkownik wyszukuje, filtruje i widzi stan pusty", async ({ page }) => {
    await page.route("**/api/pokemon/list**", async (route) => {
      const requestUrl = new URL(route.request().url());
      const search = (requestUrl.searchParams.get("search") ?? "").toLowerCase();
      const types = requestUrl.searchParams.getAll("type");
      const generation = requestUrl.searchParams.get("generation");
      const region = requestUrl.searchParams.get("region");

      const responseBody =
        search === "brak"
          ? fixtures.empty
          : search === "pikachu"
            ? fixtures.pikachu
            : generation === "generation-ii" || region === "johto" || types.includes("water")
              ? fixtures.johtoWater
              : fixtures.default;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });
    });

    await page.goto("/pokemon");

    await expect(page.getByRole("heading", { name: "Pokédex" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bulbasaur/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Charmander/i })).toBeVisible();

    const searchInput = page.getByPlaceholder("Szukaj pokemona po nazwie");

    await searchInput.fill("pikachu");
    await expect(page.getByRole("heading", { name: /Pikachu/i })).toBeVisible();

    await searchInput.fill("");
    await expect(page.getByRole("heading", { name: /Bulbasaur/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Pikachu/i })).not.toBeVisible();

    await page.getByRole("button", { name: /^water$/i }).click();
    await page.getByRole("button", { name: "Generacja II" }).click();
    await page.getByRole("button", { name: "Johto" }).click();
    await expect(page.getByRole("heading", { name: /Totodile/i })).toBeVisible();

    await searchInput.fill("brak");
    await expect(page.getByText("Brak wyników dla wybranych kryteriów wyszukiwania.")).toBeVisible();
    await expect(page.getByText(/Spróbuj zmienić filtry/i)).toBeVisible();
  });
});
