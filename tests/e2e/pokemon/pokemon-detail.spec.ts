import { expect, test } from "@playwright/test";

const detailFixture = {
  data: {
    summary: {
      pokemonId: 1,
      name: "bulbasaur",
      types: ["grass", "poison"],
      generation: "generation-i",
      region: "kanto",
      cachedAt: new Date().toISOString(),
    },
    pokemon: {
      stats: [
        { base_stat: 45, effort: 0, stat: { name: "hp" } },
        { base_stat: 49, effort: 0, stat: { name: "attack" } },
      ],
      height: 7,
      weight: 69,
      sprites: {
        other: {
          "official-artwork": { front_default: "https://img.test/bulbasaur.png" },
        },
      },
    },
    species: { id: 1, name: "bulbasaur" },
    evolutionChain: {
      id: 1,
      baby_trigger_item: null,
      chain: {
        is_baby: false,
        species: { name: "bulbasaur" },
        evolution_details: [],
        evolves_to: [
          {
            is_baby: false,
            species: { name: "ivysaur" },
            evolution_details: [{ trigger: { name: "level-up" }, min_level: 16 }],
            evolves_to: [],
          },
        ],
      },
    },
    moves: [
      {
        moveId: 1,
        name: "tackle",
        type: "normal",
        power: 40,
        accuracy: 100,
        pp: 35,
        generation: "generation-i",
        cachedAt: new Date().toISOString(),
      },
    ],
  },
};

const listFixture = {
  data: {
    items: [
      {
        pokemonId: 1,
        name: "Bulbasaur",
        types: ["grass", "poison"],
        generation: "generation-i",
        region: "kanto",
        spriteUrl: "https://img.test/bulbasaur.png",
      },
    ],
    page: 1,
    pageSize: 20,
    total: 1,
    hasNext: false,
  },
  meta: {
    refreshedCount: 0,
    refreshedIds: [],
    cacheTtlMs: 60000,
  },
};

test.describe("Pokédex detail flow", () => {
  test("użytkownik przechodzi z listy do szczegółów i wraca", async ({ page }) => {
    await page.route("**/api/pokemon/list**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(listFixture) })
    );

    await page.route("**/api/pokemon/details**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailFixture) })
    );

    await page.goto("/pokemon?q=bulba");

    await expect(page.getByText("Bulbasaur")).toBeVisible();
    await page.getByRole("link", { name: "Szczegóły" }).click();

    await expect(page).toHaveURL(/\/pokemon\/1/);
    await expect(page.getByRole("heading", { name: /Bulbasaur/i })).toBeVisible();
    await expect(page.getByText("Łańcuch ewolucji")).toBeVisible();
    await expect(page.getByText("Wybrane ruchy")).toBeVisible();

    await page.getByRole("link", { name: /Wróć do wyników/i }).click();
    await expect(page).toHaveURL(/\/pokemon\?q=bulba/);
  });
});
