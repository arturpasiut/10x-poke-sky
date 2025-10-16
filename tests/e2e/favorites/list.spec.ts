import { test, expect } from "../../fixtures/auth.fixture";
import { FavoritesPage } from "../../pages/FavoritesPage";
import { addMultipleFavoritesViaAPI, clearAllFavoritesViaAPI } from "../../utils/favorites-helpers";

/**
 * Test Suite: US-003 Favorites - List Display
 * TC-FAV-003: Wyświetlenie listy ulubionych
 * TC-FAV-004: Pusta lista ulubionych
 */

test.describe("US-003: Ulubione Pokemony - Lista", () => {
  // Common Pokemon IDs for testing
  const PIKACHU_ID = 25;
  const CHARIZARD_ID = 6;
  const MEWTWO_ID = 150;

  test.beforeEach(async ({ authenticatedPage }) => {
    // Clean slate before each test
    await clearAllFavoritesViaAPI(authenticatedPage);
  });

  test("TC-FAV-003: should display favorites list with multiple pokemon", async ({ authenticatedPage }) => {
    // Arrange - Clear first, then add 3 favorites via API
    await clearAllFavoritesViaAPI(authenticatedPage);
    const favoriteIds = [PIKACHU_ID, CHARIZARD_ID, MEWTWO_ID];
    await addMultipleFavoritesViaAPI(authenticatedPage, favoriteIds);

    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act - Navigate to favorites page
    await favoritesPage.goto();

    // Assert - Grid should be visible
    await favoritesPage.expectFavoritesGridVisible();

    // Assert - All 3 pokemon should be displayed
    expect(await favoritesPage.getFavoritesCount()).toBe(3);

    // Assert - Each pokemon should be visible
    for (const id of favoriteIds) {
      await favoritesPage.expectFavoriteExists(id);
    }

    // Assert - Each card should have remove button
    for (const id of favoriteIds) {
      await expect(favoritesPage.getRemoveButton(id)).toBeVisible();
    }
  });

  test("TC-FAV-004: should display empty state when no favorites", async ({ authenticatedPage }) => {
    // Arrange - Use regular authenticated page and clear favorites
    await clearAllFavoritesViaAPI(authenticatedPage);

    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act - Navigate to favorites page
    await favoritesPage.goto();

    // Assert - Empty state should be displayed
    await favoritesPage.expectEmptyState();

    // Assert - Empty message should be visible
    await expect(favoritesPage.emptyStateMessage).toContainText(/dodaj pokémony do ulubionych/i);

    // Assert - Browse link should be visible and functional
    await expect(favoritesPage.browseLink).toBeVisible();
    expect(await favoritesPage.browseLink.getAttribute("href")).toBe("/pokemon");

    // Assert - AI link should be visible and functional
    await expect(favoritesPage.aiLink).toBeVisible();
    expect(await favoritesPage.aiLink.getAttribute("href")).toBe("/ai");
  });

  test("TC-FAV-004b: should navigate to Pokedex from empty state", async ({ authenticatedPage }) => {
    // Arrange - Ensure no favorites
    await clearAllFavoritesViaAPI(authenticatedPage);
    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act
    await favoritesPage.goto();
    await favoritesPage.expectEmptyState();

    // Click "Przejdź do Pokédexu"
    await favoritesPage.clickBrowseLink();

    // Assert - Should navigate to pokemon list
    await expect(authenticatedPage).toHaveURL("/pokemon");
  });

  test("TC-FAV-004c: should navigate to AI from empty state", async ({ authenticatedPage }) => {
    // Arrange - Ensure no favorites
    await clearAllFavoritesViaAPI(authenticatedPage);
    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act
    await favoritesPage.goto();
    await favoritesPage.expectEmptyState();

    // Click "Zaproś asystenta AI"
    await favoritesPage.clickAILink();

    // Assert - Should navigate to AI chat
    await expect(authenticatedPage).toHaveURL("/ai");
  });

  test("TC-FAV-003b: should display single favorite correctly", async ({ authenticatedPage }) => {
    // Arrange - Clear first, then add only one favorite
    await clearAllFavoritesViaAPI(authenticatedPage);
    await addMultipleFavoritesViaAPI(authenticatedPage, [PIKACHU_ID]);

    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act
    await favoritesPage.goto();

    // Assert
    expect(await favoritesPage.getFavoritesCount()).toBe(1);
    await favoritesPage.expectFavoriteExists(PIKACHU_ID);
    await favoritesPage.expectFavoritesGridVisible();
  });

  test("TC-FAV-003c: should display many favorites correctly", async ({ authenticatedPage }) => {
    // Arrange - Clear first, then add 6 favorites to test grid layout
    await clearAllFavoritesViaAPI(authenticatedPage);
    const manyFavorites = [1, 4, 7, 25, 150, 6]; // Bulbasaur, Charmander, Squirtle, Pikachu, Mewtwo, Charizard
    await addMultipleFavoritesViaAPI(authenticatedPage, manyFavorites);

    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act
    await favoritesPage.goto();

    // Assert
    expect(await favoritesPage.getFavoritesCount()).toBe(6);

    // Verify all are visible
    for (const id of manyFavorites) {
      await favoritesPage.expectFavoriteExists(id);
    }
  });
});
