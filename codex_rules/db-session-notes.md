# Database Planning Summary - 10x-poke-sky MVP

## Decisions Made

1. **Model użytkownika**: Minimalna tabela `profiles` z podstawowymi danymi (id, email, created_at, updated_at), przy wykorzystaniu Supabase Auth do zarządzania autentykacją.

2. **Ulubione pokemony**: Przechowywanie tylko referencji do PokeAPI (pokemon_id, pokemon_name, pokemon_sprite_url) zamiast pełnych danych pokemona.

3. **Indeksowanie favorites**: Unikalny złożony indeks na (user_id, pokemon_id), indeks na user_id i created_at.

4. **Historia czatu AI**: Brak przechowywania historii konwersacji - tylko statystyki trafności rozpoznawania.

5. **Cache danych PokeAPI**: Brak cache'owania w bazie danych - wykorzystanie localStorage po stronie frontendu.

6. **Row Level Security**: Implementacja polityk RLS dla tabeli favorites (view, insert, delete tylko własne rekordy).

7. **Walidacja pokemon_id**: Constraint CHECK zapewniający, że pokemon_id mieści się w zakresie 1-1025.

8. **Strategia usuwania**: Hard delete dla favorites - brak soft delete z deleted_at.

9. **Limity ulubionych**: Brak limitów na liczbę ulubionych pokemonów dla pojedynczego użytkownika.

10. **Migracje**: Wykorzystanie wbudowanego systemu migracji Supabase z plikami SQL w folderze migrations.

11. **Timezone**: Użycie timestamptz (timestamp with time zone) z przechowywaniem w UTC.

12. **Auto-update timestamps**: Trigger automatycznie aktualizujący updated_at przy zmianach w tabelach.

13. **Sesje użytkownika**: Supabase Auth zarządza sesjami JWT automatycznie - brak osobnej tabeli.

14. **Audit log**: Brak logowania akcji użytkowników na tym etapie MVP.

15. **Statystyki AI - struktura**: Tabela `ai_recognition_stats` ze szczegółowymi metrykami (user_description, suggested_pokemon_ids, selected_pokemon_id, was_correct, response_time_ms, model_used).

16. **Statystyki anonimowe**: Zbieranie statystyk AI również od niezalogowanych użytkowników (user_id nullable).

17. **Indeksowanie statystyk AI**: Indeksy na created_at, model_used, was_correct, częściowy na user_id, GIN na suggested_pokemon_ids.

18. **Retention statystyk**: Brak limitów czasowych dla MVP - każdy rekord jest cenny.

19. **Feedback AI**: Implementacja zarówno implicit feedback (selected_pokemon_id) jak i **explicit feedback** - użytkownik może oznaczyć czy sugestia była trafna.

20. **Privacy**: Temat pomijany na potrzeby MVP edukacyjnego.

21. **Rate limiting**: Mechanizm blokady konwersacji zaimplementowany i gotowy do włączenia w razie potrzeby, ale domyślnie wyłączony dla zaufanych użytkowników MVP.

22. **Monitoring kosztów AI**: Brak śledzenia tokenów i kosztów API na tym etapie.

23. **Materialized views**: Brak dla MVP ze względu na małą liczbę rekordów.

24. **Struktura suggested_pokemon_ids**: Prosta tablica integer[] bez dodatkowych metadanych.

25. **Tabela profiles**: Osobna minimalna tabela oprócz auth.users dla łatwiejszych JOIN-ów.

26. **ON DELETE CASCADE**: CASCADE dla favorites, SET NULL dla ai_recognition_stats (zachowanie zanonimizowanych statystyk).

27. **Auto-tworzenie profilu**: Trigger automatycznie tworzący rekord w profiles przy rejestracji nowego użytkownika.

28. **Walidacja email**: Brak duplikowania walidacji - Supabase Auth już to obsługuje.

---

## Matched Recommendations

1. **Architektura trójtabelowa**: System oparty na trzech głównych tabelach - `profiles`, `favorites`, `ai_recognition_stats` z wykorzystaniem Supabase Auth dla autentykacji.

2. **Minimalizacja redundancji danych**: Przechowywanie tylko niezbędnych referencji do zewnętrznych źródeł (PokeAPI), unikanie duplikowania danych które można pobrać on-demand.

3. **Kompleksowe indeksowanie**: Strategiczne indeksy dla optymalizacji najczęstszych zapytań (user_id, pokemon_id, created_at, model_used, was_correct).

4. **Row Level Security**: Pełna implementacja polityk RLS zapewniających, że użytkownicy mają dostęp tylko do własnych danych.

5. **Automatyzacja przez triggery**: Wykorzystanie triggerów PostgreSQL do automatycznego zarządzania timestamps i tworzenia powiązanych rekordów.

6. **Explicit + Implicit feedback loop**: Dwupoziomowy system zbierania informacji o trafności AI - automatyczny (selected_pokemon_id) i manualny (was_correct).

7. **Privacy-first cascade rules**: Inteligentne zasady ON DELETE - usuwanie danych osobowych (favorites) przy zachowaniu zanonimizowanych statystyk (ai_recognition_stats).

8. **Postgres advanced features**: Wykorzystanie zaawansowanych funkcji PostgreSQL (CHECK constraints, GIN indexes dla arrays, JSONB dla przyszłej rozbudowy).

9. **Rate limiting readiness**: Architektura gotowa na włączenie rate limiting bez zmian w schemacie bazy danych.

10. **Scalability considerations**: Schema zaprojektowany z myślą o łatwej rozbudowie (nullable fields, JSONB support, materialized views w przyszłości).

---

## Database Planning Summary

### Główne wymagania schematu bazy danych

Projekt wymaga prostej, ale dobrze zaprojektowanej bazy danych PostgreSQL w Supabase, która obsłuży:

1. **Zarządzanie użytkownikami** - minimalna tabela profiles zintegrowana z Supabase Auth
2. **Ulubione pokemony** - personalizowane listy ulubionych dla zalogowanych użytkowników
3. **Statystyki AI** - zbieranie metryk dotyczących trafności rozpoznawania pokemonów przez AI
4. **Bezpieczeństwo** - Row Level Security zapewniające izolację danych użytkowników
5. **Wydajność** - strategiczne indeksowanie dla szybkich zapytań

### Kluczowe encje i ich relacje

#### 1. Tabela `profiles`

**Cel**: Podstawowe dane użytkownika, połączenie z Supabase Auth

**Struktura**:
- `id` (UUID, PK, FK → auth.users.id)
- `email` (text, NOT NULL, unique)
- `created_at` (timestamptz, default NOW())
- `updated_at` (timestamptz, default NOW())

**Relacje**:
- 1:N z `favorites` (jeden użytkownik → wiele ulubionych)
- 1:N z `ai_recognition_stats` (jeden użytkownik → wiele statystyk, opcjonalne)

**Triggery**:
- Auto-tworzenie profilu przy rejestracji nowego użytkownika w auth.users
- Auto-update dla updated_at

#### 2. Tabela `favorites`

**Cel**: Przechowywanie ulubionych pokemonów użytkowników

**Struktura**:
- `id` (UUID, PK, default gen_random_uuid())
- `user_id` (UUID, FK → profiles.id, NOT NULL)
- `pokemon_id` (integer, NOT NULL, CHECK 1-1025)
- `pokemon_name` (text, NOT NULL)
- `pokemon_sprite_url` (text, NOT NULL)
- `created_at` (timestamptz, default NOW())

**Constraints**:
- UNIQUE (user_id, pokemon_id) - zapobiega duplikatom
- CHECK (pokemon_id > 0 AND pokemon_id <= 1025)
- FK user_id ON DELETE CASCADE

**Indeksy**:
- Unique composite index na (user_id, pokemon_id)
- Index na user_id
- Index na created_at

**RLS Policies**:
- SELECT: auth.uid() = user_id
- INSERT: auth.uid() = user_id
- DELETE: auth.uid() = user_id

#### 3. Tabela `ai_recognition_stats`

**Cel**: Zbieranie statystyk trafności rozpoznawania pokemonów przez AI

**Struktura**:
- `id` (UUID, PK, default gen_random_uuid())
- `user_id` (UUID, FK → profiles.id, NULLABLE)
- `user_description` (text, NOT NULL)
- `suggested_pokemon_ids` (integer[], NOT NULL)
- `selected_pokemon_id` (integer, NULLABLE)
- `was_correct` (boolean, NULLABLE) - **explicit feedback**
- `response_time_ms` (integer, NOT NULL)
- `model_used` (text, NOT NULL)
- `created_at` (timestamptz, default NOW())

**Constraints**:
- FK user_id ON DELETE SET NULL (zachowanie zanonimizowanych statystyk)

**Indeksy**:
- Index na created_at (analizy czasowe)
- Index na model_used (porównanie modeli)
- Index na was_correct (accuracy metrics)
- Partial index na user_id WHERE user_id IS NOT NULL
- GIN index na suggested_pokemon_ids (analiza często sugerowanych pokemonów)

**RLS Policies**:
- INSERT: true (wszyscy mogą dodawać, także niezalogowani)
- SELECT: auth.uid() = user_id OR user_id IS NULL (użytkownik widzi tylko swoje + anonimowe)
- UPDATE: auth.uid() = user_id (tylko dla explicit feedback)

### Ważne kwestie bezpieczeństwa

1. **Row Level Security (RLS)**: Włączone na wszystkich tabelach z precyzyjnymi politykami zapewniającymi izolację danych użytkowników.

2. **Hasła**: Zarządzane przez Supabase Auth (bcrypt), nie przechowywane w aplikacyjnej bazie danych.

3. **Sesje**: JWT tokens zarządzane automatycznie przez Supabase Auth.

4. **CASCADE rules**: Przemyślane zasady usuwania:
    - Favorites: CASCADE (usuwanie danych osobowych)
    - AI stats: SET NULL (zachowanie zanonimizowanych danych)

5. **Rate limiting**: Gotowość architektury na włączenie mechanizmu blokady nadmiernego użycia AI API (domyślnie wyłączone dla MVP).

6. **HTTPS**: Wymagane dla wszystkich połączeń (standard Supabase/Cloudflare).

### Kwestie skalowalności

1. **Indeksowanie**: Strategiczne indeksy przygotowane na wzrost liczby rekordów:
    - Composite indexes dla często łączonych warunków
    - GIN indexes dla array queries
    - Partial indexes dla selektywnych zapytań

2. **Brak cache'owania PokeAPI**: Dane pobierane on-demand, cache po stronie frontendu (localStorage).

3. **Przyszła rozbudowa**: Schema zaprojektowana z myślą o łatwej rozbudowie:
    - Nullable fields dla opcjonalnych danych
    - Możliwość dodania JSONB dla suggested_pokemons z confidence scores
    - Możliwość dodania materialized views dla agregacji statystyk

4. **Partycjonowanie**: Nie jest potrzebne dla MVP, ale możliwe w przyszłości dla tabeli ai_recognition_stats (partycjonowanie po created_at).

5. **Backup**: Supabase automatyczne daily backups wystarczające dla MVP.

### Integracje zewnętrzne

1. **PokeAPI** (https://pokeapi.co/): Główne źródło danych o pokemonach - brak mirrorowania w bazie danych.

2. **OpenRouter.ai**: Dostęp do modeli AI - brak przechowywania historii konwersacji, tylko statystyki.

3. **Supabase Auth**: Pełne zarządzanie autentykacją i autoryzacją użytkowników.

### Migracje i deployment

1. **System migracji**: Supabase migrations w folderze `supabase/migrations/`.

2. **Wersjonowanie**: Automatyczne przez Supabase CLI.

3. **CI/CD**: GitHub Actions z automatycznym uruchamianiem migracji przy deploy na Cloudflare Pages.

4. **Rollback**: Możliwość cofnięcia migracji przez Supabase CLI.

---

## Unresolved Issues

**Brak nierozwiązanych kwestii** - wszystkie punkty zostały omówione i zatwierdzone przez użytkownika. Projekt jest gotowy do wygenerowania finalnego schematu SQL z migracjami.

### Następne kroki

1. Wygenerowanie pełnych skryptów SQL dla wszystkich tabel, indeksów, constraints, triggerów i RLS policies
2. Przygotowanie plików migracji Supabase
3. Dokumentacja API endpoints korzystających z tych tabel
4. Konfiguracja Supabase CLI i połączenie z projektem

---

## Entity Relationship Diagram