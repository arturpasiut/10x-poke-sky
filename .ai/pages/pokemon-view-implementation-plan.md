# Plan implementacji widoku Lista Pokémonów (Pokédex)

## 1. Przegląd

Widok Pokédex na ścieżce `/pokemon` nawiązuje do przedstawionego zrzutu ekranu: tło w ciemnym motywie, wyeksponowany pasek wyszukiwania w formie pilowej kapsuły z ikoną lupy, nagłówek „Pokédex” oraz równy grid prostokątnych kart z szerokimi paddingami, zaokrąglonymi narożnikami i gradientowymi tłami dostosowanymi do typu Pokémona. Każda karta prezentuje duży sprite na środku, nazwę poniżej oraz numer Pokédexu w postaci hashu, z zachowaniem responsywnego układu (3 kolumny na desktop, 2 na tablet, 1 na mobile). Widok obsługuje wyszukiwanie, późniejszą rozbudowę o filtry, sortowanie i paginację, zapewnia skeletony w stylu kart oraz empty/error states zgodne z PRD.

## 2. Routing widoku

- Astro route `src/pages/pokemon/index.astro` pozostaje pojedynczym punktem wejścia.
- Strona renderuje layout `MainLayout` i montuje komponent React `PokemonListingView` w slocie treści.
- Nawigacja do szczegółów Pokémonów wykorzystuje istniejącą podstronę `src/pages/pokemon/[identifier].astro`.

## 3. Struktura komponentów

- `PokemonListingView`
  - `SearchHeader`
  - `ToolbarRow`
    - `FilterChips` (gdy dodane filtry)
    - `SortBar`
  - `ContentSwitch`
    - `ListSkeleton`
    - `ErrorCallout`
    - `EmptyStateWithAI`
    - `PokemonGrid`
      - `PokemonCard` ×N
  - `PaginationControls`

## 4. Szczegóły komponentów

### PokemonListingView

- Opis: Kontroler widoku; spina store, synchronizuje URL, uruchamia zapytania i przekazuje dane do komponentów prezentacyjnych.
- Główne elementy: wrapper `section`, układ `div` z gridem, dzieci opisane wyżej.
- Obsługiwane interakcje: inicjalizacja stanu z URL, reakcja na zmiany store, obsługa re-fetch (retry).
- Obsługiwana walidacja: sanityzacja parametrów (page ≥1, pageSize ≤96, sort/order dozwolone wartości), fallback na defaulty.
- Typy: `PokemonListQueryState`, `PokemonListResponseDto`, `PokemonSummaryViewModel`.
- Propsy: brak (dane pobierane wewnętrznie).

### SearchHeader

- Opis: Pasek wyszukiwarki nad wynikami z licznikami i przyciskiem resetowania.
- Główne elementy: `form`, `input[type="search"]`, przycisk submit, przycisk reset.
- Obsługiwane interakcje: submit (aktualizacja `search`, reset (clear search & page)).
- Obsługiwana walidacja: długość wyszukiwania ≤100 znaków, usuwanie białych znaków.
- Typy: `SearchHeaderProps` z polami `search`, `total`, `onSearchChange`, `onSubmit`, `onReset`.

### FilterChips

- Opis: Lista aktywnych filtrów w formie chipów z możliwością usuwania pojedynczych wartości.
- Główne elementy: `ul` z `li` + `button`.
- Obsługiwane interakcje: usuwanie filtra, przycisk „Wyczyść wszystko”.
- Obsługiwana walidacja: pokazywanie tylko filtrów istniejących w stanie; brak duplikatów.
- Typy: `FilterChipViewModel`, `FilterChipsProps`.

### SortBar

- Opis: Pasek sortowania zawierający `select` z polami sort oraz przycisk zmiany kierunku.
- Główne elementy: `label`, `select`, `button` z ikoną strzałki.
- Obsługiwane interakcje: zmiana opcji sortowania, przełączanie `order`.
- Obsługiwana walidacja: dozwolone wartości `name | pokedex | cachedAt`, `order` w `asc | desc`.
- Typy: `SortOption`, `SortBarProps`.

### StatusBanner

- Opis: Opcjonalny komponent informacyjny (np. limit wyników, ostrzeżenia).
- Główne elementy: `div` z ikoną i treścią.
- Obsługiwane interakcje: przycisk zamknięcia (opcjonalnie).
- Obsługiwana walidacja: brak (treść otrzymywana z logiki).
- Typy: `StatusBannerProps`.

### ListSkeleton

- Opis: Placeholder grid podczas ładowania.
- Główne elementy: `div` grid z `div` skeleton.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak (statyczny).

### ErrorCallout

- Opis: Sekcja błędu z ikoną, komunikatem i przyciskiem „Spróbuj ponownie”.
- Główne elementy: `div`, `p`, `button`.
- Obsługiwane interakcje: retry triggers fetch.
- Obsługiwana walidacja: mapowanie kodów błędów (400, 429, 500).
- Typy: `ErrorCalloutProps` (`code`, `message`, `onRetry`).

### EmptyStateWithAI

- Opis: Empty state z obrazkiem/ikoną, copy i CTA do czatu AI.
- Główne elementy: `section`, `p`, `button/link`.
- Obsługiwane interakcje: CTA otwiera `/ai` lub inny moduł.
- Obsługiwana walidacja: brak.
- Typy: `EmptyStateProps` (`variant`, `ctaLabel`, `onCta`).

### PokemonGrid

- Opis: Grid kart o stałej wysokości i szerokości, z przerwami typu `gap-4`, z ciemnym tłem (#0f151c) oraz kartami w układzie 1/2/3 kolumn zależnie od `sm`/`lg`.
- Główne elementy: `div` z klasami `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4`.
- Obsługiwane interakcje: brak (deleguje do kart).
- Obsługiwana walidacja: brak.
- Typy: `PokemonGridProps` (`items: PokemonSummaryViewModel[]`).

### PokemonCard

- Opis: Rozciągnięta karta łącząca duży sprite, gradientowe tło bazujące na typie (np. `from-emerald-600 to-emerald-800`) i minimalną treść tekstową – nazwa i hash numeru.
- Główne elementy: `article` z klasami `relative flex h-72 flex-col justify-end rounded-3xl border border-black/20 bg-gradient-to-br p-6 shadow-card transition hover:-translate-y-1`, `img` `class="absolute inset-x-0 top-6 mx-auto w-48 h-48 object-contain drop-shadow-lg"`, `h3`, `p` z numerem (#001).
- Obsługiwane interakcje: kliknięcie (nawigacja do `/pokemon/[identifier]`), focus ring `outline-brand`.
- Obsługiwana walidacja: alt text, fallback sprite (placeholder) gdy `spriteUrl` null, poprawne formatowanie numeru (`formatDexNumber(pokemonId)`).
- Typy: `PokemonCardProps` (`pokemon: PokemonSummaryViewModel`).

### PaginationControls

- Opis: Kontrolki nawigacji po stronach z informacją o bieżącej stronie i liczbie stron.
- Główne elementy: `nav`, przyciski „Poprzednia/Następna”, przycisk/datalist numeru strony.
- Obsługiwane interakcje: zmiana strony (±1, skok do numeru).
- Obsługiwana walidacja: page ≥1, page ≤pageCount, wyłączenie przycisków gdy brak możliwości.
- Typy: `PaginationViewModel`, `PaginationControlsProps`.

## 5. Typy

- `PokemonListQueryState`: `{ search: string; types: string[]; generation: string | null; region: string | null; sort: "pokedex" | "name" | "cachedAt"; order: "asc" | "desc"; page: number; pageSize: number; }`.
- `PokemonListQueryDto`: serializowana wersja state (bez nulli, mapowanie na query params).
- `PokemonListQueryFilters`: subset typu (bez metadanych).
- `PokemonSummaryViewModel`: rozszerza `PokemonSummaryDto` o `displayName: string`, `typeBadges: Array<{ name: string; color: string }>` , `spriteAlt: string`, `routeHref: string`.
- `PokemonAvailableFilters`: `{ types: FilterOption[]; generations: FilterOption[]; regions: FilterOption[]; }`.
- `FilterOption`: `{ value: string; label: string; count?: number; icon?: string }`.
- `FilterChipViewModel`: `{ id: string; label: string; onRemove(): void }`.
- `SortOption`: `{ value: PokemonSortKey; label: string; description?: string; }`.
- `PaginationViewModel`: `{ page: number; pageSize: number; total: number; hasNext: boolean; pageCount: number; hasPrevious: boolean; }`.
- `ApiError`: `{ code: number; message: string; details?: string; retryAfterMs?: number; }`.

## 6. Zarządzanie stanem

- `usePokemonSearchStore` (Zustand):
  - Stan: `PokemonListQueryState`.
  - Akcje: `initialiseFromUrl(params)`, `setSearch(value)`, `toggleType(value)`, `setGeneration(value|null)`, `setRegion(value|null)`, `setSort(value)`, `toggleOrder()`, `setPage(page)`, `resetFilters()`, `resetAll()`.
  - Efekt: `subscribe` aktualizuje URL (via `history.replaceState`) i triggery fetchu.
- `usePokemonListQuery` hook:
  - Wejście: `PokemonListQueryState`.
  - Stan: `{ status: "idle"|"loading"|"success"|"error"; data?: PokemonListResponseDto; error?: ApiError; }`.
  - Implementacja: `useEffect` z `AbortController`, fetch `/api/pokemon?{query}`, serializacja poprzez helper.
  - Zwraca `retry()` i `isFetching`.
- `useFilterOptions` hook:
  - Zapewnia statyczne listy typów/generacji/regionów (z mapy lub importu), lub fetchuje z `/api/metadata`.
  - Zwraca `PokemonAvailableFilters`, statusy ładowania.
- `useFocusTrap` dla `MobileFilterDrawer` (opcjonalnie reużywalny).

## 7. Integracja API

- Endpoint: `GET /api/pokemon`.
- Zapytania:
  - Parametry budowane na podstawie `PokemonListQueryState` (pomijamy null/empty).
  - `search` (trim, lower-case), `type` (powtarzalne), `generation`, `region`, `sort`, `order`, `page`, `pageSize`.
- Odpowiedź: `PokemonListResponseDto` (z `src/types.ts`).
- Obsługa:
  - Sukces: mapowanie `items` -> `PokemonSummaryViewModel`, obliczanie `PaginationViewModel`.
  - Błędy: 400 -> invalid filters (reset?), 429 -> throttle (wyświetl retry info, ewentualnie disable retry na X sekund), 500 -> info i `retry`.
- Retry: `ErrorCallout` wywołuje `retry`.
- Cache: brak dedykowanego, rely on store; w przyszłości ewentualnie dodać `sessionStorage`.

## 8. Interakcje użytkownika

- Wpisanie tekstu w wyszukiwarkę (submit ENTER lub debounce) → `setSearch` → `setPage(1)` → fetch.
- Kliknięcie „Wyczyść wyszukiwarkę” → `resetAll`.
- Zaznaczenie filtra typu/generacji/regionu → aktualizacja store → `setPage(1)` → fetch.
- Kliknięcie „Reset filtrów” → `resetFilters` → fetch.
- Otworzenie mobilnego panelu → `setDrawerOpen(true)`; zamknięcie (przycisk/ESC/overlay).
- Zmiana sortowania/kierunku → `setSort`/`toggleOrder` → `setPage(1)` → fetch.
- Kliknięcie „Poprzednia/Następna” w paginacji → `setPage(page ± 1)` → fetch.
- Ręczne wpisanie numeru strony (jeśli dostępne) → walidacja -> fetch.
- Kliknięcie karty Pokémona → nawigacja `href` do `/pokemon/[identifier]`.
- Kliknięcie CTA w empty state → nawigacja do modułu AI (`/ai`).
- Kliknięcie „Spróbuj ponownie” w błędzie → `retry`.

## 9. Warunki i walidacja

- Parametry wyszukiwania:
  - `search`: max 100 znaków, trim, lower-case, nie wysyłamy pustych.
  - `types`: wartości tylko z predefiniowanej listy; limit 3 (opcjonalny).
  - `generation`: `null` lub jeden z `generation-i` … `generation-ix`.
  - `region`: `null` lub `kanto` … (lista zdefiniowana).
  - `sort`: `pokedex | name | cachedAt`.
  - `order`: `asc | desc`.
  - `page`: ≥1; reset do 1 przy zmianach filtrów; weryfikacja `page <= pageCount` po odpowiedzi.
  - `pageSize`: jedna z `[24, 48, 96]` (UI default 24); uniemożliwienie większych wartości.
- UI walidacja:
  - Blokada przycisku „Poprzednia” gdy `page === 1`.
  - Blokada „Następna” gdy `!hasNext`.
  - Focus management w `MobileFilterDrawer` (trap, powrót focusu).
  - `aria-expanded`/`aria-controls` w przyciskach filtrów, `aria-busy` w sekcji wyników podczas fetchu.

## 10. Obsługa błędów

- 400 (invalid filters): pokaż ostrzeżenie z sugestią resetu; automatycznie przywróć ostatnie poprawne parametry.
- 429 (Too Many Requests): wyświetl komunikat o limitach, zablokuj przycisk retry na `retryAfter` lub 5 s.
- 500 (Internal Error): ogólny komunikat, CTA retry.
- Brak połączenia/offline: rozpoznaj `TypeError`/`navigator.onLine`, pokaż info i opcję odświeżenia.
- Puste wyniki: `EmptyStateWithAI` z CTA „Zapytaj AI”.
- Fallback sprite: gdy `spriteUrl` null, użyj placeholdera i alt „Sprite niedostępny”.

## 11. Kroki implementacji

1. Zdefiniuj stałe i helpery (`src/lib/pokemon/filters.ts`, `src/lib/pokemon/query.ts`) do mapowania parametrów i list filtrów.
2. Utwórz Zustand store `usePokemonSearchStore` (`src/stores/usePokemonSearchStore.ts`) z akcjami i serializacją do URL.
3. Zaimplementuj hook `usePokemonListQuery` (`src/hooks/usePokemonListQuery.ts`) obsługujący fetch, abort i mapowanie na view models.
4. Przygotuj hook `usePokemonFilterOptions` (`src/hooks/usePokemonFilterOptions.ts`) zwracający listy typ/generacja/region (na początek statyczne).
5. Zaktualizuj `src/pages/pokemon/index.astro`, aby montować `PokemonListingView` (React) i przekazać layout metadata (tytuł, meta).
6. Utwórz katalog komponentów `src/components/pokemon/` i zaimplementuj `PokemonListingView.tsx` plus komponenty podrzędne (`SearchHeader.tsx`, `FilterSidePanel.tsx`, `MobileFilterDrawer.tsx`, `FilterChips.tsx`, `SortBar.tsx`, `StatusBanner.tsx`, `ListSkeleton.tsx`, `ErrorCallout.tsx`, `EmptyStateWithAI.tsx`, `PokemonGrid.tsx`, `PokemonCard.tsx`, `PaginationControls.tsx`).
7. Dodaj style Tailwind (utility classes) i ewentualne klasy pomocnicze w `src/styles/pokemon.css` lub poprzez klasy w komponentach.
8. Zaimplementuj synchronizację stanu z URL w `PokemonListingView` (on mount parse `window.location.search`, subscribe store -> update `history.replaceState`).
9. Zaimplementuj logikę reagowania na interakcje (onSearchSubmit, toggle filters, pagination) zgodnie z akcjami store, w tym reset page.
10. Wprowadź obsługę błędów i skeletonów w `PokemonListingView` (switch na `status` hooka).
11. Dodaj testy jednostkowe (Vitest + RTL) dla kluczowych komponentów (np. `SearchHeader`, `FilterSidePanel`, `PokemonGrid`) oraz testów hooka (mock fetch).
12. Udokumentuj w README/Changelog nowy widok, dodaj notki w release notes.
13. W razie potrzeby wykonaj testy e2e (Playwright) sprawdzające ścieżkę wyszukiwania i paginacji.
