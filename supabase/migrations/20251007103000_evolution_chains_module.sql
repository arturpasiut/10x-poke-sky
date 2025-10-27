-- 20251007103000_evolution_chains_module.sql
-- Purpose: introduce dedicated cache for evolution chains and grouped favorites support
-- Notes:
--   • additive-only migration; no existing schema objects altered
--   • relies on pgcrypto extension already enabled in initial migration

create table if not exists public.evolution_chains_cache (
  id serial primary key,
  chain_id text not null unique,
  root_pokemon_id integer not null,
  lead_pokemon_name text,
  payload jsonb not null,
  branches jsonb default '[]'::jsonb not null,
  cached_at timestamptz default timezone('utc', now()) not null
);

create index if not exists evolution_chains_cache_root_idx
  on public.evolution_chains_cache (root_pokemon_id);

create index if not exists evolution_chains_cache_cached_at_idx
  on public.evolution_chains_cache (cached_at desc);

alter table public.evolution_chains_cache
  enable row level security;

drop policy if exists "Allow read access to evolution chains cache" on public.evolution_chains_cache;
create policy "Allow read access to evolution chains cache" on public.evolution_chains_cache
  for select using (true);

drop policy if exists "Service role manages evolution chains cache" on public.evolution_chains_cache;
create policy "Service role manages evolution chains cache" on public.evolution_chains_cache
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


create table if not exists public.favorite_evolution_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  chain_id text not null,
  branch_id text not null default '',
  pokemon_ids integer[] not null,
  created_at timestamptz default timezone('utc', now()) not null,
  unique (user_id, chain_id, branch_id)
);

create index if not exists favorite_evolution_groups_user_idx
  on public.favorite_evolution_groups (user_id, created_at desc);

alter table public.favorite_evolution_groups
  enable row level security;

drop policy if exists "Users manage own evolution groups" on public.favorite_evolution_groups;
create policy "Users manage own evolution groups" on public.favorite_evolution_groups
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Service role manages evolution groups" on public.favorite_evolution_groups;
create policy "Service role manages evolution groups" on public.favorite_evolution_groups
  for all using (auth.role() = 'service_role');
