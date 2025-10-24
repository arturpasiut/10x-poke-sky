-- 20251007120000_extend_favorites_metadata.sql
-- Purpose: add cached pokemon metadata columns to favorites table.

alter table public.favorites
  add column if not exists pokemon_name text,
  add column if not exists pokemon_types text[] default array[]::text[] not null,
  add column if not exists pokemon_sprite_url text;

comment on column public.favorites.pokemon_name is 'Cached name of the Pokémon at the moment of favoriting';
comment on column public.favorites.pokemon_types is 'Cached list of Pokémon types for quick display';
comment on column public.favorites.pokemon_sprite_url is 'Cached sprite URL used in favorites view';
