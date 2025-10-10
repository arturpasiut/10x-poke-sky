-- 20251007095530_cache_refresh_config.sql
-- Create configuration table for scheduled cache refresh targets.

create table if not exists public.cache_refresh_targets (
  id serial primary key,
  target_type text not null check (target_type in ('pokemon', 'move')),
  target_id integer not null,
  label text,
  priority integer default 0,
  active boolean default true,
  last_refreshed timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (target_type, target_id)
);

create index if not exists cache_refresh_targets_active_idx
  on public.cache_refresh_targets (active, target_type, priority desc);

-- keep updated_at fresh
create or replace function public.touch_cache_refresh_targets()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cache_refresh_targets_updated_at on public.cache_refresh_targets;
create trigger trg_cache_refresh_targets_updated_at
before update on public.cache_refresh_targets
for each row execute function public.touch_cache_refresh_targets();

comment on table public.cache_refresh_targets is 'Configuration for nightly cache refresh cron job (Phase 2 Step 5).';
