# REST API Plan

## 1. Zasoby
- `Profile` — table `public.profiles`; user-visible profile metadata linked 1:1 with Supabase Auth users.
- `Pokemon` — table `public.pokemon_cache`; cached Pokemon summaries, stats, evolutions, and metadata.
- `PokemonMove` — table `public.moves_cache`; cached move catalogue with combat attributes.
- `Favorite` — table `public.favorites`; user-specific list of bookmarked Pokemon.
- `AIQuery` — table `public.ai_queries`; audit log of AI-assisted Pokemon identification sessions.
- `Auth` — Supabase Auth (`auth.users`, JWT session handling) leveraged via Supabase REST endpoints.
- `AdminMetric` — derived analytics over `public.ai_queries` and `public.favorites` for internal reporting.

## 2. Punkty końcowe

### 2.1 Profiles
- **Method**: `GET`  
  **Path**: `/api/users/me/profile`  
  **Description**: Fetch the authenticated user's profile metadata.  
  **Query Parameters**: _None_  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "id": "uuid",
    "displayName": "string | null",
    "avatarUrl": "string | null",
    "metadata": { "locale": "en-US", "...": "..." },
    "createdAt": "iso8601",
    "updatedAt": "iso8601"
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `401 Unauthorized`, `404 Not Found` (profile missing), `500 Internal Server Error`

- **Method**: `PUT`  
  **Path**: `/api/users/me/profile`  
  **Description**: Update profile fields for the authenticated user.  
  **Query Parameters**: _None_  
  **Request JSON**:
  ```json
  {
    "displayName": "string | null",
    "avatarUrl": "string | null",
    "metadata": { "...": "..." }
  }
  ```  
  **Response JSON**: Same shape as `GET /api/users/me/profile`.  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request` (invalid URL/JSON), `401 Unauthorized`, `422 Unprocessable Entity` (metadata not JSON object), `429 Too Many Requests`, `500 Internal Server Error`

- **Method**: `GET`  
  **Path**: `/api/users/{userId}/profile`  
  **Description**: Public read-only access to another user's profile (limited fields).  
  **Query Parameters**: optional `fields=displayName,avatarUrl` for sparse projections.  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "id": "uuid",
    "displayName": "string | null",
    "avatarUrl": "string | null"
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request` (invalid UUID), `404 Not Found`

### 2.2 Pokemon
- **Method**: `GET`  
  **Path**: `/api/pokemon`  
  **Description**: List Pokemon with filtering, sorting, and pagination.  
  **Query Parameters**:  
    - `search`: partial name match (case-insensitive).  
    - `type`: repeatable (multi-value) filter on Pokemon types.  
    - `generation`: filter by generation slug.  
    - `region`: filter by region.  
    - `sort`: `name`, `pokedex`, or `cachedAt` (default `pokedex`).  
    - `order`: `asc` or `desc`.  
    - `page`: 1-based page index (default `1`).  
    - `pageSize`: number per page (default `24`, max `96`).  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "items": [
      {
        "pokemonId": 6,
        "name": "charizard",
        "types": ["fire", "flying"],
        "generation": "generation-i",
        "region": "kanto",
        "spriteUrl": "https://...",
        "highlights": ["fire", "flying"]
      }
    ],
    "page": 1,
    "pageSize": 24,
    "total": 1025,
    "hasNext": true
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request` (invalid filters), `429 Too Many Requests`, `500 Internal Server Error`

- **Method**: `GET`  
  **Path**: `/api/pokemon/{pokemonId}`  
  **Description**: Retrieve a Pokemon's full cached payload, including optional relations.  
  **Query Parameters**: `include=moves,evolutions` (comma-delimited) to project nested data from cache; `fresh=true` to bypass cache and refetch (service role only).  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "pokemonId": 6,
    "name": "charizard",
    "types": ["fire", "flying"],
    "generation": "generation-i",
    "region": "kanto",
    "payload": {
      "stats": [...],
      "moves": [...],
      "evolutions": [...],
      "sprites": {...}
    },
    "cachedAt": "iso8601"
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request` (pokemonId not numeric), `404 Not Found`, `500 Internal Server Error`

### 2.3 Pokemon Moves
- **Method**: `GET`  
  **Path**: `/api/moves`  
  **Description**: List Pokemon moves with filter and sort controls.  
  **Query Parameters**:  
    - `search`: partial move name.  
    - `type`: filter by elemental type.  
    - `region`: filter by origin region.  
    - `minPower` / `maxPower`: numeric boundaries.  
    - `sort`: `name`, `power`, `accuracy`, `cachedAt`.  
    - `order`: `asc` | `desc`.  
    - `page`, `pageSize`: same semantics as Pokemon list.  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "items": [
      {
        "moveId": 15,
        "name": "cut",
        "type": "normal",
        "power": 50,
        "accuracy": 95,
        "pp": 30,
        "generation": "generation-i",
        "cachedAt": "iso8601"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "total": 620,
    "hasNext": true
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request`, `429 Too Many Requests`

- **Method**: `GET`  
  **Path**: `/api/moves/{moveId}`  
  **Description**: Fetch detailed cached description of a move.  
  **Query Parameters**: `include=learnedBy` to surface Pokemon that learn the move (if present in payload).  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "moveId": 15,
    "name": "cut",
    "type": "normal",
    "power": 50,
    "accuracy": 95,
    "pp": 30,
    "generation": "generation-i",
    "payload": {...},
    "cachedAt": "iso8601"
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request`, `404 Not Found`

### 2.4 Favorites
- **Method**: `GET`  
  **Path**: `/api/users/me/favorites`  
  **Description**: Paginated list of the authenticated user's favorite Pokemon, enriched with cache data.  
  **Query Parameters**: `page`, `pageSize`, `sort=createdAt|name`, `order`.  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "items": [
      {
        "pokemonId": 6,
        "addedAt": "iso8601",
        "pokemon": {
          "name": "charizard",
          "types": ["fire", "flying"],
          "spriteUrl": "https://..."
        }
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "hasNext": false
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `401 Unauthorized`, `403 Forbidden` (missing JWT), `429 Too Many Requests`

- **Method**: `POST`  
  **Path**: `/api/users/me/favorites`  
  **Description**: Add a Pokemon to the user's favorites (idempotent).  
  **Query Parameters**: _None_  
  **Request JSON**:
  ```json
  {
    "pokemonId": 6
  }
  ```  
  **Response JSON**:
  ```json
  {
    "pokemonId": 6,
    "addedAt": "iso8601"
  }
  ```  
  **Success Codes**: `201 Created` (new), `200 OK` (already favorited but treated idempotently)  
  **Error Codes**: `400 Bad Request` (missing pokemonId), `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (violates uniqueness), `422 Unprocessable Entity` (pokemonId outside 1–1025), `500 Internal Server Error`

- **Method**: `DELETE`  
  **Path**: `/api/users/me/favorites/{pokemonId}`  
  **Description**: Remove a Pokemon from the user's favorites.  
  **Query Parameters**: _None_  
  **Request JSON**: _None_  
  **Response JSON**: _None_  
  **Success Codes**: `204 No Content`  
  **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (not favorited), `500 Internal Server Error`

### 2.5 AI Queries & Chat
- **Method**: `POST`  
  **Path**: `/api/ai/identify`  
  **Description**: Submit a natural-language description and receive suggested Pokemon with AI confidence scores; logs to `ai_queries`.  
  **Query Parameters**: optional `mode=stream|sync` (default `sync`).  
  **Request JSON**:
  ```json
  {
    "prompt": "Blue Pokemon with a water tail",
    "context": {
      "preferredGeneration": "generation-ii"
    }
  }
  ```  
  **Response JSON**:
  ```json
  {
    "queryId": "uuid",
    "success": true,
    "latencyMs": 820,
    "suggestions": [
      {
        "pokemonId": 7,
        "name": "squirtle",
        "confidence": 0.82,
        "rationale": "Matches blue turtle with water tail"
      }
    ],
    "rawResponse": {},
    "createdAt": "iso8601"
  }
  ```  
  **Success Codes**: `200 OK` (sync success), `202 Accepted` (if `mode=stream` triggers async follow-up)  
  **Error Codes**: `400 Bad Request` (empty prompt), `401 Unauthorized` (if auth required for high volume), `422 Unprocessable Entity` (prompt exceeds length), `429 Too Many Requests`, `500 Internal Server Error`

- **Method**: `GET`  
  **Path**: `/api/users/me/ai-queries`  
  **Description**: Retrieve the user's past AI identification attempts.  
  **Query Parameters**: `success=true|false`, `from`, `to`, `page`, `pageSize`.  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "items": [
      {
        "queryId": "uuid",
        "prompt": "string",
        "suggestedPokemonIds": [7, 8],
        "success": true,
        "latencyMs": 820,
        "createdAt": "iso8601"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "total": 32,
    "hasNext": true
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `401 Unauthorized`, `429 Too Many Requests`

- **Method**: `GET`  
  **Path**: `/api/admin/ai/queries`  
  **Description**: Service-role-only access to AI usage analytics (for dashboards and metrics).  
  **Query Parameters**: `success`, `dateRange`, `userId`, `limit`, `offset`.  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "items": [
      {
        "queryId": "uuid",
        "userId": "uuid | null",
        "success": true,
        "latencyMs": 820,
        "createdAt": "iso8601"
      }
    ],
    "totals": {
      "count": 1200,
      "successRate": 0.78,
      "avgLatencyMs": 940
    }
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `401 Unauthorized`, `403 Forbidden`, `429 Too Many Requests`, `500 Internal Server Error`

### 2.6 Authentication & Session Management (Supabase Auth)
- **Method**: `POST`  
  **Path**: `/auth/v1/signup` (Supabase)  
  **Description**: Register new users; server triggers background profile bootstrap (`POST /api/users/me/profile` with defaults) upon success.  
  **Query Parameters**: _None_  
  **Request JSON**:
  ```json
  {
    "email": "user@example.com",
    "password": "string",
    "options": {
      "data": {
        "displayName": "Ash"
      }
    }
  }
  ```  
  **Response JSON**: Supabase Auth session payload (`access_token`, `user`, etc.).  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request`, `409 Conflict` (email exists), `422 Unprocessable Entity`, `429 Too Many Requests`

- **Method**: `POST`  
  **Path**: `/auth/v1/token?grant_type=password`  
  **Description**: User login to obtain JWT access and refresh tokens.  
  **Query Parameters**: `grant_type=password`.  
  **Request JSON**:
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```  
  **Response JSON**: Supabase Auth session payload.  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `429 Too Many Requests`

- **Method**: `POST`  
  **Path**: `/auth/v1/recover`  
  **Description**: Initiate password reset email.  
  **Query Parameters**: _None_  
  **Request JSON**:
  ```json
  {
    "email": "user@example.com"
  }
  ```  
  **Response JSON**: `{ "message": "Reset email sent" }`  
  **Success Codes**: `200 OK`  
  **Error Codes**: `400 Bad Request`, `404 Not Found`, `429 Too Many Requests`

### 2.7 Admin Metrics
- **Method**: `GET`  
  **Path**: `/api/admin/favorites/trending`  
  **Description**: Service-role insight into most-favorited Pokemon over a period.  
  **Query Parameters**: `from`, `to`, `limit` (default `10`).  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "items": [
      {
        "pokemonId": 6,
        "count": 120,
        "delta": 0.12
      }
    ],
    "period": {
      "from": "iso8601",
      "to": "iso8601"
    }
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`

- **Method**: `GET`  
  **Path**: `/api/admin/health`  
  **Description**: Internal health metrics (cache freshness, queue backlog) including latest `pokemon_cache.cached_at`.  
  **Query Parameters**: _None_  
  **Request JSON**: _None_  
  **Response JSON**:
  ```json
  {
    "pokemonCache": {
      "lastUpdated": "iso8601",
      "staleCount": 12
    },
    "moveCache": {
      "lastUpdated": "iso8601",
      "staleCount": 5
    }
  }
  ```  
  **Success Codes**: `200 OK`  
  **Error Codes**: `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`

## 3. Uwierzytelnianie i autoryzacja
- Use Supabase Auth JWTs; clients attach `Authorization: Bearer {access_token}` to protected endpoints (`/api/users/me/**`, `/api/users/me/favorites`, `/api/users/me/ai-queries`).
- Server-side handlers use Supabase service-role key when elevated access to bypass RLS is required (admin endpoints, cache refresh, analytics).
- Anonymous access is allowed for `GET /api/pokemon`, `GET /api/moves`, and `POST /api/ai/identify` with low rate limits; anonymous AI queries persist with `user_id = null`.
- Implement rate limiting:  
  - Authenticated users: sliding window (e.g., 60 requests/min) per token.  
  - Anonymous AI identify: stricter window (e.g., 10 prompts/hour per IP).  
- Apply role-based guards:  
  - `user` role for authenticated individuals.  
  - `service` or `admin` role (server) for `/api/admin/**` and cache refresh operations.  
- All endpoints served over HTTPS and validate JWT signature using Supabase JWKS; refresh tokens managed by Supabase Auth.

## 4. Walidacja i logika biznesowa
- **profiles**: ensure `metadata` is a JSON object; sanitize `displayName` length (max 80 chars) and `avatarUrl` format; `updatedAt` managed automatically via trigger, so controllers should not overwrite it manually.
- **favorites**: enforce `pokemonId` integer in range 1–1025; respond idempotently on duplicate insert (because of unique `(user_id, pokemon_id)`); deletion validates ownership via JWT subject; pagination leverages `favorites_created_at_idx` for reverse chronological lists.
- **pokemon_cache**: treat records as read-only; fail `fresh=true` requests for non-admins; provide cache stale hints if `cachedAt` exceeds freshness threshold (e.g., 24h) to guide edge function refresh.
- **moves_cache**: similar read-only semantics; validate numeric filters (`minPower <= maxPower`); leverage `moves_cache_cached_at_idx` for freshness reporting.
- **ai_queries**: validate prompt length (min 10, max 500 chars), capture latency as non-negative, and redact sensitive text before persisting `rawResponse`; on AI failure mark `success=false` and surface fallback message.
- **AI identify**: enforce Pokemon-only knowledge domain by post-processing AI output; map AI suggestions to known `pokemon_id` via `pokemon_cache` lookup.
- **Rate limiting & abuse protection**: integrate with edge middleware (e.g., Upstash/Redis) to throttle per IP/token; detect repeated 422 errors on AI endpoint to avoid prompt injection attempts.
- **Error handling**: standardize error responses:  
  ```json
  {
    "error": "string_code",
    "message": "Human readable explanation"
  }
  ```  
  Use `error` codes like `invalid_filter`, `favorite_exists`, `prompt_too_short`.
- **Audit & monitoring**: log admin accesses and AI interactions; export aggregated metrics from `ai_queries` to dashboards to track success rate and latency trends.
- **Data privacy**: ensure personal data in `profiles.metadata` does not include sensitive fields; apply GDPR-compliant deletion by cascading from Supabase Auth (`on delete cascade`).
- **Testing considerations**: provide contract tests (e.g., with Vitest + supertest) covering typical flows (favorites CRUD, Pokemon search filters, AI identify) and schema validation (422 responses).
