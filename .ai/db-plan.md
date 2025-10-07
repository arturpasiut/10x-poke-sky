1. Lista tabel z ich kolumnami, typami danych i ograniczeniami
- **profiles**
  - `id` (`uuid`, PRIMARY KEY, FOREIGN KEY → `auth.users.id`, NOT NULL, ON DELETE CASCADE)
  - `email` (`text`, NOT NULL, UNIQUE)
  - `created_at` (`timestamptz`, NOT NULL, DEFAULT `now()`)
  - `updated_at` (`timestamptz`, NOT NULL, DEFAULT `now()`)
  - Ograniczenia: `PRIMARY KEY (id)`, `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`, `UNIQUE (email)`
- **favorites**
  - `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
  - `user_id` (`uuid`, NOT NULL, FOREIGN KEY → `profiles.id`, ON DELETE CASCADE)
  - `pokemon_id` (`integer`, NOT NULL, CHECK `pokemon_id BETWEEN 1 AND 1025`)
  - `pokemon_name` (`text`, NOT NULL)
  - `pokemon_sprite_url` (`text`, NOT NULL)
  - `created_at` (`timestamptz`, NOT NULL, DEFAULT `now()`)
  - `updated_at` (`timestamptz`, NOT NULL, DEFAULT `now()`)
  - Ograniczenia: `PRIMARY KEY (id)`, `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE`, `UNIQUE (user_id, pokemon_id)`
- **ai_recognition_stats**
  - `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
  - `user_id` (`uuid`, NULLABLE, FOREIGN KEY → `profiles.id`, ON DELETE SET NULL)
  - `user_description` (`text`, NOT NULL)
  - `suggested_pokemon_ids` (`integer[]`, NOT NULL, CHECK `cardinality(suggested_pokemon_ids) > 0`)
  - `selected_pokemon_id` (`integer`, NULLABLE)
  - `was_correct` (`boolean`, NULLABLE)
  - `response_time_ms` (`integer`, NOT NULL, CHECK `response_time_ms >= 0`)
  - `model_used` (`text`, NOT NULL)
  - `created_at` (`timestamptz`, NOT NULL, DEFAULT `now()`)
  - Ograniczenia: `PRIMARY KEY (id)`, `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL`

2. Relacje między tabelami
- Jeden rekord `auth.users` jest powiązany 1:1 z `profiles.id` (ON DELETE CASCADE).
- Jeden profil (`profiles.id`) posiada wiele ulubionych wpisów (`favorites.user_id`) w relacji 1:N z kasowaniem kaskadowym.
- Jeden profil (`profiles.id`) może posiadać wiele statystyk AI (`ai_recognition_stats.user_id`) w relacji 1:N, przy czym usunięcie profilu ustawia `user_id` na `NULL`.
- Rekordy `ai_recognition_stats` mogą należeć także do użytkowników anonimowych (`user_id` = `NULL`), co pozwala na przechowywanie danych bez profilu.

3. Indeksy
- `profiles_email_key` (UNIQUE) — wymusza unikalność adresów e-mail.
- `profiles_created_at_idx` na `profiles(created_at)` — wspiera chronologiczne zapytania administracyjne.
- `favorites_user_pokemon_key` (UNIQUE) na `favorites(user_id, pokemon_id)` — zapobiega duplikatom ulubionych.
- `favorites_user_id_idx` na `favorites(user_id)` — przyspiesza listowanie ulubionych użytkownika.
- `favorites_created_at_idx` na `favorites(created_at)` — wspiera sortowanie po dacie dodania.
- `ai_recognition_stats_created_at_idx` na `ai_recognition_stats(created_at)` — analizy trendów w czasie.
- `ai_recognition_stats_model_used_idx` na `ai_recognition_stats(model_used)` — porównania modeli.
- `ai_recognition_stats_was_correct_idx` na `ai_recognition_stats(was_correct)` — raporty trafności.
- `ai_recognition_stats_user_id_partial_idx` na `ai_recognition_stats(user_id)` WHERE `user_id IS NOT NULL` — selektywne zapytania po zalogowanych użytkownikach.
- `ai_recognition_stats_suggested_ids_gin_idx` na `ai_recognition_stats USING GIN (suggested_pokemon_ids)` — filtrowanie po sugerowanych pokemonach.

4. Zasady PostgreSQL (RLS i funkcje)
- **profiles**
  - RLS: `FOR SELECT USING (id = auth.uid())`; `FOR UPDATE USING (id = auth.uid())`.
  - RLS: `FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id)` — umożliwia automatyczne tworzenie profilu po rejestracji.
  - Trigger `set_updated_at()` uaktualnia `updated_at` przy każdej modyfikacji.
  - Trigger `handle_new_user()` (AFTER INSERT na `auth.users`) zakłada rekord w `profiles` z kopiowanym `id` i `email`.
- **favorites**
  - RLS: `FOR SELECT USING (auth.uid() = user_id)`.
  - RLS: `FOR INSERT WITH CHECK (auth.uid() = user_id)`.
  - RLS: `FOR UPDATE USING (auth.uid() = user_id)`.
  - RLS: `FOR DELETE USING (auth.uid() = user_id)`.
  - Trigger `set_updated_at()` aktualizuje `updated_at`.
- **ai_recognition_stats**
  - RLS: `FOR INSERT WITH CHECK (true)` — pozwala również użytkownikom anonimowym zapisywać statystyki.
  - RLS: `FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL)`.
  - RLS: `FOR UPDATE USING (auth.uid() = user_id)` — umożliwia zalogowanym użytkownikom oznaczenie trafności rekomendacji.
  - Opcjonalne `FOR DELETE` może być ograniczone do roli serwisowej, jeżeli wymagane.
- Funkcja narzędziowa `set_updated_at()` oraz wyzwalacze wymagają rozszerzenia `pgcrypto` dla `gen_random_uuid()` i ewentualnie `uuid-ossp` zależnie od konfiguracji.

5. Dodatkowe uwagi
- Włączenie RLS: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` dla wszystkich tabel publicznych.
- Zapewnij `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (oraz `uuid-ossp` jeżeli preferowane), zanim zaczniesz korzystać z `gen_random_uuid()`.
- Funkcja `handle_new_user()` powinna działać jako `SECURITY DEFINER`, aby ominąć RLS podczas automatycznego tworzenia profilu po rejestracji w Supabase.
- `pokemon_name` i `pokemon_sprite_url` są przechowywane jako referencje do PokeAPI — pełne dane pobierane są on demand przez frontend.
- Rozszerzenia schematu (np. dodatkowe metadane AI lub cache danych PokeAPI) mogą zostać dodane później bez naruszania integralności dzięki aktualnemu projektowi.
