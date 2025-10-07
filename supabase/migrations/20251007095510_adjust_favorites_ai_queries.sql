-- 20251007095510_adjust_favorites_ai_queries.sql
-- Purpose: tighten favorites pokemon constraints and improve ai_queries analytics
-- Changes:
--   • enforce valid pokemon_id range via check constraint on public.favorites
--   • add chronological index to speed up favorites feed queries
--   • ensure ai_queries latency is non-negative and index successful events
-- Notes:
--   • safe for existing data assuming pokemon_id already respects national dex bounds
--   • indexes created without concurrently clauses because supabase migrations run in a transaction

-- add constraint to keep pokemon_id within the known pokedex range (1-1025)
alter table public.favorites
  add constraint favorites_pokemon_id_valid
  check (pokemon_id between 1 and 1025);

-- index favorites by newest first for efficient timeline queries
create index if not exists favorites_created_at_idx
  on public.favorites (created_at desc);

-- ensure recorded latency values are non-negative when provided
alter table public.ai_queries
  add constraint ai_queries_latency_non_negative
  check (latency_ms is null or latency_ms >= 0);

-- partial index to accelerate analytics focused on successful ai responses
create index if not exists ai_queries_success_created_at_idx
  on public.ai_queries (created_at desc)
  where success is true;
