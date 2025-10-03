# Supabase Edge Functions

Edge Functions provide a serverless runtime (Deno) inside Supabase. They handle fetching and caching data from PokeAPI so the Astro app can call a stable backend endpoint.

During Phase 0 the functions can operate in two modes:

- **Mocked** – default when `USE_POKEAPI_MOCK=true`. Returns deterministic fixtures without hitting the network.
- **Live proxy** – fetches from the public PokeAPI when `USE_POKEAPI_MOCK` is unset or `false`.

## Directory Layout

```
supabase/functions/
├── README.md
├── _shared/
│   ├── config.ts         # Helper for reading environment variables
│   ├── mock-data.ts      # Deterministic fixtures for mocked mode
│   └── pokeapi.ts        # Fetch helpers used by functions
├── pokemon-details/
│   └── index.ts
└── pokemon-list/
    └── index.ts
```

## Local Development

1. Start Supabase services (uses Docker under the hood):

   ```bash
   supabase start
   ```

2. Serve an edge function locally:

   ```bash
   cd supabase/functions
   supabase functions serve pokemon-list --env-file ../../.env
   ```

   The command prints a local URL (default `http://0.0.0.0:54321/functions/v1/pokemon-list`).

3. Deploying (when infrastructure is ready):

   ```bash
   supabase functions deploy pokemon-list
   supabase functions deploy pokemon-details
   ```

   Remember to set `POKEAPI_BASE_URL` and `USE_POKEAPI_MOCK` in the function environment panel if you rely on mocked-data fallback.

## Authentication Notes

- Anonymous/public requests can call these functions because they only proxy/cache public PokeAPI data.
- When the caching logic is added (Phase 2) the functions will use the Supabase service role key (stored as `SUPABASE_SERVICE_ROLE_KEY` in function secrets) to read/write the cache tables.

