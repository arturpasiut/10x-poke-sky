import type { Json, Tables, TablesInsert, TablesUpdate } from "./db/database.types"

type ProfileRow = Tables<"profiles">
type PokemonRow = Tables<"pokemon_cache">
type MoveRow = Tables<"moves_cache">
type FavoriteRow = Tables<"favorites">
type AiQueryRow = Tables<"ai_queries">

type ProfileUpdate = TablesUpdate<"profiles">
type FavoriteInsert = TablesInsert<"favorites">

type JsonRecord = Record<string, Json | undefined>

export type PaginatedDto<TItem> = {
  items: TItem[]
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

export type UserProfileDto = {
  id: ProfileRow["id"]
  displayName: ProfileRow["display_name"]
  avatarUrl: ProfileRow["avatar_url"]
  metadata: ProfileRow["metadata"]
  createdAt: ProfileRow["created_at"]
  updatedAt: ProfileRow["updated_at"]
}

export type UpdateUserProfileCommand = {
  displayName?: ProfileUpdate["display_name"]
  avatarUrl?: ProfileUpdate["avatar_url"]
  /**
   * API guarantees an object (or null) rather than arbitrary JSON, so narrow it for handlers.
   */
  metadata?: JsonRecord | null
}

export type PublicProfileDto = Pick<UserProfileDto, "id" | "displayName" | "avatarUrl">

import type { EvolutionChain, Pokemon as PokemonDetailPayload, PokemonSpecies } from "@/lib/types/pokemon";

export type PokemonSummaryDto = {
  pokemonId: PokemonRow["pokemon_id"]
  name: PokemonRow["name"]
  types: PokemonRow["types"]
  generation: PokemonRow["generation"]
  region: PokemonRow["region"]
  /**
   * Cached payload may include sprites; expose a single URL derived from that structure.
   */
  spriteUrl: string | null
  cachedAt?: PokemonRow["cached_at"]
  highlights?: string[]
}

export type PokemonListResponseDto = PaginatedDto<PokemonSummaryDto>

export type PokemonDetailDto = {
  pokemonId: PokemonRow["pokemon_id"]
  name: PokemonRow["name"]
  types: PokemonRow["types"]
  generation: PokemonRow["generation"]
  region: PokemonRow["region"]
  payload: PokemonRow["payload"]
  cachedAt: PokemonRow["cached_at"]
}

export type PokemonDetailSummaryDto = PokemonSummaryDto & {
  cachedAt: PokemonRow["cached_at"]
}

export type PokemonDetailResponseDto = {
  summary: PokemonDetailSummaryDto
  pokemon: PokemonDetailPayload
  species: PokemonSpecies | null
  evolutionChain: EvolutionChain | null
  moves: MoveSummaryDto[]
}

export type MoveSummaryDto = {
  moveId: MoveRow["move_id"]
  name: MoveRow["name"]
  type: MoveRow["type"]
  power: MoveRow["power"]
  accuracy: MoveRow["accuracy"]
  pp: MoveRow["pp"]
  generation: MoveRow["generation"]
  cachedAt: MoveRow["cached_at"]
}

export type MoveListResponseDto = PaginatedDto<MoveSummaryDto>

export type MoveDetailDto = MoveSummaryDto & {
  payload: MoveRow["payload"]
}

export type PokemonFavoriteSnapshot = {
  name: PokemonRow["name"]
  types: PokemonRow["types"]
  spriteUrl: string | null
}

export type FavoriteListItemDto = {
  pokemonId: FavoriteRow["pokemon_id"]
  addedAt: FavoriteRow["created_at"]
  pokemon: PokemonFavoriteSnapshot
}

export type FavoritesListResponseDto = PaginatedDto<FavoriteListItemDto>

export type AddFavoriteCommand = {
  pokemonId: FavoriteInsert["pokemon_id"]
}

export type FavoriteMutationResultDto = {
  pokemonId: FavoriteRow["pokemon_id"]
  addedAt: FavoriteRow["created_at"]
}

export type AiIdentifyCommand = {
  prompt: AiQueryRow["prompt"]
  /**
   * Optional caller context; persisted as JSON alongside AI query rows.
   */
  context?: JsonRecord | null
}

type SuggestedPokemonIds = NonNullable<AiQueryRow["suggested_pokemon_ids"]>
type SuggestedPokemonId = SuggestedPokemonIds[number]

export type AiIdentifySuggestionDto = {
  pokemonId: SuggestedPokemonId
  name: string
  confidence: number
  rationale: string | null
}

export type AiIdentifyResponseDto = {
  queryId: AiQueryRow["id"]
  success: AiQueryRow["success"]
  latencyMs: AiQueryRow["latency_ms"]
  suggestions: AiIdentifySuggestionDto[]
  rawResponse: AiQueryRow["raw_response"]
  createdAt: AiQueryRow["created_at"]
}

export type UserAiQueryListItemDto = {
  queryId: AiQueryRow["id"]
  prompt: AiQueryRow["prompt"]
  suggestedPokemonIds: AiQueryRow["suggested_pokemon_ids"]
  success: AiQueryRow["success"]
  latencyMs: AiQueryRow["latency_ms"]
  createdAt: AiQueryRow["created_at"]
}

export type UserAiQueryListResponseDto = PaginatedDto<UserAiQueryListItemDto>

export type AdminAiQueryListItemDto = {
  queryId: AiQueryRow["id"]
  userId: AiQueryRow["user_id"]
  success: AiQueryRow["success"]
  latencyMs: AiQueryRow["latency_ms"]
  createdAt: AiQueryRow["created_at"]
}

export type AdminAiQueryTotalsDto = {
  count: number
  successRate: number
  avgLatencyMs: number
}

export type AdminAiQueriesResponseDto = {
  items: AdminAiQueryListItemDto[]
  totals: AdminAiQueryTotalsDto
}

export type AdminTrendingFavoriteDto = {
  pokemonId: FavoriteRow["pokemon_id"]
  count: number
  delta: number
}

export type AdminTrendingFavoritesResponseDto = {
  items: AdminTrendingFavoriteDto[]
  period: {
    from: FavoriteRow["created_at"]
    to: FavoriteRow["created_at"]
  }
}

export type AdminCacheHealthDto = {
  lastUpdated: PokemonRow["cached_at"]
  staleCount: number
}

export type AdminHealthResponseDto = {
  pokemonCache: AdminCacheHealthDto
  moveCache: AdminCacheHealthDto
}
