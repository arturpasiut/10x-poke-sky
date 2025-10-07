-- 0001_init.sql
-- Schema bootstrap for 10x-poke-sky (Phase 0)
-- All tables enable Row Level Security and rely on policies defined below.

-- Enable required extensions
create extension if not exists pgcrypto;

-- profiles table mirrors auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

alter table public.profiles
  enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Service role can manage profiles" on public.profiles
  for all using (auth.role() = 'service_role');

-- Automatically keep updated_at fresh
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_profiles_updated_at on public.profiles;
create trigger trigger_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

-- favorites table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  pokemon_id integer not null,
  created_at timestamptz default timezone('utc', now()) not null,
  unique (user_id, pokemon_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id);
create index if not exists favorites_pokemon_idx on public.favorites (pokemon_id);

alter table public.favorites
  enable row level security;

create policy "Users can manage own favorites" on public.favorites
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Service role can manage favorites" on public.favorites
  for all using (auth.role() = 'service_role');

-- pokemon_cache table stores hydrated list summaries
create table if not exists public.pokemon_cache (
  id serial primary key,
  pokemon_id integer not null unique,
  name text not null,
  types text[] not null,
  generation text,
  region text,
  payload jsonb not null,
  cached_at timestamptz default timezone('utc', now()) not null
);

create index if not exists pokemon_cache_cached_at_idx on public.pokemon_cache (cached_at desc);

alter table public.pokemon_cache
  enable row level security;

create policy "Allow read access to pokemon_cache" on public.pokemon_cache
  for select using (true);

create policy "Service role updates pokemon_cache" on public.pokemon_cache
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- moves_cache table mirrors move metadata
create table if not exists public.moves_cache (
  id serial primary key,
  move_id integer not null unique,
  name text not null,
  type text,
  power integer,
  accuracy integer,
  pp integer,
  generation text,
  payload jsonb not null,
  cached_at timestamptz default timezone('utc', now()) not null
);

create index if not exists moves_cache_cached_at_idx on public.moves_cache (cached_at desc);

alter table public.moves_cache
  enable row level security;

create policy "Allow read access to moves_cache" on public.moves_cache
  for select using (true);

create policy "Service role manages moves_cache" on public.moves_cache
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ai_queries logs chat interactions for auditing/rate limiting
create table if not exists public.ai_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  prompt text not null,
  suggested_pokemon_ids integer[] default array[]::integer[],
  raw_response jsonb,
  success boolean default false,
  latency_ms integer,
  created_at timestamptz default timezone('utc', now()) not null
);

create index if not exists ai_queries_user_idx on public.ai_queries (user_id, created_at desc);

alter table public.ai_queries
  enable row level security;

create policy "Users can read own ai queries" on public.ai_queries
  for select using (auth.uid() = user_id);

create policy "Service role logs ai queries" on public.ai_queries
  for insert with check (auth.role() = 'service_role');

create policy "Service role can read ai queries" on public.ai_queries
  for select using (auth.role() = 'service_role');

-- helper comment for clarity
comment on schema public is 'Schema for 10x-poke-sky application data. Managed via supabase/migrations.';

