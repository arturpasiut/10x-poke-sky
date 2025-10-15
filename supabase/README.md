# Supabase Local Setup (Mocked)

The project uses Supabase for authentication, persistence and caching. During Phase 0 and Phase 1 we keep all integrations behind mocks and fake credentials. This guide explains how to bootstrap a local Supabase instance with the required schema and policies while still avoiding real secrets.

## Prerequisites

- [Docker](https://www.docker.com/) or the [Supabase CLI](https://supabase.com/docs/guides/cli) if you want to run the stack locally.
- `.env` containing the fake Supabase URL and anon key. In local development the CLI will inject credentials automatically.

## Project Structure

```
supabase/
├── migrations/
│   └── 0001_init.sql  # Tables and RLS policies for Phase 0
└── README.md
```

## Getting Started Locally

1. Install the Supabase CLI (optional but recommended):

   ```bash
   npm install -g supabase
   ```

2. Start Supabase locally using the built-in stack:

   ```bash
   supabase start
   ```

   The CLI spins up Postgres, Auth, Storage and Studio. Default credentials are printed in the terminal. Replace `SUPABASE_URL` and `SUPABASE_KEY` in your `.env` with the values that point to the local instance when needed.

3. Apply migrations:

   ```bash
   supabase db reset
   ```

   The command resets the database and executes every SQL file from `supabase/migrations` in order. You can also target the current database without reset using `supabase db push`.

4. Access Supabase Studio:

   ```bash
   supabase studio
   ```

   Log in with the credentials shown by `supabase start` and verify that the tables and policies exist.

## Auth Settings

In the Supabase dashboard, configure Authentication → Add the following settings:

- Enable email/password login only (disable external providers for now).
- Require email confirmation: optional for development (can be disabled to speed up testing).
- Configure password recovery email templates if needed later.

## Tables Overview

- `profiles`: One-to-one extension of Supabase auth users; stores display name, avatar, metadata.
- `favorites`: Junction table connecting users with Pokémon entries they bookmarked.
- `pokemon_cache`: Stores cached summary data for list view (persisted from Phase 2 edge functions).
- `moves_cache`: Stores cached move metadata to avoid hitting PokeAPI repeatedly.
- `ai_queries`: Logs AI identification requests for debugging and rate limiting.

RLS policies ensure that:

- Users can only read/update their own profile and favorites.
- Cache tables are readable by anonymous users but writable only by the service role.
- `ai_queries` are inserted by service role functions; users can read only their own history (optional future enhancement).

## Next Steps

- Add Edge Functions that consume this schema (Phase 0 step 4).
- When provisioning a real Supabase project, copy these migrations and re-run `supabase db push` to replicate the structure.
- Store real service role/anon keys in deployment secrets, never in the repo.
