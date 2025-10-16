import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Pokemon Detail Page (/pokemon/[identifier])
 * Focused on favorites-related interactions
 */
export class PokemonDetailPage extends BasePage {
  // Favorite action elements
  readonly favoriteToggleButton: (pokemonId: number) => Locator;
  readonly favoriteLoginPrompt: (pokemonId: number) => Locator;
  readonly favoriteActionError: (pokemonId: number) => Locator;
  readonly favoriteActionLoading: (pokemonId: number) => Locator;

  // Page elements
  readonly pokemonName: Locator;
  readonly backButton: Locator;

  constructor(page: any) {
    super(page);

    // Favorite actions (dynamic based on pokemonId)
    this.favoriteToggleButton = (pokemonId: number) => this.page.getByTestId(`favorite-toggle-button-${pokemonId}`);

    this.favoriteLoginPrompt = (pokemonId: number) => this.page.getByTestId(`favorite-login-prompt-${pokemonId}`);

    this.favoriteActionError = (pokemonId: number) => this.page.getByTestId(`favorite-action-error-${pokemonId}`);

    this.favoriteActionLoading = (pokemonId: number) => this.page.getByTestId(`favorite-action-loading-${pokemonId}`);

    // Other page elements
    this.pokemonName = this.page.locator("h1");
    this.backButton = this.page.getByRole("link", { name: /wróć do wyników/i });
  }

  /**
   * Navigate to pokemon detail page by name
   */
  async gotoByName(name: string): Promise<void> {
    await super.goto(`/pokemon/${name.toLowerCase()}`);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to pokemon detail page by ID
   */
  async gotoById(id: number): Promise<void> {
    await super.goto(`/pokemon/${id}`);
    await this.waitForPageLoad();
  }

  /**
   * Toggle favorite status (add or remove)
   */
  async toggleFavorite(pokemonId: number): Promise<void> {
    const button = this.favoriteToggleButton(pokemonId);

    // Get current state before clicking
    const wasFavorite = await button.getAttribute("data-is-favorite");

    await button.click();

    // Wait for the entire operation to complete by checking the final state
    // This is more reliable than checking intermediate loading states
    const expectedNewState = wasFavorite === "true" ? "false" : "true";

    // Wait for both loading to finish AND favorite state to change
    await this.page.waitForFunction(
      ([id, expectedState]) => {
        const btn = document.querySelector(`[data-testid="favorite-toggle-button-${id}"]`);
        if (!btn) return false;
        const isLoading = btn.getAttribute("data-is-loading") === "true";
        const isFavorite = btn.getAttribute("data-is-favorite");
        // Return true when loading is done AND state matches expected
        return !isLoading && isFavorite === expectedState;
      },
      [pokemonId, expectedNewState],
      { timeout: 15000 }
    );

    // Extra small delay for React to fully complete render cycle
    await this.page.waitForTimeout(200);
  }

  /**
   * Click favorite login prompt (when not authenticated)
   */
  async clickFavoriteLoginPrompt(pokemonId: number): Promise<void> {
    await this.favoriteLoginPrompt(pokemonId).click();
  }

  /**
   * Get pokemon ID from current URL
   * Parses /pokemon/25 or /pokemon/pikachu
   */
  async getCurrentPokemonId(): Promise<number | null> {
    const url = this.getCurrentURL();
    const match = url.match(/\/pokemon\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Go back to pokemon list
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  // ===== ASSERTIONS =====

  /**
   * Assert pokemon is marked as favorite
   */
  async expectIsFavorite(pokemonId: number): Promise<void> {
    const button = this.favoriteToggleButton(pokemonId);
    await expect(button).toBeVisible({ timeout: 10000 });

    // Wait for loading to finish first
    await expect(button).toHaveAttribute("data-is-loading", "false", { timeout: 10000 });

    // Wait for the button to have the correct state
    await expect(button).toHaveAttribute("data-is-favorite", "true", { timeout: 5000 });

    // Check button text
    await expect(button).toContainText(/usuń z ulubionych/i);
  }

  /**
   * Assert pokemon is NOT marked as favorite
   */
  async expectIsNotFavorite(pokemonId: number): Promise<void> {
    const button = this.favoriteToggleButton(pokemonId);
    await expect(button).toBeVisible({ timeout: 10000 });

    // Wait for loading to finish first
    await expect(button).toHaveAttribute("data-is-loading", "false", { timeout: 10000 });

    // Wait for the button to have the correct state
    await expect(button).toHaveAttribute("data-is-favorite", "false", { timeout: 5000 });

    // Check button text
    await expect(button).toContainText(/dodaj do ulubionych/i);
  }

  /**
   * Assert favorite action is loading
   */
  async expectFavoriteLoading(pokemonId: number): Promise<void> {
    await expect(this.favoriteActionLoading(pokemonId)).toBeVisible();
  }

  /**
   * Assert favorite action error is displayed
   */
  async expectFavoriteError(pokemonId: number, message: string | RegExp): Promise<void> {
    const error = this.favoriteActionError(pokemonId);
    await expect(error).toBeVisible();
    await expect(error).toContainText(message);
  }

  /**
   * Assert login prompt is displayed (not authenticated)
   */
  async expectFavoriteLoginPrompt(pokemonId: number): Promise<void> {
    await expect(this.favoriteLoginPrompt(pokemonId)).toBeVisible();
    await expect(this.favoriteLoginPrompt(pokemonId)).toContainText(/dodaj do ulubionych/i);
  }

  /**
   * Assert pokemon name is displayed
   */
  async expectPokemonName(name: string): Promise<void> {
    await expect(this.pokemonName).toContainText(new RegExp(name, "i"));
  }
}
