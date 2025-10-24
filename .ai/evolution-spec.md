# Specyfikacja modułu Ewolucji Pokémonów

## 1. Zakres i cel
- Rozszerzenie aplikacji o pełny moduł prezentacji i eksploracji ewolucji Pokémonów, obejmujący widoki dla użytkowników niezalogowanych i zalogowanych.
- Konsolidacja danych ewolucyjnych z PokeAPI w spójny kontrakt API zgodny z `project-prd-codex.md`, tak aby detale pojawiły się zarówno na stronie szczegółowej Pokémona (`src/pages/pokemon/[identifier].astro`), jak i w dedykowanej zakładce `/evolutions`.
- Główne cele UX: szybkie zrozumienie drzew ewolucji, czytelne warunki przemian (poziom, przedmiot, pora dnia itd.), możliwość wizualizacji form (GIF lub PNG), CTA do logowania i dodawania ulubionych bez naruszania istniejących przepływów.

## 2. Architektura interfejsu użytkownika

### 2.1 Routing i layouty
- `src/pages/evolutions.astro` (layout `MainLayout`):
  - Przekształcić placeholder w SSR-ową stronę reagującą na query `pokemonId`, `chainId` oraz filtry (`type`, `generation`, `branching`).
  - Używa istniejącej nawigacji w stopce; nagłówek zawiera wyszukiwarkę i filtry.
  - Dla niezalogowanych: pełny wgląd w łańcuchy, CTA „Zaloguj się, aby zapisać drużynę” (link do `/auth/login`).
  - Dla zalogowanych: dodatkowy panel „Dodaj do ulubionych”/„Zapisz drużynę ewolucyjną” oparty o Supabase favorites.
- `src/pages/pokemon/[identifier].astro`:
  - Sekcję „Łańcuch ewolucji” zastąpić komponentem reagującym na nowy DTO (pozwala renderować graf, warunki i multimedia).
  - W SSR zachować istniejące pobieranie detali przez `fetchPokemonDetailFromEdge`, rozszerzając je o `evolutionStages`.
- `src/layouts/MainLayout.astro` i `src/layouts/AuthLayout.astro`: brak zmian funkcjonalnych; jedynie upewnić się, że nowa zakładka działa w obu trybach.

### 2.2 Struktura komponentów i odpowiedzialności
- **Komponenty Astro (server-side)**:
  - `evolutions.astro`: odpowiada za pobranie danych (patrz sekcja 3), przygotowanie SSR propsów, renderowanie skeletonów oraz przekazanie danych do komponentów React poprzez `client:load`.
  - `pokemon/[identifier].astro`: formatowanie treści, fallbacki błędów i przekazanie `detail.evolutions` do komponentów React.
- **Komponenty React (client-side)**:
  - `src/components/pokemon/evolution/PokemonEvolutionTimeline.tsx`: rozbudować o obsługę nowego kontraktu (`EvolutionChainDto`), wsparcie dla gałęzi bocznych przy użyciu layoutu kolumnowego i nowej listy `stages`.
    - Props: `chain`, `displayMode` (`"list" | "graph"`), `assetPreference` (`"gif" | "sprite"`), `onStageFocus`.
  - `src/components/pokemon/evolution/EvolutionStageCard.tsx` (nowy): renderuje pojedynczą formę (nazwa, asset, typy, poziom/przedmiot/fakty). Komponent ładuje asset przez `EvolutionAsset` (poniżej).
  - `src/components/pokemon/evolution/EvolutionAsset.tsx` (nowy): wybiera GIF/PNG na podstawie preferencji użytkownika i dostępności; fallback lokalny `public/images/pokemon/{id}.png`.
  - `src/components/pokemon/evolution/EvolutionBranchTabs.tsx` (nowy): UI do przełączania wariantów w łańcuchach rozgałęzionych (np. Eevee); korzysta z `useEvolutionStore`.
  - `src/components/forms/EvolutionSearchForm.tsx` (nowy): kontroluje wyszukiwarkę na stronie `/evolutions` (wpis + wybór generacji/typu). Walidacja i wysyłka query via `client:load` bez pełnego przeładowania.
  - `src/stores/useEvolutionStore.ts` (nowy Zustand): pamięta ostatnio wybrany łańcuch, preferencję assetów (gif/sprite), aktualnie fokusowany etap i flagę „showStatDiffs”. Stan synchronizowany z `localStorage` dla zalogowanego i niezalogowanego użytkownika.
- **Integracja z istniejącymi komponentami**:
  - `PokemonFavoriteAction` (`src/components/pokemon/PokemonFavoriteAction.tsx`): rozszerzyć, by móc zapisać wszystkie id z danej gałęzi (multi-add) w trybie zalogowanym.
  - `PokemonStatsPanel`: dodać opcjonalny `comparisonBaseline` (statystyki poprzedniej formy), jeśli użytkownik porusza się po timeline.
  - Komunikacja interkomponentowa: `PokemonEvolutionTimeline` emituje `onStageFocus` (id Pokémona), co wyzwala m.in. `EvolutionStatComparison` (opcjonalny nowy komponent) do pokazania różnicy statystyk.

### 2.3 Walidacja i komunikaty błędów
- Wyszukiwarka w `/evolutions`:
  - Minimalna długość 2 znaki; w przeciwnym razie komunikat „Wpisz przynajmniej 2 znaki, aby wyszukać łańcuch”.
  - Po braku wyników: „Nie znaleziono łańcucha dla podanych warunków. Spróbuj innego Pokémona lub filtrów”.
- Przełączniki assetów:
  - Gdy GIF niedostępny, banner info „Brak animacji – wyświetlamy sprite z Pokédexu”.
- Błędy backendowe: komponent `StatusBanner` (już istnieje w `src/components/pokemon/StatusBanner.tsx`) wykorzystać do zasygnalizowania `500/502/504`.
- Autoryzacja: jeśli użytkownik kliknie CTA zapisu drużyny będąc wylogowanym, `PokemonFavoriteAction` otwiera modal loginu (już obsługiwany w istniejącej logice auth).

### 2.4 Kluczowe scenariusze użytkownika
1. **Gość przegląda detale Pokémona**: timeline pokazuje kolejne formy, minimalne wymagania, możliwość przewinięcia; brak opcji zapisu drużyny (widoczne CTA logowania).
2. **Zalogowany użytkownik tworzy listę treningową**: przełącza gałęzie (np. formy Eevee), porównuje statystyki i zapisuje wszystkie formy jako ulubione (jedno kliknięcie).
3. **Ograniczona dostępność danych**: PokeAPI zwraca łańcuch bez szczegółów (np. brak `min_level`) – UI fallback na „Szczegóły wymagane: według PokeAPI brak danych”.
4. **Brak GIF-u**: moduł przełącza się na statyczny sprite, zachowując informację dla użytkownika.
5. **Przeglądanie listy ewolucji**: użytkownik filtruje po generacji i typie, wybiera jednego Pokémona ze slidera wyników i timeline aktualizuje się bez przeładowania strony.

## 3. Logika backendowa

### 3.1 Endpointy i kontrakty
- `GET /api/evolutions/chain` (nowy, `src/pages/api/evolutions/chain.ts`):
  - Query: `pokemonId` (liczba) **lub** `slug` (nazwa), opcjonalnie `branch` (identyfikator gałęzi), `includeSprites` (`bool`), `includeStatsDelta` (`bool`).
  - Zwraca `EvolutionChainDto` (poniżej) wraz z metadanymi cache.
- `GET /api/evolutions/highlight` (opcjonalny, do sekcji „polecane łańcuchy” na `/evolutions`):
  - Query: `limit`, `generation`. Wykorzystuje `pokemon_cache` + heurystyki popularności (np. dane z `favorites`).
- Rozszerzenie `GET /api/pokemon/details` (`src/pages/api/pokemon/details.ts`):
  - Dodaje `evolutionChain` (raw PokeAPI) oraz nową sekcję `evolutionStages` (lista stage DTO) oraz `evolutionBranches`.
- Rozszerzenie `GET /api/pokemon/summary`:
  - Możliwość pobrania `includeEvolution=true` aby dostarczyć uproszczonego DTO do komponentów listowych (np. karty w `/evolutions`).

### 3.2 Modele danych (rozszerzenie `src/types.ts`)
- `export interface EvolutionRequirementDto`:
  - Pola: `type` (`"level" | "item" | "trade" | "location" | "time" | "happiness" | "other"`), `value` (string), `meta` (`JsonRecord` na surowe dane).
- `export interface EvolutionStageDto`:
  - `pokemonId`, `name`, `order` (pozycja w łańcuchu), `branchId` (dla rozgałęzień), `spriteUrl`, `gifUrl`, `types`, `statSummary` (opcjonalnie `Attack`, `Defense`, `Speed`), `requirements: EvolutionRequirementDto[]`, `isBaby`, `isLegendary`.
- `export interface EvolutionChainDto`:
  - `chainId`, `rootPokemonId`, `stages: EvolutionStageDto[]`, `branches: Array<{ branchId: string; label: string; stageIds: number[] }>`; `source: "cache" | "pokeapi"`, `cachedAt`.
- Dodatkowe aliasy: `EvolutionAssetPreference = "gif" | "sprite"`.

### 3.3 Walidacja wejścia
- Użycie `zod` analogicznie do `src/pages/api/pokemon/summary.ts`:
  - Schema: `pokemonId` integer > 0, `slug` regex `^[a-z0-9-]+$`.
  - `includeSprites/includeStatsDelta` parsowane jako `boolean` (`"true"/"false"`).
  - Błąd 400 jeśli brak kluczowych parametrów lub naruszenie zakresów.
- `branch` musi istnieć w zbudowanej strukturze (`422 invalid_branch`).

### 3.4 Obsługa wyjątków i statusy
- `404`: brak łańcucha w cache i PokeAPI (np. błędny identyfikator).
- `424 failed_dependency`: błąd pobierania z PokeAPI (HTTP != 200).
- `429`: ochronić PokeAPI przez limitowanie (wspólne middleware, np. Upstash Redis; w ramach specyfikacji wskazać).
- `500`: błąd nieoczekiwany przy mapowaniu/serializacji (log w `console.error`, spójny JSON `error`, `message`).
- `meta.cacheTtlMs`: w odpowiedzi informuje o ważności; front-end może wymuszać odświeżenie przy starze > 24h.

### 3.5 Integracja z Supabase i caching
- `public.pokemon_cache`:
  - Uzupełnić `payload` o `evolution_chain` oraz `species.genera`.
  - Dodać kolumnę `evolution_branches JSONB` (lista stage DTO). Alternatywnie trzymać w `payload` i mapować po stronie API.
  - Supabase Edge Function `fetch-pokemon-details` aktualizuje nowy blok i zapisuje `cached_at`.
- `public.favorites`:
  - Bez zmian w schemacie, ale API `/api/users/me/favorites` przyjmuje wielokrotne ID (np. `POST { pokemonIds: number[] }`).
- Front-end: `useEvolutionStore` może korzystać z dynamicznych fetchy - preferujemy SSR + hydration, by uniknąć dodatkowych round-tripów.

### 3.6 Renderowanie server-side (Astro)
- `astro.config.mjs` pozostaje z `output: "server"`; nowy moduł korzysta z SSR w istniejącej konfiguracji Node adaptera.
- W `evolutions.astro`:
  - `await fetchEvolutionChainFromEdge(...)` (nowy helper w `src/lib/api/evolutions-service.ts`) wykonywany w sekcji frontmatter.
  - W przypadku błędu autoryzacji/ratelimit przekazywać `statusCode` do `Astro.response.status` jak w `pokemon/[identifier].astro`.
- Zapewnienie, że `client:load` używa `key` z `chainId`, aby poprawnie przeładowywać komponenty przy zmianie filtrów bez odmontowywania całej strony.

## 4. System ewolucji i integracja z PokeAPI

### 4.1 Pozyskiwanie danych
- Pipeline dla `GET /api/evolutions/chain`:
  1. Normalizacja parametru (`pokemonId` → slug/nazwa).
  2. Lokalne cache (Supabase `pokemon_cache` → `payload.evolution_chain`). Jeśli istnieje i świeże (`cached_at` < 24h), korzystamy.
  3. Jeśli brak/mimo `fresh=true`: pobranie z PokeAPI:
     - `GET /pokemon/{identifier}` → identyfikator + podstawowe dane (staty, typy).
     - `GET /pokemon-species/{id}` → `evolution_chain.url`, nazwy, flavor text.
     - `GET /evolution-chain/{chainId}` → struktura drzewa (`chain`).
  4. Zbudowanie mapy `pokemonId -> pokemonPayload` (dla całego drzewa) przez równoległe pobranie brakujących form (z kontrolą limitów).
- Obsługa branchy: dla każdego `ChainLink` generujemy unikalny `branchId` (np. ścieżka `root>child>`). W UI to etykieta.

### 4.2 Transformacja i caching
- Normalizacja do `EvolutionStageDto`:
  - `order`: BFS, zaczynając od 0 dla formy startowej; `branchId` odpowiada ścieżce.
  - `requirements`: generowane z `EvolutionDetail` (np. `min_level` → `{ type: "level", value: "16" }`, `item` → nazwa zamieniona na tytuł `Sun Stone`).
  - `statSummary`: z `pokemon.stats` (HP, Atk, Def, SpA, SpD, Spe) – front-end może obliczać różnicę do formy poprzedniej.
  - `types`: `pokemon.types` (listy stringów).
- Cache warstwy serwerowej:
  - Supabase: `pokemon_cache` przechowuje JSON stage'ów, aby API nie wykonywało kolejnych żądań do PokeAPI.
  - Astro edge route: można dodać w `Response` nagłówek `Cache-Control: s-maxage=300` dla CDN.
  - Po stronie klienta `useEvolutionStore` przechowuje ostatnio pobrany `EvolutionChainDto` (in-memory + `sessionStorage`).

### 4.3 Zarządzanie assetami (GIF/PNG)
- Kolejność źródeł:
  1. Lokalne GIF-y (`public/media/pokemon/gif/{id}.gif`) – import do repo po weryfikacji licencji. Źródła typu `pokelife.pl` wymagają sprawdzenia praw – jeśli brak jasnej licencji, przygotować fallback plan: własny sprite sheet lub odwołanie do open-source sprite'ów (np. `pokeapi/sprites` repo).
  2. Supabase Storage bucket `pokemon_media` (CDN) jako alternatywa dla ciężkich GIF-ów; front-end otrzymuje signed URL via `/api/evolutions/assets`.
  3. Oficjalne arty PokeAPI (`sprites.other["official-artwork"].front_default`).
  4. Standardowe sprite'y `front_default`.
- `EvolutionAsset` sprawdza kolejność asynchronicznie, pokazując skeleton i fallback (komunikat). Wynik cache'owany w `localStorage` per `pokemonId+assetType`.
- Dodatkowy przełącznik UI „Preferuj animacje” zapisuje się w `useEvolutionStore` i synchronizuje z profilem użytkownika (`profiles.metadata.evolutionMedia = "gif" | "sprite"`).

### 4.4 Wydajność, testy i monitoring
- **Wydajność**:
  - Limit równoczesnych żądań do PokeAPI (np. 3 równoległe) z wykorzystaniem `Promise.allSettled`.
  - W API dodać prostą kolejkę (Semaphore) aby unikać 429.
  - W UI lazy-load GIF-ów poza viewportem (IntersectionObserver w `EvolutionAsset`).
- **Testy**:
  - Jednostkowe: mapowanie `EvolutionDetail -> EvolutionRequirementDto`, rendering `PokemonEvolutionTimeline` dla scenariuszy rozgałęzionych (aktualizacja istniejących testów w `src/components/pokemon/evolution/__tests__`).
  - Integracyjne: kontrakt `GET /api/evolutions/chain` w Vitest + MSW (mock PokeAPI).
  - E2E (Playwright): scenariusz dla `/evolutions` (wyszukiwanie Bulbasaur, sprawdzenie timeline, CTA logowania dla gościa).
- **Monitoring**:
  - Logi w API: `console.warn` przy brakach assetów, `console.error` dla błędów PokeAPI z id żądania.
  - Promować metryki Supabase (np. liczba odświeżeń cache) do `api-plan.md` → `GET /api/admin/health` (rozszerzenie o `evolutionChainStaleCount`).

## 5. Zależności, migracje i ryzyka
- Migracja Supabase: dodać kolumnę `evolution_branches JSONB` oraz indeks po `pokemon_id` (utrzymać spójność z `types.ts`).
- Ryzyko licencyjne GIF-ów – wymagane zatwierdzenie źródeł przed importem; w razie braku zgody fallback do PNG.
- Limit rate PokeAPI (100 req/min). Rozwiązanie: caching + plan awaryjny „dane nieaktualne” z UI ostrzeżeniem.
- Utrzymanie spójności DTO po zmianie PokeAPI – dodać typowe guardy (np. `if (!chain?.chain)` + fallback).
- Nie naruszamy istniejących przepływów: endpointy `/api/pokemon/**` pozostają kompatybilne, a dodane pola są opcjonalne (front-end sprawdza `detail.evolutionStages ?? []`).

