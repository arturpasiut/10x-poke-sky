import type { Json, Tables, TablesInsert, TablesUpdate } from "./db/database.types";
import type { EvolutionChain, Pokemon as PokemonDetailPayload, PokemonSpecies } from "@/lib/types/pokemon";

type ProfileRow = Tables<"profiles">;
type PokemonRow = Tables<"pokemon_cache">;
type MoveRow = Tables<"moves_cache">;
type FavoriteRow = Tables<"favorites">;
type AiQueryRow = Tables<"ai_queries">;

type ProfileUpdate = TablesUpdate<"profiles">;
type FavoriteInsert = TablesInsert<"favorites">;

type JsonRecord = Record<string, Json | undefined>;

export interface PaginatedDto<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

export interface UserProfileDto {
  id: ProfileRow["id"];
  displayName: ProfileRow["display_name"];
  avatarUrl: ProfileRow["avatar_url"];
  metadata: ProfileRow["metadata"];
  createdAt: ProfileRow["created_at"];
  updatedAt: ProfileRow["updated_at"];
}

export interface UpdateUserProfileCommand {
  displayName?: ProfileUpdate["display_name"];
  avatarUrl?: ProfileUpdate["avatar_url"];
  /**
   * API guarantees an object (or null) rather than arbitrary JSON, so narrow it for handlers.
   */
  metadata?: JsonRecord | null;
}

export type PublicProfileDto = Pick<UserProfileDto, "id" | "displayName" | "avatarUrl">;

export interface PokemonSummaryDto {
  pokemonId: PokemonRow["pokemon_id"];
  name: PokemonRow["name"];
  types: PokemonRow["types"];
  generation: PokemonRow["generation"];
  region: PokemonRow["region"];
  /**
   * Cached payload may include sprites; expose a single URL derived from that structure.
   */
  spriteUrl: string | null;
  cachedAt?: PokemonRow["cached_at"];
  highlights?: string[];
}

export type PokemonListResponseDto = PaginatedDto<PokemonSummaryDto>;

export interface PokemonDetailDto {
  pokemonId: PokemonRow["pokemon_id"];
  name: PokemonRow["name"];
  types: PokemonRow["types"];
  generation: PokemonRow["generation"];
  region: PokemonRow["region"];
  payload: PokemonRow["payload"];
  cachedAt: PokemonRow["cached_at"];
}

export type PokemonDetailSummaryDto = PokemonSummaryDto & {
  cachedAt: PokemonRow["cached_at"];
};

export interface PokemonDetailResponseDto {
  summary: PokemonDetailSummaryDto;
  pokemon: PokemonDetailPayload;
  species: PokemonSpecies | null;
  evolutionChain: EvolutionChain | null;
  moves: MoveSummaryDto[];
}

export interface MoveSummaryDto {
  moveId: MoveRow["move_id"];
  name: MoveRow["name"];
  type: MoveRow["type"];
  power: MoveRow["power"];
  accuracy: MoveRow["accuracy"];
  pp: MoveRow["pp"];
  generation: MoveRow["generation"];
  cachedAt: MoveRow["cached_at"];
}

export type MoveListResponseDto = PaginatedDto<MoveSummaryDto>;

export type MoveDetailDto = MoveSummaryDto & {
  payload: MoveRow["payload"];
};

export interface PokemonFavoriteSnapshot {
  name: PokemonRow["name"];
  types: PokemonRow["types"];
  spriteUrl: string | null;
}

export interface FavoriteListItemDto {
  pokemonId: FavoriteRow["pokemon_id"];
  addedAt: FavoriteRow["created_at"];
  pokemon: PokemonFavoriteSnapshot;
}

export type FavoritesListResponseDto = PaginatedDto<FavoriteListItemDto>;

export interface AddFavoriteCommand {
  pokemonId: FavoriteInsert["pokemon_id"];
}

export interface FavoriteMutationResultDto {
  pokemonId: FavoriteRow["pokemon_id"];
  addedAt: FavoriteRow["created_at"];
}

export interface AiIdentifyCommand {
  prompt: AiQueryRow["prompt"];
  /**
   * Optional caller context; persisted as JSON alongside AI query rows.
   */
  context?: JsonRecord | null;
}

type SuggestedPokemonIds = NonNullable<AiQueryRow["suggested_pokemon_ids"]>;
type SuggestedPokemonId = SuggestedPokemonIds[number];

export interface AiIdentifySuggestionDto {
  pokemonId: SuggestedPokemonId;
  name: string;
  confidence: number;
  rationale: string | null;
}

export interface AiIdentifyResponseDto {
  queryId: AiQueryRow["id"];
  success: AiQueryRow["success"];
  latencyMs: AiQueryRow["latency_ms"];
  suggestions: AiIdentifySuggestionDto[];
  rawResponse: AiQueryRow["raw_response"];
  createdAt: AiQueryRow["created_at"];
}

export interface UserAiQueryListItemDto {
  queryId: AiQueryRow["id"];
  prompt: AiQueryRow["prompt"];
  suggestedPokemonIds: AiQueryRow["suggested_pokemon_ids"];
  success: AiQueryRow["success"];
  latencyMs: AiQueryRow["latency_ms"];
  createdAt: AiQueryRow["created_at"];
}

export type UserAiQueryListResponseDto = PaginatedDto<UserAiQueryListItemDto>;

export interface AdminAiQueryListItemDto {
  queryId: AiQueryRow["id"];
  userId: AiQueryRow["user_id"];
  success: AiQueryRow["success"];
  latencyMs: AiQueryRow["latency_ms"];
  createdAt: AiQueryRow["created_at"];
}

export interface AdminAiQueryTotalsDto {
  count: number;
  successRate: number;
  avgLatencyMs: number;
}

export interface AdminAiQueriesResponseDto {
  items: AdminAiQueryListItemDto[];
  totals: AdminAiQueryTotalsDto;
}

export interface AdminTrendingFavoriteDto {
  pokemonId: FavoriteRow["pokemon_id"];
  count: number;
  delta: number;
}

export interface AdminTrendingFavoritesResponseDto {
  items: AdminTrendingFavoriteDto[];
  period: {
    from: FavoriteRow["created_at"];
    to: FavoriteRow["created_at"];
  };
}

export interface AdminCacheHealthDto {
  lastUpdated: PokemonRow["cached_at"];
  staleCount: number;
}

export interface AdminHealthResponseDto {
  pokemonCache: AdminCacheHealthDto;
  moveCache: AdminCacheHealthDto;
}
