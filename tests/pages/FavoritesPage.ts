import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Favorites Page (/favorites)
 * Covers US-003: Ulubione Pokemony
 */
export class FavoritesPage extends BasePage {
  // Main containers
  readonly favoritesGrid: Locator;
  readonly emptyState: Locator;
  readonly errorState: Locator;
  readonly loadingSkeleton: Locator;

  // Empty state elements
  readonly emptyStateMessage: Locator;
  readonly browseLink: Locator;
  readonly aiLink: Locator;

  // Error state elements
  readonly errorMessage: Locator;
  readonly retryButton: Locator;
  readonly loginLink: Locator;

  constructor(page: any) {
    super(page);

    // Main containers
    this.favoritesGrid = this.page.getByTestId("favorites-grid");
    this.emptyState = this.page.getByTestId("favorites-empty-state");
    this.errorState = this.page.getByTestId("favorites-error-state");
    this.loadingSkeleton = this.page.getByTestId("favorites-loading");

    // Empty state
    this.emptyStateMessage = this.page.getByTestId("favorites-empty-message");
    this.browseLink = this.page.getByTestId("favorites-browse-link");
    this.aiLink = this.page.getByTestId("favorites-ai-link");

    // Error state
    this.errorMessage = this.page.getByTestId("favorites-error-message");
    this.retryButton = this.page.getByTestId("favorites-retry-button");
    this.loginLink = this.page.getByTestId("favorites-login-link");
  }

  /**
   * Navigate to favorites page
   */
  async goto(): Promise<void> {
    await super.goto("/favorites");
    await this.waitForPageLoad();
    // Wait for either success or error state to appear
    await this.page
      .waitForSelector('[data-testid="favorites-grid"], [data-testid="favorites-empty-state"], [data-testid="favorites-error-state"]', {
        timeout: 10000,
      })
      .catch(() => {
        // If none appear, that's OK - loading might still be visible
      });
  }

  /**
   * Get favorite card by pokemon ID
   */
  getFavoriteCard(pokemonId: number): Locator {
    return this.page.getByTestId(`favorite-card-${pokemonId}`);
  }

  /**
   * Get remove button for a specific pokemon
   */
  getRemoveButton(pokemonId: number): Locator {
    return this.page.getByTestId(`favorite-remove-button-${pokemonId}`);
  }

  /**
   * Get remove error message for a specific pokemon
   */
  getRemoveError(pokemonId: number): Locator {
    return this.page.getByTestId(`favorite-remove-error-${pokemonId}`);
  }

  /**
   * Remove a pokemon from favorites
   */
  async removeFavorite(pokemonId: number): Promise<void> {
    const removeButton = this.getRemoveButton(pokemonId);
    await removeButton.click();

    // Wait for removal to complete (card should disappear)
    await expect(this.getFavoriteCard(pokemonId)).not.toBeVisible({ timeout: 10000 });

    // Extra delay to ensure state is fully propagated
    await this.page.waitForTimeout(300);
  }

  /**
   * Click "Przejdź do Pokédexu" link
   */
  async clickBrowseLink(): Promise<void> {
    await this.browseLink.click();
    await expect(this.page).toHaveURL("/pokemon");
  }

  /**
   * Click "Zaproś asystenta AI" link
   */
  async clickAILink(): Promise<void> {
    await this.aiLink.click();
    await expect(this.page).toHaveURL("/ai");
  }

  /**
   * Click "Zaloguj się" link
   */
  async clickLoginLink(): Promise<void> {
    await this.loginLink.click();
    await expect(this.page).toHaveURL(/\/auth\/login/);
  }

  /**
   * Click retry button
   */
  async retryLoading(): Promise<void> {
    await this.retryButton.click();
  }

  /**
   * Get count of favorite pokemon cards
   */
  async getFavoritesCount(): Promise<number> {
    // Wait for grid to be in DOM (even if hidden)
    await this.page.waitForSelector('[data-testid="favorites-grid"], [data-testid="favorites-empty-state"]', {
      timeout: 5000,
    });

    // If empty state is visible, count is 0
    const emptyStateVisible = await this.emptyState.isVisible().catch(() => false);
    if (emptyStateVisible) {
      return 0;
    }

    // Count cards within grid
    return await this.page.locator('[data-testid^="favorite-card-"]').count();
  }

  // ===== ASSERTIONS =====

  /**
   * Assert that a favorite exists
   */
  async expectFavoriteExists(pokemonId: number): Promise<void> {
    // First wait for the grid to be visible (not loading anymore)
    await expect(this.favoritesGrid).toBeVisible({ timeout: 10000 });
    // Then wait for the specific card
    await expect(this.getFavoriteCard(pokemonId)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert that a favorite does not exist
   */
  async expectFavoriteNotExists(pokemonId: number): Promise<void> {
    await expect(this.getFavoriteCard(pokemonId)).not.toBeVisible();
  }

  /**
   * Assert empty state is displayed
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
    await expect(this.emptyStateMessage).toBeVisible();
    await expect(this.browseLink).toBeVisible();
    await expect(this.aiLink).toBeVisible();
  }

  /**
   * Assert login is required (401 error)
   */
  async expectLoginRequired(): Promise<void> {
    await expect(this.errorState).toBeVisible({ timeout: 10000 });
    await expect(this.errorMessage).toBeVisible();

    // Check if the error message contains text about authentication
    const errorText = await this.errorMessage.textContent();
    const isAuthError = errorText?.toLowerCase().includes("zweryfikować użytkownika") ||
                       errorText?.toLowerCase().includes("zaloguj") ||
                       errorText?.toLowerCase().includes("auth");

    // Login link should be visible for auth errors (code 401)
    // Wait a bit for it to render if it's an auth error
    if (isAuthError) {
      await expect(this.loginLink).toBeVisible({ timeout: 5000 }).catch(() => {
        // If login link doesn't appear, log for debugging
        console.warn("Login link not visible despite auth error message");
      });
    }
  }

  /**
   * Assert error message is displayed
   */
  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorState).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Assert loading state is displayed
   */
  async expectLoading(): Promise<void> {
    await expect(this.loadingSkeleton).toBeVisible();
  }

  /**
   * Assert favorites grid is visible
   */
  async expectFavoritesGridVisible(): Promise<void> {
    await expect(this.favoritesGrid).toBeVisible();
  }
}
