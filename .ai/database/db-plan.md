1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

- **profiles**
  - `id` (`uuid`, PRIMARY KEY, FOREIGN KEY → `auth.users.id`, NOT NULL, ON DELETE CASCADE)
  - `display_name` (`text`, NULLABLE)
  - `avatar_url` (`text`, NULLABLE)
  - `metadata` (`jsonb`, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `created_at` (`timestamptz`, NOT NULL, DEFAULT `timezone('utc', now())`)
  - `updated_at` (`timestamptz`, NOT NULL, DEFAULT `timezone('utc', now())`)
  - Ograniczenia: `PRIMARY KEY (id)`, `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`
- **favorites**
  - `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
  - `user_id` (`uuid`, NOT NULL, FOREIGN KEY → `auth.users.id`, ON DELETE CASCADE)
  - `pokemon_id` (`integer`, NOT NULL, CHECK `pokemon_id BETWEEN 1 AND 1025`)
  - `created_at` (`timestamptz`, NOT NULL, DEFAULT `timezone('utc', now())`)
  - Ograniczenia: `PRIMARY KEY (id)`, `UNIQUE (user_id, pokemon_id)`, `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- **pokemon_cache**
  - `id` (`serial`, PRIMARY KEY)
  - `pokemon_id` (`integer`, NOT NULL, UNIQUE)
  - `name` (`text`, NOT NULL)
  - `types` (`text[]`, NOT NULL)
  - `generation` (`text`, NULLABLE)
  - `region` (`text`, NULLABLE)
  - `payload` (`jsonb`, NOT NULL)
  - `cached_at` (`timestamptz`, NOT NULL, DEFAULT `timezone('utc', now())`)
- **moves_cache**
  - `id` (`serial`, PRIMARY KEY)
  - `move_id` (`integer`, NOT NULL, UNIQUE)
  - `name` (`text`, NOT NULL)
  - `type` (`text`, NULLABLE)
  - `power` (`integer`, NULLABLE)
  - `accuracy` (`integer`, NULLABLE)
  - `pp` (`integer`, NULLABLE)
  - `generation` (`text`, NULLABLE)
  - `payload` (`jsonb`, NOT NULL)
  - `cached_at` (`timestamptz`, NOT NULL, DEFAULT `timezone('utc', now())`)
- **ai_queries**
  - `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
  - `user_id` (`uuid`, NULLABLE, FOREIGN KEY → `auth.users.id`, ON DELETE SET NULL)
  - `prompt` (`text`, NOT NULL)
  - `suggested_pokemon_ids` (`integer[]`, NOT NULL, DEFAULT `array[]::integer[]`)
  - `raw_response` (`jsonb`, NULLABLE)
  - `success` (`boolean`, NOT NULL, DEFAULT `false`)
  - `latency_ms` (`integer`, NULLABLE, CHECK `latency_ms >= 0`)
  - `created_at` (`timestamptz`, NOT NULL, DEFAULT `timezone('utc', now())`)

2. Relacje między tabelami

- `auth.users.id` ↔ `profiles.id` (relacja 1:1, kaskadowe usuwanie profilu po usunięciu konta).
- `profiles.id` ↔ `favorites.user_id` (relacja 1:N, kaskadowe usuwanie ulubionych po usunięciu profilu).
- `auth.users.id` ↔ `ai_queries.user_id` (relacja 1:N, przy usunięciu konta dane są anonimizowane przez `ON DELETE SET NULL`).
- `pokemon_cache` i `moves_cache` są niezależnymi tabelami cache'ującymi dane zewnętrzne.

3. Indeksy

- `profiles_created_at_idx` na `profiles(created_at DESC)` — wsparcie dla sortowania profili po dacie utworzenia.
- `favorites_user_idx` na `favorites(user_id)` — szybkie pobieranie ulubionych użytkownika.
- `favorites_pokemon_idx` na `favorites(pokemon_id)` — analiza popularności pokemonów.
- `favorites_created_at_idx` na `favorites(created_at DESC)` — timeline ulubionych.
- `pokemon_cache_cached_at_idx` na `pokemon_cache(cached_at DESC)` — wykrywanie nieświeżych wpisów cache.
- `moves_cache_cached_at_idx` na `moves_cache(cached_at DESC)` — analogicznie dla ruchów.
- `ai_queries_user_idx` na `ai_queries(user_id, created_at DESC)` — historia zapytań użytkownika.
- `ai_queries_success_created_at_idx` na `ai_queries(created_at DESC)` WHERE `success IS TRUE` — raportowanie skutecznych odpowiedzi.

4. Zasady PostgreSQL (RLS i funkcje)

- **profiles**
  - RLS włączone.
  - Polityki: `select` i `update` tylko dla właściciela (`auth.uid() = id`), `all` dla roli serwisowej.
  - Funkcja `public.handle_updated_at()` + trigger `trigger_profiles_updated_at` automatycznie aktualizują `updated_at`.
- **favorites**
  - RLS włączone.
  - Polityki: zarządzanie (`using`/`with check`) tylko przez właściciela (`auth.uid() = user_id`), pełen dostęp dla roli serwisowej.
- **pokemon_cache** i **moves_cache**
  - RLS włączone.
  - Polityki: publiczne odczyty (`using (true)`), modyfikacje tylko przez rolę serwisową.
- **ai_queries**
  - RLS włączone.
  - Polityki: użytkownik może czytać własne rekordy (`auth.uid() = user_id`), rola serwisowa odpowiada za insert i pełny odczyt.
- Wymagane rozszerzenie: `pgcrypto` (dla `gen_random_uuid()`).

5. Dodatkowe uwagi

- `pokemon_cache` i `moves_cache` są odświeżane przez edge functions; aplikacja traktuje je jako tylko-do-odczytu.
- `ai_queries` przechowuje pełny prompt i odpowiedź, więc pamiętaj o sanetyzacji danych po stronie backendu przed zapisem.
- Obecny schemat nie tworzy automatycznie rekordów profilu — wymagane jest wywołanie funkcji serwisowej po rejestracji (do rozważenia w kolejnych iteracjach).
- Potencjalne rozszerzenie: dedykowana tabela statystyk AI (np. `ai_recognition_stats`) może zostać dodana w przyszłości, jeśli potrzebne będą szczegółowe metryki feedbacku.
