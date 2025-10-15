import { test, expect } from "../../fixtures/auth.fixture";
import { FavoritesPage } from "../../pages/FavoritesPage";
import { PokemonDetailPage } from "../../pages/PokemonDetailPage";
import { addFavoriteViaAPI, clearAllFavoritesViaAPI } from "../../utils/favorites-helpers";

/**
 * Test Suite: US-003 Favorites - Add and Remove
 * TC-FAV-001: Dodanie pokemona do ulubionych
 * TC-FAV-002: Usunięcie pokemona z ulubionych
 */

test.describe("US-003: Ulubione Pokemony - Dodawanie i Usuwanie", () => {
  // Pikachu ID for consistent testing
  const PIKACHU_ID = 25;

  test.beforeEach(async ({ authenticatedPage }) => {
    // Ensure clean state - remove all favorites before each test
    await clearAllFavoritesViaAPI(authenticatedPage);
  });

  test("TC-FAV-001: should add pokemon to favorites when logged in", async ({ authenticatedPage }) => {
    // Arrange
    const detailPage = new PokemonDetailPage(authenticatedPage);
    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act - Navigate to pokemon detail page
    await detailPage.gotoByName("pikachu");

    // Assert - Pokemon should not be favorite initially
    await detailPage.expectIsNotFavorite(PIKACHU_ID);

    // Act - Add to favorites
    await detailPage.toggleFavorite(PIKACHU_ID);

    // Assert - Button state should change to "Usuń z ulubionych"
    await detailPage.expectIsFavorite(PIKACHU_ID);

    // Act - Navigate to favorites page
    await favoritesPage.goto();

    // Assert - Pokemon should appear in favorites list
    await favoritesPage.expectFavoriteExists(PIKACHU_ID);
    expect(await favoritesPage.getFavoritesCount()).toBe(1);
  });

  test("TC-FAV-002: should remove pokemon from favorites from detail page", async ({ authenticatedPage }) => {
    // Arrange - Add Pikachu to favorites first via API
    await addFavoriteViaAPI(authenticatedPage, PIKACHU_ID);

    const detailPage = new PokemonDetailPage(authenticatedPage);

    // Act - Navigate to pokemon detail page
    await detailPage.gotoByName("pikachu");

    // Assert - Pokemon should be marked as favorite
    await detailPage.expectIsFavorite(PIKACHU_ID);

    // Act - Remove from favorites
    await detailPage.toggleFavorite(PIKACHU_ID);

    // Assert - Button state should change to "Dodaj do ulubionych"
    await detailPage.expectIsNotFavorite(PIKACHU_ID);

    // Verify on favorites page
    const favoritesPage = new FavoritesPage(authenticatedPage);
    await favoritesPage.goto();

    // Assert - Empty state should be displayed
    await favoritesPage.expectEmptyState();
  });

  test("TC-FAV-002b: should remove pokemon from favorites list", async ({ authenticatedPage }) => {
    // Arrange - Add Pikachu to favorites
    await addFavoriteViaAPI(authenticatedPage, PIKACHU_ID);

    const favoritesPage = new FavoritesPage(authenticatedPage);

    // Act - Navigate to favorites page
    await favoritesPage.goto();

    // Assert - Pokemon should be in list
    await favoritesPage.expectFavoriteExists(PIKACHU_ID);

    // Act - Remove from favorites using remove button
    await favoritesPage.removeFavorite(PIKACHU_ID);

    // Assert - Pokemon should no longer be visible
    await favoritesPage.expectFavoriteNotExists(PIKACHU_ID);

    // Assert - Empty state should be displayed
    await favoritesPage.expectEmptyState();

    // Verify on detail page too
    const detailPage = new PokemonDetailPage(authenticatedPage);
    await detailPage.gotoByName("pikachu");
    await detailPage.expectIsNotFavorite(PIKACHU_ID);
  });

  test("TC-FAV-001b: should handle multiple add/remove cycles", async ({ authenticatedPage }) => {
    // Arrange
    const detailPage = new PokemonDetailPage(authenticatedPage);

    await detailPage.gotoByName("pikachu");

    // First cycle: add
    await detailPage.expectIsNotFavorite(PIKACHU_ID);
    await detailPage.toggleFavorite(PIKACHU_ID);
    await detailPage.expectIsFavorite(PIKACHU_ID);

    // Second cycle: remove
    await detailPage.toggleFavorite(PIKACHU_ID);
    await detailPage.expectIsNotFavorite(PIKACHU_ID);

    // Third cycle: add again
    await detailPage.toggleFavorite(PIKACHU_ID);
    await detailPage.expectIsFavorite(PIKACHU_ID);

    // Verify final state
    const favoritesPage = new FavoritesPage(authenticatedPage);
    await favoritesPage.goto();
    await favoritesPage.expectFavoriteExists(PIKACHU_ID);
  });
});
