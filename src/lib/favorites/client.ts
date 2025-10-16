import { supabaseClient } from "@/db/supabase.client";
import type { FavoriteMutationResultDto } from "@/types";

class AuthenticationRequiredError extends Error {
  constructor(message = "Wymagane logowanie, aby zarządzać ulubionymi.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

const requireAuthenticatedUser = async () => {
  if (!supabaseClient) {
    throw new Error("Supabase client nie jest skonfigurowany. Ustaw PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_KEY.");
  }

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data?.user) {
    throw new AuthenticationRequiredError();
  }

  return data.user;
};

export const addFavorite = async (pokemonId: number): Promise<FavoriteMutationResultDto> => {
  if (!supabaseClient) {
    throw new Error("Supabase client jest niedostępny. Dodawanie ulubionych zostało tymczasowo wyłączone.");
  }

  const user = await requireAuthenticatedUser();
  const { data, error } = await supabaseClient
    .from("favorites")
    .upsert(
      {
        user_id: user.id,
        pokemon_id: pokemonId,
      },
      {
        onConflict: "user_id,pokemon_id",
      }
    )
    .select("pokemon_id, created_at")
    .single();

  if (error) {
    throw new Error(error.message ?? "Nie udało się zapisać w ulubionych.");
  }

  return {
    pokemonId: data.pokemon_id,
    addedAt: data.created_at,
  };
};

export const removeFavorite = async (pokemonId: number): Promise<void> => {
  if (!supabaseClient) {
    throw new Error("Supabase client jest niedostępny. Usuwanie ulubionych zostało tymczasowo wyłączone.");
  }

  const user = await requireAuthenticatedUser();
  const { error } = await supabaseClient.from("favorites").delete().eq("user_id", user.id).eq("pokemon_id", pokemonId);

  if (error) {
    throw new Error(error.message ?? "Nie udało się usunąć z ulubionych.");
  }
};

export const checkIsFavorite = async (pokemonId: number): Promise<boolean> => {
  if (!supabaseClient) {
    console.error("[checkIsFavorite] Supabase client is not configured");
    return false;
  }

  try {
    const user = await requireAuthenticatedUser();
    const { data, error } = await supabaseClient
      .from("favorites")
      .select("pokemon_id")
      .eq("user_id", user.id)
      .eq("pokemon_id", pokemonId)
      .maybeSingle();

    if (error) {
      console.error("[checkIsFavorite] Supabase error:", error);
      return false;
    }

    return data !== null;
  } catch (err) {
    if (err instanceof AuthenticationRequiredError) {
      console.warn("[checkIsFavorite] User not authenticated");
      return false;
    }
    console.error("[checkIsFavorite] Unexpected error:", err);
    return false;
  }
};

export { AuthenticationRequiredError };
