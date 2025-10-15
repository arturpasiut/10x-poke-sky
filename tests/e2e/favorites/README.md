# Testy E2E - US-003: Ulubione Pokemony

## Przegląd

Ten folder zawiera testy end-to-end dla funkcjonalności ulubionych pokemonów (US-003) w aplikacji 10x-poke-sky.

**Łącznie:** 15 testów E2E
**Pliki:** 3 pliki specyfikacji

## Struktura Testów

### 1. `add-remove.spec.ts` - Dodawanie i Usuwanie (4 testy)

- ✅ TC-FAV-001: Dodanie pokemona do ulubionych
- ✅ TC-FAV-002: Usunięcie pokemona z ulubionych (ze strony szczegółów)
- ✅ TC-FAV-002b: Usunięcie pokemona z listy ulubionych
- ✅ TC-FAV-001b: Wielokrotne cykle dodawania/usuwania

### 2. `list.spec.ts` - Lista i Pusty Stan (6 testów)

- ✅ TC-FAV-003: Wyświetlenie listy z wieloma pokemonami
- ✅ TC-FAV-004: Wyświetlenie pustego stanu
- ✅ TC-FAV-004b: Nawigacja do Pokédexu z pustego stanu
- ✅ TC-FAV-004c: Nawigacja do AI z pustego stanu
- ✅ TC-FAV-003b: Wyświetlenie pojedynczego ulubionego
- ✅ TC-FAV-003c: Wyświetlenie wielu ulubionych (6)

### 3. `sync-auth.spec.ts` - Autentykacja i Synchronizacja (5 testów)

- ✅ TC-FAV-005: Wymaganie logowania do dostępu
- ✅ TC-FAV-005b: Przekierowanie do logowania i powrót
- ✅ TC-FAV-006: Synchronizacja między sesjami
- ✅ TC-FAV-006b: Natychmiastowa synchronizacja po logowaniu
- ✅ TC-FAV-005c: Prompt logowania na stronie szczegółów

## Uruchamianie Testów

### Wymagania wstępne

1. **Środowisko uruchomione:**

   ```bash
   npm run dev
   ```

2. **Zmienne środowiskowe:**
   - Plik `.env.test` musi zawierać:
     - `TEST_USER_EMAIL`
     - `TEST_USER_PASSWORD`
     - `PLAYWRIGHT_BASE_URL` (domyślnie: http://localhost:4321)

3. **Konto testowe:**
   - Musisz mieć utworzone konto testowe w Supabase
   - Email i hasło muszą pasować do zmiennych w `.env.test`

### Komendy

#### Uruchomienie wszystkich testów US-003

```bash
npm run test:e2e tests/e2e/favorites
```

#### Uruchomienie w trybie headed (z UI przeglądarki)

```bash
npx playwright test tests/e2e/favorites --headed
```

#### Uruchomienie konkretnego pliku testowego

```bash
# Tylko testy dodawania/usuwania
npx playwright test tests/e2e/favorites/add-remove.spec.ts

# Tylko testy listy
npx playwright test tests/e2e/favorites/list.spec.ts

# Tylko testy autentykacji
npx playwright test tests/e2e/favorites/sync-auth.spec.ts
```

#### Uruchomienie konkretnego testu

```bash
npx playwright test tests/e2e/favorites/add-remove.spec.ts:21
```

#### Debug mode (interaktywny)

```bash
npx playwright test tests/e2e/favorites --debug
```

#### UI Mode (interaktywny interfejs)

```bash
npx playwright test tests/e2e/favorites --ui
```

#### Listowanie testów (bez uruchamiania)

```bash
npx playwright test tests/e2e/favorites --list
```

## Architektura Testów

### Page Object Model (POM)

Testy wykorzystują wzorzec Page Object Model dla lepszej maintainability:

**Page Objects:**

- `BasePage.ts` - Bazowa klasa dla wszystkich page objects
- `FavoritesPage.ts` - Strona `/favorites`
- `PokemonDetailPage.ts` - Strona `/pokemon/[identifier]`
- `LoginPage.ts` - Strona `/auth/login`

**Przykład użycia:**

```typescript
const favoritesPage = new FavoritesPage(page);
await favoritesPage.goto();
await favoritesPage.expectFavoriteExists(25); // Pikachu
```

### Fixtures

**`auth.fixture.ts`** - Custom fixtures dla autentykacji:

- `authenticatedPage` - Automatycznie zalogowana strona
- `emptyFavsAuthenticatedPage` - Zalogowana strona bez ulubionych
- `loginPage` - Instancja LoginPage

**Przykład użycia:**

```typescript
test("my test", async ({ authenticatedPage }) => {
  // Page jest już zalogowana!
  const favoritesPage = new FavoritesPage(authenticatedPage);
  await favoritesPage.goto();
});
```

### Helpers

**`favorites-helpers.ts`** - Funkcje pomocnicze dla operacji API:

- `addFavoriteViaAPI(page, pokemonId)` - Dodaj przez API (szybsze)
- `removeFavoriteViaAPI(page, pokemonId)` - Usuń przez API
- `clearAllFavoritesViaAPI(page)` - Wyczyść wszystkie
- `addMultipleFavoritesViaAPI(page, ids[])` - Dodaj wiele

**Przykład użycia:**

```typescript
// Setup - dodaj ulubione przez API (szybciej niż przez UI)
await addMultipleFavoritesViaAPI(page, [25, 6, 150]);

// Test - weryfikuj UI
await favoritesPage.goto();
expect(await favoritesPage.getFavoritesCount()).toBe(3);
```

## Data Test IDs

### Dodane atrybuty testowe

**FavoritesView.tsx:**

- `favorites-loading` - Loading skeleton
- `favorites-error-state` - Stan błędu
- `favorites-error-message` - Komunikat błędu
- `favorites-retry-button` - Przycisk ponów
- `favorites-login-link` - Link do logowania
- `favorites-empty-state` - Pusty stan
- `favorites-empty-message` - Komunikat pustego stanu
- `favorites-browse-link` - Link "Przejdź do Pokédexu"
- `favorites-ai-link` - Link "Zaproś asystenta AI"
- `favorites-grid` - Siatka ulubionych
- `favorite-card-{pokemonId}` - Karta ulubionego
- `favorite-remove-button-{pokemonId}` - Przycisk usuń
- `favorite-remove-error-{pokemonId}` - Błąd usuwania

**PokemonFavoriteAction.tsx:**

- `favorite-toggle-button-{pokemonId}` - Przycisk dodaj/usuń
- `favorite-action-loading-{pokemonId}` - Ikona ładowania
- `favorite-action-error-{pokemonId}` - Komunikat błędu
- `favorite-login-prompt-{pokemonId}` - Link logowania (nie zalogowany)

**PokemonCard.tsx:**

- `pokemon-card-{pokemonId}` - Karta pokemona
- `pokemon-card-link-{pokemonId}` - Link do szczegółów
- `pokemon-card-sprite-{pokemonId}` - Obrazek pokemona
- `pokemon-card-name-{pokemonId}` - Nazwa pokemona
- `pokemon-card-types-{pokemonId}` - Typy pokemona
- `pokemon-card-dex-{pokemonId}` - Numer Pokédex

## Pokrycie Test Cases

| Test Case  | Plik               | Status |
| ---------- | ------------------ | ------ |
| TC-FAV-001 | add-remove.spec.ts | ✅     |
| TC-FAV-002 | add-remove.spec.ts | ✅     |
| TC-FAV-003 | list.spec.ts       | ✅     |
| TC-FAV-004 | list.spec.ts       | ✅     |
| TC-FAV-005 | sync-auth.spec.ts  | ✅     |
| TC-FAV-006 | sync-auth.spec.ts  | ✅     |

**Dodatkowe testy (rozszerzone):**

- TC-FAV-001b: Wielokrotne cykle
- TC-FAV-002b: Usuwanie z listy
- TC-FAV-003b: Pojedynczy ulubiony
- TC-FAV-003c: Wiele ulubionych
- TC-FAV-004b: Nawigacja do Pokédexu
- TC-FAV-004c: Nawigacja do AI
- TC-FAV-005b: Redirect po logowaniu
- TC-FAV-005c: Prompt na stronie szczegółów
- TC-FAV-006b: Natychmiastowa synchronizacja

## Troubleshooting

### Problem: Testy failują z "401 Unauthorized"

**Rozwiązanie:** Sprawdź czy konto testowe istnieje w Supabase i dane w `.env.test` są poprawne.

### Problem: "Element not found" timeouts

**Rozwiązanie:**

1. Sprawdź czy aplikacja jest uruchomiona (`npm run dev`)
2. Sprawdź czy `data-testid` są poprawnie dodane do komponentów
3. Uruchom test z `--headed` aby zobaczyć co się dzieje

### Problem: Testy są niestabilne (flaky)

**Rozwiązanie:**

1. Zwiększ timeout w asercjach: `expect(element).toBeVisible({ timeout: 10000 })`
2. Dodaj explicit waits: `await page.waitForLoadState('networkidle')`
3. Użyj `clearAllFavoritesViaAPI` w `beforeEach` dla izolacji

### Problem: Powolne wykonanie testów

**Rozwiązanie:**

1. Używaj API helpers zamiast UI dla setup'u (`addFavoriteViaAPI`)
2. Uruchamiaj testy równolegle: `npx playwright test --workers=3`
3. Używaj fixtures dla automatycznego logowania

## Metryki

- **Łączny czas wykonania:** ~2-3 minuty (wszystkie 15 testów)
- **Coverage:** 100% US-003 (wszystkie 6 głównych test cases)
- **Stabilność:** Testy zaprojektowane z izolacją (beforeEach cleanup)

## Następne Kroki

Po pomyślnym uruchomieniu testów US-003, możesz:

1. Dodać testy dla innych User Stories (US-001, US-002, US-004)
2. Skonfigurować CI/CD do automatycznego uruchamiania testów
3. Dodać testy responsywności dla różnych viewport'ów
4. Dodać testy accessibility z axe-core

## Kontakt

Jeśli masz pytania lub napotkasz problemy:

- Sprawdź dokumentację Playwright: https://playwright.dev
- Sprawdź plan testów: `.ai/test-plan.md`
- Sprawdź plan E2E: `.ai/e2e-testing-plan.md`
