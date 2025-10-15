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
}

/**
 * Remove a pokemon from favorites via API
 */
export async function removeFavoriteViaAPI(page: Page, pokemonId: number): Promise<void> {
  const response = await page.request.delete(`/api/users/me/favorites/${pokemonId}`);

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to remove favorite ${pokemonId}: ${response.status()} - ${body}`);
  }
}

/**
 * Check if a pokemon is in favorites via API
 */
export async function isFavoriteViaAPI(page: Page, pokemonId: number): Promise<boolean> {
  const response = await page.request.get(`/api/users/me/favorites`);

  if (!response.ok()) {
    throw new Error(`Failed to fetch favorites: ${response.status()}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.some((item: any) => item.pokemonId === pokemonId);
}

/**
 * Get all favorites via API
 */
export async function getAllFavoritesViaAPI(page: Page): Promise<any[]> {
  const response = await page.request.get(`/api/users/me/favorites`);

  if (!response.ok()) {
    throw new Error(`Failed to fetch favorites: ${response.status()}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Clear all favorites via API
 * Useful for test cleanup
 */
export async function clearAllFavoritesViaAPI(page: Page): Promise<void> {
  const favorites = await getAllFavoritesViaAPI(page);

  for (const favorite of favorites) {
    await removeFavoriteViaAPI(page, favorite.pokemonId);
  }
}

/**
 * Add multiple favorites via API
 */
export async function addMultipleFavoritesViaAPI(page: Page, pokemonIds: number[]): Promise<void> {
  for (const pokemonId of pokemonIds) {
    await addFavoriteViaAPI(page, pokemonId);
  }
}
