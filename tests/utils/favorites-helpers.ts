import type { Page } from "@playwright/test";

/**
 * Helper functions for favorites API operations
 * These bypass the UI for faster test setup
 */

/**
 * Add a pokemon to favorites via API
 */
export async function addFavoriteViaAPI(page: Page, pokemonId: number): Promise<void> {
  const response = await page.request.post(`/api/users/me/favorites`, {
    data: { pokemonId },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to add favorite ${pokemonId}: ${response.status()} - ${body}`);
  }

  // Delay to allow UI state to propagate (API → DB → Zustand → React)
  await page.waitForTimeout(300);
}

/**
 * Remove a pokemon from favorites via API
 */
export async function removeFavoriteViaAPI(page: Page, pokemonId: number): Promise<void> {
  const response = await page.request.delete(`/api/users/me/favorites/${pokemonId}`);

  // 404 is OK - favorite already doesn't exist
  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(`Failed to remove favorite ${pokemonId}: ${response.status()} - ${body}`);
  }

  // Delay to allow UI state to propagate (API → DB → Zustand → React)
  await page.waitForTimeout(300);
}

interface FavoriteItem {
  pokemonId: number;
  addedAt: string;
  pokemon: {
    name: string;
    types: string[];
    spriteUrl: string | null;
  };
}

/**
 * Check if a pokemon is in favorites via API
 */
export async function isFavoriteViaAPI(page: Page, pokemonId: number): Promise<boolean> {
  const response = await page.request.get(`/api/users/me/favorites`);

  if (!response.ok()) {
    throw new Error(`Failed to fetch favorites: ${response.status()}`);
  }

  const data = (await response.json()) as { items: FavoriteItem[] };
  const items = data.items || [];

  return items.some((item) => item.pokemonId === pokemonId);
}

/**
 * Get all favorites via API
 */
export async function getAllFavoritesViaAPI(page: Page): Promise<FavoriteItem[]> {
  const response = await page.request.get(`/api/users/me/favorites`);

  if (!response.ok()) {
    throw new Error(`Failed to fetch favorites: ${response.status()}`);
  }

  const data = (await response.json()) as { items: FavoriteItem[] };
  return data.items || [];
}

/**
 * Clear all favorites via API
 * Useful for test cleanup
 */
export async function clearAllFavoritesViaAPI(page: Page): Promise<void> {
  try {
    const favorites = await getAllFavoritesViaAPI(page);

    for (const favorite of favorites) {
      try {
        await removeFavoriteViaAPI(page, favorite.pokemonId);
      } catch (error) {
        // Log but continue - we want to remove as many as possible
        console.warn(`Could not remove favorite ${favorite.pokemonId}:`, error);
      }
    }

    // Extra delay after clearing all to ensure state is clean
    if (favorites.length > 0) {
      await page.waitForTimeout(500);
    }
  } catch (error) {
    // If fetching favorites fails (e.g., not authenticated or already cleared), that's OK for cleanup
    // This is expected when running tests in parallel or after logout
    console.warn("Could not fetch favorites for cleanup:", error);
  }
}

/**
 * Add multiple favorites via API
 */
export async function addMultipleFavoritesViaAPI(page: Page, pokemonIds: number[]): Promise<void> {
  for (const pokemonId of pokemonIds) {
    await addFavoriteViaAPI(page, pokemonId);
  }

  // Extra delay after adding multiple to ensure all are propagated
  if (pokemonIds.length > 0) {
    await page.waitForTimeout(500);
  }
}
