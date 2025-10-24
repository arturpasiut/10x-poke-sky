-- 20251007112000_evolution_cache_metadata.sql
-- Uzupełnia cache łańcuchów ewolucji o metadane potrzebne do filtrowania.

alter table public.evolution_chains_cache
  add column if not exists type_tags text[] not null default array[]::text[],
  add column if not exists generation_tags text[] not null default array[]::text[],
  add column if not exists pokemon_ids integer[] not null default array[]::integer[],
  add column if not exists branching_count integer not null default 1,
  add column if not exists search_terms text;

create index if not exists evolution_chains_cache_type_tags_idx
  on public.evolution_chains_cache using gin (type_tags);

create index if not exists evolution_chains_cache_generation_tags_idx
  on public.evolution_chains_cache using gin (generation_tags);

create index if not exists evolution_chains_cache_pokemon_ids_idx
  on public.evolution_chains_cache using gin (pokemon_ids);

create index if not exists evolution_chains_cache_branching_idx
  on public.evolution_chains_cache (branching_count);
