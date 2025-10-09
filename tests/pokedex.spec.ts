import { test, expect } from "@playwright/test"

test.describe("Widok Pokédex", () => {
  test("wyświetla nagłówek i wyszukiwarkę", async ({ page }) => {
    await page.goto("/pokemon")

    await expect(page.getByRole("heading", { name: "Pokédex" })).toBeVisible()
    await expect(page.getByRole("searchbox", { name: /wyszukaj/i })).toBeVisible()
  })
})
