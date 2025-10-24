import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";

type SupabaseServerClient = SupabaseClient<Database>;

type FavoriteEvolutionGroupRow = Database["public"]["Tables"]["favorite_evolution_groups"]["Row"];
type FavoriteEvolutionGroupInsert = Database["public"]["Tables"]["favorite_evolution_groups"]["Insert"];

export interface FavoriteEvolutionGroupDto {
  id: string;
  chainId: string;
  branchId: string;
  pokemonIds: number[];
  createdAt: string;
}

const FAVORITE_GROUPS_TABLE = "favorite_evolution_groups";

const mapRowToDto = (row: FavoriteEvolutionGroupRow): FavoriteEvolutionGroupDto => ({
  id: row.id,
  chainId: row.chain_id,
  branchId: row.branch_id,
  pokemonIds: row.pokemon_ids,
  createdAt: row.created_at,
});

export const listGroupFavorites = async (
  supabase: SupabaseServerClient,
  userId: string,
  chainId: string | null
): Promise<FavoriteEvolutionGroupDto[]> => {
  let query = supabase
    .from(FAVORITE_GROUPS_TABLE)
    .select("id, chain_id, branch_id, pokemon_ids, created_at")
    .eq("user_id", userId);

  if (chainId) {
    query = query.eq("chain_id", chainId);
  }

  const { data, error, status } = await query.order("created_at", { ascending: false });

  if (error) {
    if (status === 403) {
      return [];
    }

    console.error("[favorites.groups] listGroupFavorites error", { error, userId, chainId, status });
    throw error;
  }

  return (data ?? []).map(mapRowToDto);
};

export const createGroupFavorite = async (
  supabase: SupabaseServerClient,
  userId: string,
  input: {
    chainId: string;
    branchId: string;
    pokemonIds: number[];
  }
): Promise<FavoriteEvolutionGroupDto> => {
  const payload: FavoriteEvolutionGroupInsert = {
    user_id: userId,
    chain_id: input.chainId,
    branch_id: input.branchId,
    pokemon_ids: input.pokemonIds,
  };

  const { data, error, status } = await supabase
    .from(FAVORITE_GROUPS_TABLE)
    .upsert(payload, {
      onConflict: "user_id,chain_id,branch_id",
    })
    .select("id, chain_id, branch_id, pokemon_ids, created_at")
    .single();

  if (error || !data) {
    if (status === 403) {
      throw new Error("Brak uprawnień do zapisu ulubionych łańcuchów.");
    }

    console.error("[favorites.groups] createGroupFavorite error", { error, userId, payload, status });
    throw error ?? new Error("Nie udało się zapisać ulubionego łańcucha.");
  }

  return mapRowToDto(data);
};

export const removeGroupFavorite = async (
  supabase: SupabaseServerClient,
  userId: string,
  chainId: string,
  branchId: string
): Promise<void> => {
  const { error, status } = await supabase
    .from(FAVORITE_GROUPS_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("chain_id", chainId)
    .eq("branch_id", branchId);

  if (error) {
    if (status === 403) {
      throw new Error("Brak uprawnień do usunięcia ulubionego łańcucha.");
    }

    console.error("[favorites.groups] removeGroupFavorite error", { error, userId, chainId, branchId, status });
    throw error;
  }
};
