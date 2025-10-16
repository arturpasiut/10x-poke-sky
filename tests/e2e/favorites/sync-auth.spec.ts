import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { FavoritesPage } from "../../pages/FavoritesPage";
import { PokemonDetailPage } from "../../pages/PokemonDetailPage";
import { TEST_CREDENTIALS } from "../../fixtures/auth.fixture";
import { addFavoriteViaAPI, clearAllFavoritesViaAPI } from "../../utils/favorites-helpers";

/**
 * Test Suite: US-003 Favorites - Authentication and Synchronization
 * TC-FAV-005: Dostęp do ulubionych bez logowania
 * TC-FAV-006: Synchronizacja ulubionych między sesjami
 */

test.describe("US-003: Ulubione Pokemony - Autentykacja i Synchronizacja", () => {
  const PIKACHU_ID = 25;

  test("TC-FAV-005: should require login to access favorites", async ({ page }) => {
    // Arrange
    const favoritesPage = new FavoritesPage(page);

    // Act - Try to access favorites without being logged in
    await favoritesPage.goto();

    // Assert - Should show error state (auth required)
    await favoritesPage.expectLoginRequired();

    // Assert - Error message should be visible
    await expect(favoritesPage.errorMessage).toBeVisible();

    // Assert - Login link should be present if it's an auth error
    const loginLinkCount = await favoritesPage.loginLink.count();
    if (loginLinkCount > 0) {
      // Assert - Login link should preserve redirect URL
      const loginUrl = await favoritesPage.loginLink.getAttribute("href");
      expect(loginUrl).toContain("redirectTo");
      expect(loginUrl).toContain("/favorites");
    } else {
      // If login link is not visible, at least error message should indicate auth issue
      const errorText = await favoritesPage.errorMessage.textContent();
      expect(errorText?.toLowerCase()).toMatch(/użytkownika|auth|zaloguj/);
    }
  });

  test("TC-FAV-005b: should redirect to login and back after authentication", async ({ page }) => {
    // Arrange
    const favoritesPage = new FavoritesPage(page);

    // Act - Navigate to favorites without auth
    await favoritesPage.goto();
    await favoritesPage.expectLoginRequired();

    // Check if login link exists before clicking
    const loginLinkCount = await favoritesPage.loginLink.count();

    if (loginLinkCount > 0) {
      // Click login link
      await favoritesPage.clickLoginLink();
    } else {
      // If no login link, navigate manually
      await page.goto("/auth/login?redirectTo=/favorites");
    }

    // Should be on login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Assert - Should redirect back to favorites after login
    await expect(page).toHaveURL("/favorites", { timeout: 10000 });
  });

  test("TC-FAV-006: should persist favorites across sessions", async ({ page, context }) => {
    // Arrange - Login and add favorite
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Clean existing favorites first
    await clearAllFavoritesViaAPI(page);

    // Add Pikachu to favorites
    const detailPage = new PokemonDetailPage(page);
    await detailPage.gotoByName("pikachu");
    await detailPage.toggleFavorite(PIKACHU_ID);
    await detailPage.expectIsFavorite(PIKACHU_ID);

    // Act - Simulate logout by clearing cookies and storage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Verify logged out state by trying to access favorites
    await page.goto("/favorites");
    await page.waitForLoadState("networkidle");
    // Should show error or empty state for non-authenticated user
    await expect(page.getByTestId("favorites-error-state")).toBeVisible({ timeout: 5000 });

    // Login again
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Assert - Favorite should still exist after re-login
    const favoritesPage = new FavoritesPage(page);
    await favoritesPage.goto();
    await favoritesPage.expectFavoriteExists(PIKACHU_ID);

    // Alternative verification: Check on detail page
    await detailPage.gotoByName("pikachu");
    await detailPage.expectIsFavorite(PIKACHU_ID);
  });

  test("TC-FAV-006b: should sync favorites immediately after login", async ({ page, context }) => {
    // Arrange - Add favorite via API while logged in
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Clear existing favorites first
    await clearAllFavoritesViaAPI(page);

    // Add favorite via API
    await addFavoriteViaAPI(page, PIKACHU_ID);

    // Simulate fresh login (clear cookies and re-login)
    await context.clearCookies();

    // Navigate to login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Act - Go to favorites immediately
    const favoritesPage = new FavoritesPage(page);
    await favoritesPage.goto();

    // Assert - Favorite should be visible immediately
    await favoritesPage.expectFavoriteExists(PIKACHU_ID);
  });

  test("TC-FAV-005c: should show login prompt on detail page when not authenticated", async ({ page }) => {
    // Arrange
    const detailPage = new PokemonDetailPage(page);

    // Act - Navigate to pokemon detail without auth
    await detailPage.gotoByName("pikachu");

    // Assert - Should show login prompt instead of toggle button
    await detailPage.expectFavoriteLoginPrompt(PIKACHU_ID);

    // Assert - Clicking should redirect to login
    const loginPrompt = detailPage.favoriteLoginPrompt(PIKACHU_ID);
    const href = await loginPrompt.getAttribute("href");
    expect(href).toContain("/auth/login");
    expect(href).toContain("redirectTo");
  });
});
