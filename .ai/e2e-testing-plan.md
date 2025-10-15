# Plan Wdrożenia Testów E2E - Playwright

## 1. Przegląd i Cele

### 1.1 Cel Dokumentu

Ten dokument definiuje szczegółowy plan wdrożenia testów end-to-end (E2E) w aplikacji 10x-poke-sky z użyciem Playwright 1.56.0. Plan obejmuje konfigurację środowiska, architekturę testów, standardy kodowania oraz harmonogram implementacji.

### 1.2 Zakres Testów E2E

Testy E2E będą symulować pełne ścieżki użytkownika w przeglądarce, weryfikując:

- Krytyczne user stories (US-001 do US-006)
- Integrację frontend-backend
- Interakcje użytkownika w rzeczywistym środowisku przeglądarki
- Responsywność na różnych urządzeniach
- Dostępność (accessibility)

### 1.3 Narzędzia i Technologie

- **Playwright 1.56.0**: Framework do testów E2E
- **TypeScript 5**: Język testów
- **Astro 5**: Framework aplikacji (SSR)
- **Supabase**: Backend (auth, database)
- **PokeAPI**: Źródło danych pokemonów
- **OpenRouter.ai**: Usługa AI
- **GitHub Actions**: CI/CD pipeline

---

## 2. Architektura Testów E2E

### 2.1 Struktura Katalogów

```
tests/
├── e2e/                              # Główny katalog testów E2E
│   ├── auth/                         # Testy autentykacji
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   ├── logout.spec.ts
│   │   └── password-reset.spec.ts
│   ├── pokemon/                      # Testy wyszukiwania i szczegółów
│   │   ├── search.spec.ts
│   │   ├── filters.spec.ts
│   │   ├── details.spec.ts
│   │   └── pagination.spec.ts
│   ├── favorites/                    # Testy ulubionych
│   │   ├── add-remove.spec.ts
│   │   ├── list.spec.ts
│   │   └── sync.spec.ts
│   ├── ai/                           # Testy czatu AI
│   │   ├── identify-pokemon.spec.ts
│   │   ├── conversation.spec.ts
│   │   └── error-handling.spec.ts
│   ├── moves/                        # Testy ruchów (US-006)
│   │   ├── list.spec.ts
│   │   └── filters.spec.ts
│   ├── accessibility/                # Testy dostępności
│   │   ├── keyboard-navigation.spec.ts
│   │   ├── screen-reader.spec.ts
│   │   └── contrast.spec.ts
│   └── responsive/                   # Testy responsywności
│       ├── desktop.spec.ts
│       ├── tablet.spec.ts
│       └── mobile.spec.ts
├── fixtures/                         # Fixtures i helpers
│   ├── auth.fixture.ts               # Fixture dla autentykacji
│   ├── pokemon.fixture.ts            # Fixture dla danych pokemon
│   └── test-data.ts                  # Dane testowe
├── utils/                            # Utility functions
│   ├── test-helpers.ts               # Pomocnicze funkcje
│   ├── api-helpers.ts                # Helpery do API
│   ├── db-helpers.ts                 # Helpery do bazy danych
│   └── selectors.ts                  # Page Object selektory
├── pages/                            # Page Object Model
│   ├── BasePage.ts                   # Bazowa klasa dla POM
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── PokemonListPage.ts
│   ├── PokemonDetailPage.ts
│   ├── FavoritesPage.ts
│   └── AIChatPage.ts
├── config/                           # Konfiguracja testów
│   ├── test-users.ts                 # Użytkownicy testowi
│   └── test-config.ts                # Konfiguracja środowisk
└── global-setup.ts                   # Setup globalny
└── global-teardown.ts                # Teardown globalny
playwright.config.ts                  # Konfiguracja Playwright
.env.test                             # Zmienne środowiskowe dla testów
```

### 2.2 Page Object Model (POM)

Wszystkie testy będą używać wzorca Page Object Model dla lepszej maintainability i reusability.

**Przykład struktury POM:**

```typescript
// tests/pages/BasePage.ts
export class BasePage {
  constructor(public page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }
}

// tests/pages/LoginPage.ts
export class LoginPage extends BasePage {
  readonly emailInput = this.page.getByLabel("Email");
  readonly passwordInput = this.page.getByLabel("Hasło");
  readonly submitButton = this.page.getByRole("button", { name: "Zaloguj się" });
  readonly errorMessage = this.page.getByRole("alert");

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL("/");
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### 2.3 Fixtures Customowe

Playwright fixtures pozwolą na reusable setup/teardown logikę.

```typescript
// tests/fixtures/auth.fixture.ts
import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Auto-login przed testem
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("test-user@example.com");
    await page.getByLabel("Hasło").fill("TestUser123!");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await page.waitForURL("/");
    await use(page);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto("/auth/login");
    await use(loginPage);
  },
});

export { expect } from "@playwright/test";
```

---

## 3. Konfiguracja Playwright

### 3.1 Aktualna Konfiguracja

```typescript
// playwright.config.ts (obecna)
import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

### 3.2 Rozszerzona Konfiguracja (Docelowa)

```typescript
// playwright.config.ts (rozszerzona)
import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  testDir: "./tests/e2e",

  // Timeout settings
  timeout: 30000, // 30s per test
  expect: {
    timeout: 10000, // 10s per assertion
  },

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Prevent test.only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 2 : undefined,

  // Reporting
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    process.env.CI ? ["github"] : ["dot"],
  ],

  // Global setup/teardown
  globalSetup: require.resolve("./tests/global-setup.ts"),
  globalTeardown: require.resolve("./tests/global-teardown.ts"),

  // Shared settings
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321",

    // Trace & debugging
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",

    // Browser context options
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    viewport: { width: 1280, height: 720 },

    // Accessibility
    hasTouch: false,

    // Network
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Browser projects
  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile browsers
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 12"],
      },
    },

    // Tablet
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro"],
      },
    },

    // Accessibility testing
    {
      name: "accessibility",
      testMatch: /.*accessibility\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // Web server
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:4321",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
```

### 3.3 Zmienne Środowiskowe

```bash
# .env.test
# Playwright
PLAYWRIGHT_BASE_URL=http://localhost:4321

# Supabase (test environment)
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# Test users
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=TestUser123!
TEST_USER_EMPTY_FAVS_EMAIL=empty-favs@example.com
TEST_USER_EMPTY_FAVS_PASSWORD=EmptyFavs123!

# External APIs (mockowane w testach)
OPENROUTER_API_KEY=test_api_key
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
```

---

## 4. Standardy Kodowania Testów

### 4.1 Naming Conventions

**Pliki testowe:**

```
{feature}.spec.ts
{feature}-{subfeature}.spec.ts
```

**Test suites i cases:**

```typescript
test.describe("Feature name", () => {
  test("should do specific action when condition", async ({ page }) => {
    // Test implementation
  });
});
```

**Page Objects:**

```
{FeatureName}Page.ts
```

### 4.2 Best Practices

1. **Używaj Page Object Model** - Wszystkie interakcje UI przez POM
2. **Używaj fixtures** - Reusable setup/teardown logika
3. **Selektory ARIA-first** - Preferuj role, label, text content
4. **Izolacja testów** - Każdy test niezależny (own test data)
5. **Czytelne asercje** - Używaj expect z deskryptywnym komunikatem
6. **Async/await** - Konsekwentne używanie dla wszystkich operacji Playwright
7. **Unikaj sleep/waitForTimeout** - Używaj waitFor\* methods
8. **Cleanup po testach** - Używaj fixtures lub afterEach hooks
9. **Test data management** - Twórz unique test data (timestamp, uuid)
10. **Error handling** - Sprawdzaj zarówno happy path jak i error cases

### 4.3 Przykład Dobrze Napisanego Testu

```typescript
import { test, expect } from "../fixtures/auth.fixture";
import { PokemonListPage } from "../pages/PokemonListPage";

test.describe("Pokemon Search - US-001", () => {
  test("TC-SEARCH-001: should find Pokemon by name", async ({ page }) => {
    // Arrange
    const pokemonPage = new PokemonListPage(page);
    await pokemonPage.goto();

    // Act
    await pokemonPage.searchByName("pikachu");

    // Assert
    await expect(pokemonPage.searchResults).toBeVisible();
    await expect(pokemonPage.getFirstPokemonCard()).toContainText("Pikachu");
    await expect(pokemonPage.getPokemonType("Pikachu")).toContainText("Electric");

    // Verify image loaded
    const pikachuCard = pokemonPage.getPokemonCard("Pikachu");
    await expect(pikachuCard.locator("img")).toHaveAttribute("alt", /pikachu/i);
  });

  test("TC-SEARCH-002: should display full list when search is empty", async ({ page }) => {
    const pokemonPage = new PokemonListPage(page);
    await pokemonPage.goto();

    await expect(pokemonPage.searchResults).toBeVisible();
    await expect(pokemonPage.getAllPokemonCards()).toHaveCount(20); // default page size
    await expect(pokemonPage.pagination).toBeVisible();
  });

  test('TC-SEARCH-006: should show "no results" message for invalid search', async ({ page }) => {
    const pokemonPage = new PokemonListPage(page);
    await pokemonPage.goto();

    await pokemonPage.searchByName("nieistniejacypokemon123");

    await expect(pokemonPage.noResultsMessage).toBeVisible();
    await expect(pokemonPage.noResultsMessage).toContainText("Nie znaleziono pokemonów");
    await expect(pokemonPage.aiChatSuggestion).toBeVisible();
  });
});
```

---

## 5. Implementacja Testów - User Stories

### 5.1 US-001: Wyszukiwanie Pokemonów

**Plik:** `tests/e2e/pokemon/search.spec.ts`

**Pokrycie:**

- TC-SEARCH-001: Wyszukiwanie po nazwie (Wysoki)
- TC-SEARCH-002: Puste zapytanie (Średni)
- TC-SEARCH-006: Brak wyników (Średni)

**Page Object:** `PokemonListPage.ts`

```typescript
// tests/pages/PokemonListPage.ts
export class PokemonListPage extends BasePage {
  readonly searchInput = this.page.getByRole("searchbox", { name: /wyszukaj/i });
  readonly searchResults = this.page.locator('[data-testid="pokemon-grid"]');
  readonly noResultsMessage = this.page.getByText(/nie znaleziono pokemonów/i);
  readonly aiChatSuggestion = this.page.getByRole("link", { name: /czat AI/i });
  readonly pagination = this.page.locator('[data-testid="pagination"]');

  async searchByName(name: string) {
    await this.searchInput.fill(name);
    await this.searchInput.press("Enter");
    await this.waitForSearchResults();
  }

  async waitForSearchResults() {
    await this.page.waitForResponse((resp) => resp.url().includes("/api/pokemon") && resp.status() === 200);
  }

  getPokemonCard(name: string) {
    return this.page.getByRole("article", { name: new RegExp(name, "i") });
  }

  getFirstPokemonCard() {
    return this.searchResults.locator("article").first();
  }

  getAllPokemonCards() {
    return this.searchResults.locator("article");
  }

  getPokemonType(pokemonName: string) {
    return this.getPokemonCard(pokemonName).locator('[data-testid="pokemon-type"]');
  }
}
```

### 5.2 US-001: Filtrowanie Pokemonów

**Plik:** `tests/e2e/pokemon/filters.spec.ts`

**Pokrycie:**

- TC-SEARCH-003: Filtrowanie po typie (Wysoki)
- TC-SEARCH-004: Filtrowanie po generacji (Średni)
- TC-SEARCH-005: Wielokryteriowe (Średni)

**Rozszerzenie POM:**

```typescript
// tests/pages/PokemonListPage.ts (rozszerzenie)
export class PokemonListPage extends BasePage {
  // ... poprzednie pola

  readonly filterPanel = this.page.getByRole("complementary", { name: /filtry/i });
  readonly applyFiltersButton = this.page.getByRole("button", { name: /zastosuj filtry/i });

  async filterByType(type: string) {
    await this.filterPanel.getByLabel(type).check();
    await this.applyFiltersButton.click();
    await this.waitForSearchResults();
  }

  async filterByGeneration(generation: string) {
    await this.filterPanel.getByLabel(`Generacja ${generation}`).check();
    await this.applyFiltersButton.click();
    await this.waitForSearchResults();
  }

  async applyMultipleFilters(filters: { type?: string; generation?: string }) {
    if (filters.type) {
      await this.filterPanel.getByLabel(filters.type).check();
    }
    if (filters.generation) {
      await this.filterPanel.getByLabel(`Generacja ${filters.generation}`).check();
    }
    await this.applyFiltersButton.click();
    await this.waitForSearchResults();
  }
}
```

### 5.3 US-002: Szczegóły Pokemona

**Plik:** `tests/e2e/pokemon/details.spec.ts`

**Pokrycie:**

- TC-DETAIL-001: Wyświetlenie szczegółów (Wysoki)
- TC-DETAIL-002: Ewolucje (Średni)
- TC-DETAIL-003: Ruchy (Średni)
- TC-DETAIL-005: Bezpośredni dostęp (Średni)
- TC-DETAIL-006: Nieistniejący pokemon (Niski)

**Page Object:** `PokemonDetailPage.ts`

```typescript
// tests/pages/PokemonDetailPage.ts
export class PokemonDetailPage extends BasePage {
  readonly pokemonName = this.page.getByRole("heading", { level: 1 });
  readonly pokemonImage = this.page.locator('[data-testid="pokemon-sprite"]');
  readonly pokemonTypes = this.page.locator('[data-testid="pokemon-types"]');
  readonly statsSection = this.page.locator('[data-testid="pokemon-stats"]');
  readonly evolutionSection = this.page.locator('[data-testid="pokemon-evolution"]');
  readonly movesSection = this.page.locator('[data-testid="pokemon-moves"]');
  readonly favoriteButton = this.page.getByRole("button", { name: /dodaj do ulubionych|usuń z ulubionych/i });
  readonly backButton = this.page.getByRole("button", { name: /wróć|powrót/i });
  readonly notFoundMessage = this.page.getByText(/pokemon nie został znaleziony/i);

  async gotoByName(name: string) {
    await this.goto(`/pokemon/${name}`);
  }

  async gotoById(id: number) {
    await this.goto(`/pokemon/${id}`);
  }

  async expectPokemonDetails(details: { name: string; types: string[]; hasEvolution?: boolean }) {
    await expect(this.pokemonName).toContainText(details.name);

    for (const type of details.types) {
      await expect(this.pokemonTypes).toContainText(type);
    }

    await expect(this.statsSection).toBeVisible();

    if (details.hasEvolution) {
      await expect(this.evolutionSection).toBeVisible();
    }
  }

  async getEvolutionChain() {
    return this.evolutionSection.locator('[data-testid="evolution-stage"]');
  }

  async getMovesList() {
    return this.movesSection.locator('[data-testid="move-item"]');
  }

  async clickFavorite() {
    await this.favoriteButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }
}
```

### 5.4 US-003: Ulubione Pokemony

**Pliki:**

- `tests/e2e/favorites/add-remove.spec.ts`
- `tests/e2e/favorites/list.spec.ts`
- `tests/e2e/favorites/sync.spec.ts`

**Pokrycie:**

- TC-FAV-001: Dodanie do ulubionych (Wysoki)
- TC-FAV-002: Usunięcie (Wysoki)
- TC-FAV-003: Lista ulubionych (Wysoki)
- TC-FAV-004: Pusta lista (Średni)
- TC-FAV-005: Dostęp bez logowania (Wysoki)
- TC-FAV-006: Synchronizacja między sesjami (Średni)

**Page Object:** `FavoritesPage.ts`

```typescript
// tests/pages/FavoritesPage.ts
export class FavoritesPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: /ulubione pokemony/i });
  readonly favoritesGrid = this.page.locator('[data-testid="favorites-grid"]');
  readonly emptyMessage = this.page.getByText(/nie masz jeszcze ulubionych/i);
  readonly loginPrompt = this.page.getByText(/zaloguj się.*ulubione/i);
  readonly loginLink = this.page.getByRole("link", { name: /zaloguj się/i });
  readonly browseLink = this.page.getByRole("link", { name: /przeglądaj pokemony/i });

  async goto() {
    await super.goto("/favorites");
  }

  getFavoritePokemonCard(name: string) {
    return this.favoritesGrid.getByRole("article", { name: new RegExp(name, "i") });
  }

  getAllFavoriteCards() {
    return this.favoritesGrid.locator("article");
  }

  async removeFavorite(name: string) {
    const card = this.getFavoritePokemonCard(name);
    const removeButton = card.getByRole("button", { name: /usuń z ulubionych/i });
    await removeButton.click();
  }

  async expectFavoriteExists(name: string) {
    await expect(this.getFavoritePokemonCard(name)).toBeVisible();
  }

  async expectFavoriteNotExists(name: string) {
    await expect(this.getFavoritePokemonCard(name)).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyMessage).toBeVisible();
    await expect(this.browseLink).toBeVisible();
  }

  async expectLoginRequired() {
    await expect(this.loginPrompt).toBeVisible();
    await expect(this.loginLink).toBeVisible();
  }
}
```

### 5.5 US-004: Czat AI

**Pliki:**

- `tests/e2e/ai/identify-pokemon.spec.ts`
- `tests/e2e/ai/conversation.spec.ts`
- `tests/e2e/ai/error-handling.spec.ts`

**Pokrycie:**

- TC-AI-001: Rozpoznanie po opisie (Wysoki)
- TC-AI-002: Wieloetapowa konwersacja (Średni)
- TC-AI-003: Pytania spoza Pokemon (Średni)
- TC-AI-004: Karta sugerowanego pokemona (Średni)
- TC-AI-005: Obsługa błędów (Niski)
- TC-AI-006: Dostęp bez logowania (Średni)
- TC-AI-007: Loading state (Niski)

**Page Object:** `AIChatPage.ts`

```typescript
// tests/pages/AIChatPage.ts
export class AIChatPage extends BasePage {
  readonly chatInput = this.page.getByRole("textbox", { name: /wiadomość/i });
  readonly sendButton = this.page.getByRole("button", { name: /wyślij/i });
  readonly chatHistory = this.page.locator('[data-testid="chat-history"]');
  readonly loadingSkeleton = this.page.locator('[data-testid="loading-skeleton"]');
  readonly suggestedPokemon = this.page.locator('[data-testid="suggested-pokemon"]');
  readonly errorMessage = this.page.locator('[data-testid="error-message"]');
  readonly rateLimitMessage = this.page.getByText(/przekroczono limit/i);

  async goto() {
    await super.goto("/ai");
  }

  async sendMessage(message: string) {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }

  async waitForAIResponse() {
    await expect(this.loadingSkeleton).toBeVisible();
    await expect(this.loadingSkeleton).not.toBeVisible({ timeout: 30000 });
  }

  async expectAIResponse(expectedText: string | RegExp) {
    const lastMessage = this.chatHistory.locator(".ai-message").last();
    await expect(lastMessage).toContainText(expectedText);
  }

  async expectSuggestedPokemon(name: string) {
    const suggestion = this.suggestedPokemon.getByText(name);
    await expect(suggestion).toBeVisible();
  }

  async clickSuggestedPokemon(name: string) {
    const card = this.suggestedPokemon.getByRole("link", { name: new RegExp(name, "i") });
    await card.click();
  }

  async expectOffDomainResponse() {
    await this.expectAIResponse(/mogę odpowiadać tylko.*pokémon/i);
  }

  async expectRateLimitError() {
    await expect(this.rateLimitMessage).toBeVisible();
  }

  getChatMessages() {
    return this.chatHistory.locator(".message");
  }
}
```

### 5.6 US-005: Autentykacja

**Pliki:**

- `tests/e2e/auth/register.spec.ts`
- `tests/e2e/auth/login.spec.ts`
- `tests/e2e/auth/logout.spec.ts`
- `tests/e2e/auth/password-reset.spec.ts`

**Pokrycie:**

- TC-AUTH-001: Rejestracja (Wysoki)
- TC-AUTH-002: Walidacja formularza (Średni)
- TC-AUTH-003: Logowanie poprawne (Wysoki)
- TC-AUTH-004: Logowanie błędne (Wysoki)
- TC-AUTH-005: Wylogowanie (Wysoki)
- TC-AUTH-006: Reset hasła (Średni)
- TC-AUTH-007: Ochrona CSRF (Wysoki)
- TC-AUTH-008: Dostęp do chronionych zasobów (Wysoki)

**Page Objects:** `LoginPage.ts`, `RegisterPage.ts`

```typescript
// tests/pages/RegisterPage.ts
export class RegisterPage extends BasePage {
  readonly emailInput = this.page.getByLabel("Email");
  readonly passwordInput = this.page.getByLabel("Hasło", { exact: true });
  readonly confirmPasswordInput = this.page.getByLabel("Powtórz hasło");
  readonly submitButton = this.page.getByRole("button", { name: /zarejestruj/i });
  readonly successMessage = this.page.getByText(/zarejestrowano pomyślnie/i);
  readonly errorMessage = this.page.getByRole("alert");
  readonly loginLink = this.page.getByRole("link", { name: /zaloguj się/i });

  async goto() {
    await super.goto("/auth/register");
  }

  async register(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword ?? password);
    await this.submitButton.click();
  }

  async expectValidationError(field: string, message: string | RegExp) {
    const error = this.page.locator(`[data-field="${field}"] .error-message`);
    await expect(error).toContainText(message);
  }

  async expectRegistrationSuccess() {
    await expect(this.successMessage).toBeVisible();
  }

  async expectRegistrationError(message: string | RegExp) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### 5.7 US-006: Przeglądanie Ruchów

**Pliki:**

- `tests/e2e/moves/list.spec.ts`
- `tests/e2e/moves/filters.spec.ts`

**Pokrycie:**

- TC-MOVES-001: Lista ruchów (Średni)
- TC-MOVES-002: Sortowanie po typie (Średni)
- TC-MOVES-003: Sortowanie po mocy (Średni)
- TC-MOVES-004: Filtrowanie (Niski)

**Page Object:** `MovesPage.ts`

```typescript
// tests/pages/MovesPage.ts
export class MovesPage extends BasePage {
  readonly heading = this.page.getByRole("heading", { name: /ruchy pokemonów/i });
  readonly movesGrid = this.page.locator('[data-testid="moves-grid"]');
  readonly sortDropdown = this.page.getByRole("combobox", { name: /sortuj/i });
  readonly filterPanel = this.page.getByRole("complementary", { name: /filtry/i });

  async goto() {
    await super.goto("/moves");
  }

  getAllMoves() {
    return this.movesGrid.locator('[data-testid="move-item"]');
  }

  getMove(name: string) {
    return this.movesGrid.getByText(name);
  }

  async sortBy(option: string) {
    await this.sortDropdown.selectOption(option);
    await this.waitForPageLoad();
  }

  async filterByType(type: string) {
    await this.filterPanel.getByLabel(type).check();
    await this.page.getByRole("button", { name: /zastosuj/i }).click();
    await this.waitForPageLoad();
  }

  async expectMoveDetails(
    name: string,
    details: {
      type: string;
      power?: number;
      accuracy?: number;
    }
  ) {
    const move = this.getMove(name).locator("xpath=ancestor::article");
    await expect(move).toContainText(details.type);
    if (details.power) {
      await expect(move).toContainText(`Moc: ${details.power}`);
    }
    if (details.accuracy) {
      await expect(move).toContainText(`Dokładność: ${details.accuracy}`);
    }
  }
}
```

---

## 6. Testy Niefunkcjonalne

### 6.1 Testy Responsywności

**Plik:** `tests/e2e/responsive/responsive.spec.ts`

**Pokrycie:**

- TC-RESP-001: Desktop (Średni)
- TC-RESP-002: Tablet (Średni)
- TC-RESP-003: Mobile (Wysoki)

```typescript
import { test, expect, devices } from "@playwright/test";

const viewports = [
  { name: "desktop", ...devices["Desktop Chrome"], width: 1920, height: 1080 },
  { name: "tablet", ...devices["iPad Pro"], width: 1024, height: 768 },
  { name: "mobile", ...devices["iPhone 12"], width: 375, height: 667 },
];

for (const viewport of viewports) {
  test.describe(`Responsywność - ${viewport.name}`, () => {
    test.use({ ...viewport });

    test("strona główna wyświetla się poprawnie", async ({ page }) => {
      await page.goto("/");

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth);

      // Main elements visible
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("main")).toBeVisible();
    });

    test("nawigacja działa poprawnie", async ({ page }) => {
      await page.goto("/");

      if (viewport.width < 768) {
        // Mobile: hamburger menu
        const menuButton = page.getByRole("button", { name: /menu/i });
        await expect(menuButton).toBeVisible();
        await menuButton.click();
      }

      const pokemonLink = page.getByRole("link", { name: /pokédex/i });
      await expect(pokemonLink).toBeVisible();
      await pokemonLink.click();
      await expect(page).toHaveURL("/pokemon");
    });
  });
}
```

### 6.2 Testy Dostępności

**Plik:** `tests/e2e/accessibility/keyboard-navigation.spec.ts`

**Pokrycie:**

- TC-ACCESS-001: Nawigacja klawiaturą (Wysoki)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Dostępność - Nawigacja klawiaturą", () => {
  test("TC-ACCESS-001: wszystkie elementy dostępne przez Tab", async ({ page }) => {
    await page.goto("/pokemon");

    // Focus na pierwszym interaktywnym elemencie
    await page.keyboard.press("Tab");

    // Sprawdź focus indicator
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();

    // Nawigacja przez wszystkie interaktywne elementy
    const interactiveElements = await page.locator("a, button, input, select, textarea").count();

    for (let i = 0; i < Math.min(interactiveElements, 20); i++) {
      await page.keyboard.press("Tab");
      const currentFocus = page.locator(":focus");

      // Focus indicator jest widoczny
      await expect(currentFocus).toHaveCSS("outline-style", /solid|auto/);
    }
  });

  test("formularze obsługują Enter i Space", async ({ page }) => {
    await page.goto("/auth/login");

    // Wypełnij formularz klawiaturą
    await page.keyboard.press("Tab"); // Email input
    await page.keyboard.type("test@example.com");

    await page.keyboard.press("Tab"); // Password input
    await page.keyboard.type("TestUser123!");

    await page.keyboard.press("Tab"); // Remember me checkbox
    await page.keyboard.press("Space"); // Check checkbox

    await page.keyboard.press("Tab"); // Submit button
    await page.keyboard.press("Enter"); // Submit form

    // Verify submission
    await expect(page).toHaveURL("/");
  });

  test("Escape zamyka modale", async ({ page }) => {
    await page.goto("/pokemon");

    // Otwórz filtry (jeśli są w modalnym drawer)
    const filtersButton = page.getByRole("button", { name: /filtry/i });
    if (await filtersButton.isVisible()) {
      await filtersButton.click();

      const drawer = page.getByRole("dialog");
      await expect(drawer).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(drawer).not.toBeVisible();
    }
  });
});
```

**Plik:** `tests/e2e/accessibility/axe-core.spec.ts`

**Wykorzystanie axe-core dla automatycznych audytów:**

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Dostępność - Audyty axe-core", () => {
  const pages = [
    { name: "Strona główna", url: "/" },
    { name: "Lista pokemonów", url: "/pokemon" },
    { name: "Szczegóły pokemona", url: "/pokemon/pikachu" },
    { name: "Logowanie", url: "/auth/login" },
    { name: "Czat AI", url: "/ai" },
  ];

  for (const { name, url } of pages) {
    test(`${name} spełnia standardy WCAG 2.1 AA`, async ({ page }) => {
      await page.goto(url);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
```

**Instalacja axe-core:**

```bash
npm install --save-dev @axe-core/playwright
```

---

## 7. Helpers i Utilities

### 7.1 Test Helpers

```typescript
// tests/utils/test-helpers.ts
import { Page } from "@playwright/test";

export class TestHelpers {
  /**
   * Generuje unikalny email dla testów
   */
  static generateUniqueEmail(prefix: string = "test"): string {
    const timestamp = Date.now();
    return `${prefix}-${timestamp}@example.com`;
  }

  /**
   * Generuje losowe hasło
   */
  static generatePassword(): string {
    return `Test${Math.random().toString(36).substring(7)}123!`;
  }

  /**
   * Czeka na zakończenie wszystkich requestów do API
   */
  static async waitForAPIRequests(page: Page, apiPath: string) {
    await page.waitForResponse((resp) => resp.url().includes(apiPath) && resp.status() === 200);
  }

  /**
   * Screenshot z timestamp
   */
  static async takeTimestampedScreenshot(page: Page, name: string) {
    const timestamp = Date.now();
    await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
  }

  /**
   * Sprawdza czy element ma focus indicator
   */
  static async hasFocusIndicator(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    await element.focus();

    const outlineStyle = await element.evaluate((el) => window.getComputedStyle(el).outlineStyle);

    return outlineStyle !== "none";
  }
}
```

### 7.2 API Helpers

```typescript
// tests/utils/api-helpers.ts
import { APIRequestContext } from "@playwright/test";

export class APIHelpers {
  constructor(
    private request: APIRequestContext,
    private baseURL: string
  ) {}

  /**
   * Rejestruje użytkownika przez API
   */
  async registerUser(email: string, password: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/register`, {
      data: { email, password, confirmPassword: password },
    });
    return response;
  }

  /**
   * Loguje użytkownika i zwraca cookies
   */
  async loginUser(email: string, password: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
      data: { email, password },
    });

    if (response.ok()) {
      const cookies = response.headers()["set-cookie"];
      return { success: true, cookies };
    }

    return { success: false };
  }

  /**
   * Dodaje pokemona do ulubionych przez API
   */
  async addFavorite(pokemonId: number, authCookies: string) {
    const response = await this.request.post(`${this.baseURL}/api/users/me/favorites/${pokemonId}`, {
      headers: { Cookie: authCookies },
    });
    return response;
  }

  /**
   * Pobiera listę ulubionych przez API
   */
  async getFavorites(authCookies: string) {
    const response = await this.request.get(`${this.baseURL}/api/users/me/favorites`, {
      headers: { Cookie: authCookies },
    });
    return response.json();
  }
}
```

### 7.3 Database Helpers

```typescript
// tests/utils/db-helpers.ts
import { createClient } from "@supabase/supabase-js";

export class DatabaseHelpers {
  private supabase;

  constructor() {
    this.supabase = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }

  /**
   * Usuwa użytkownika testowego
   */
  async deleteTestUser(email: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(email);
    if (error) console.error("Error deleting user:", error);
  }

  /**
   * Czyści ulubione użytkownika
   */
  async clearUserFavorites(userId: string) {
    const { error } = await this.supabase.from("favorites").delete().eq("user_id", userId);

    if (error) console.error("Error clearing favorites:", error);
  }

  /**
   * Tworzy użytkownika testowego z danymi
   */
  async createTestUser(email: string, password: string) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Error creating test user:", error);
      return null;
    }

    return data.user;
  }

  /**
   * Resetuje bazę danych testową do stanu początkowego
   */
  async resetTestDatabase() {
    // Clear all test data
    await this.supabase.from("favorites").delete().neq("id", 0);
    await this.supabase.from("ai_queries").delete().neq("id", 0);
  }
}
```

---

## 8. Global Setup i Teardown

### 8.1 Global Setup

```typescript
// tests/global-setup.ts
import { chromium, FullConfig } from "@playwright/test";
import { DatabaseHelpers } from "./utils/db-helpers";
import { TestHelpers } from "./utils/test-helpers";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup...");

  // 1. Przygotuj bazę danych testową
  const dbHelpers = new DatabaseHelpers();
  await dbHelpers.resetTestDatabase();
  console.log("✅ Database reset complete");

  // 2. Utwórz standardowych użytkowników testowych
  const testUsers = [
    {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
      favorites: [25, 6, 150], // Pikachu, Charizard, Mewtwo
    },
    {
      email: process.env.TEST_USER_EMPTY_FAVS_EMAIL!,
      password: process.env.TEST_USER_EMPTY_FAVS_PASSWORD!,
      favorites: [],
    },
  ];

  for (const user of testUsers) {
    const createdUser = await dbHelpers.createTestUser(user.email, user.password);

    if (createdUser && user.favorites.length > 0) {
      // Dodaj ulubione (wymaga implementacji w db-helpers)
      console.log(`✅ Created user: ${user.email} with ${user.favorites.length} favorites`);
    }
  }

  // 3. Verify aplikacja jest dostępna
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(config.use?.baseURL || "http://localhost:4321", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    console.log("✅ Application is accessible");
  } catch (error) {
    console.error("❌ Application not accessible:", error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log("🎉 Global setup complete!\n");
}

export default globalSetup;
```

### 8.2 Global Teardown

```typescript
// tests/global-teardown.ts
import { FullConfig } from "@playwright/test";
import { DatabaseHelpers } from "./utils/db-helpers";

async function globalTeardown(config: FullConfig) {
  console.log("\n🧹 Starting global teardown...");

  // Clean up test data (opcjonalnie - tylko dla dedykowanej bazy testowej)
  if (process.env.CLEANUP_AFTER_TESTS === "true") {
    const dbHelpers = new DatabaseHelpers();
    await dbHelpers.resetTestDatabase();
    console.log("✅ Test data cleaned up");
  }

  console.log("✅ Global teardown complete!");
}

export default globalTeardown;
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  e2e-tests:
    name: E2E Tests - ${{ matrix.project }}
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox, webkit]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase local
        run: supabase start

      - name: Setup environment variables
        run: |
          cp .env.test .env
          echo "PLAYWRIGHT_BASE_URL=http://localhost:4321" >> .env

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps ${{ matrix.project }}

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.project }}
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.project }}
          path: playwright-report/
          retention-days: 7

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots-${{ matrix.project }}
          path: test-results/
          retention-days: 7

      - name: Stop Supabase
        if: always()
        run: supabase stop

  e2e-tests-summary:
    name: E2E Tests Summary
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: always()

    steps:
      - name: Check test results
        run: |
          if [ "${{ needs.e2e-tests.result }}" == "failure" ]; then
            echo "❌ E2E tests failed"
            exit 1
          else
            echo "✅ E2E tests passed"
          fi
```

### 9.2 Konfiguracja dla CI

```typescript
// playwright.config.ts (fragment dla CI)
export default defineConfig({
  // ... inne ustawienia

  // CI-specific settings
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["junit", { outputFile: "playwright-report/junit.xml" }]]
    : [["list"], ["html"]],

  use: {
    // Disable animations in CI for faster tests
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",

    // CI-specific browser options
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100,
    },
  },
});
```

---

## 10. Harmonogram Implementacji

### 10.1 Faza 1: Setup i Infrastruktura (Tydzień 1)

**Zadania:**

- ✅ Rozszerzenie konfiguracji Playwright
- ✅ Setup global-setup.ts i global-teardown.ts
- ✅ Utworzenie struktury katalogów testowych
- ✅ Implementacja base Page Objects (BasePage.ts)
- ✅ Implementacja helpers (test-helpers, api-helpers, db-helpers)
- ✅ Konfiguracja fixtures (auth.fixture.ts)
- ✅ Setup GitHub Actions workflow
- ✅ Dokumentacja standardów kodowania

**Deliverables:**

- Pełna struktura katalogów testowych
- Skonfigurowane środowisko CI/CD
- Bazowe klasy POM i helpers

### 10.2 Faza 2: Testy Autentykacji - US-005 (Tydzień 2)

**Zadania:**

- Implementacja LoginPage, RegisterPage POM
- Testy TC-AUTH-001 do TC-AUTH-008
- Setup auth fixtures
- Integracja z Supabase Auth w testach

**Deliverables:**

- 8 testów autentykacji (wszystkie priorytety)
- auth.fixture.ts z authenticated context

**Cel pokrycia:** 100% US-005

### 10.3 Faza 3: Testy Wyszukiwania - US-001 (Tydzień 3)

**Zadania:**

- Implementacja PokemonListPage POM
- Testy wyszukiwania (TC-SEARCH-001, 002, 006)
- Testy filtrowania (TC-SEARCH-003, 004, 005)
- Testy paginacji (TC-SEARCH-007)
- Testy sortowania (TC-SEARCH-008)

**Deliverables:**

- 8 testów wyszukiwania i filtrowania
- PokemonListPage z pełną funkcjonalnością

**Cel pokrycia:** 100% US-001

### 10.4 Faza 4: Testy Szczegółów - US-002 (Tydzień 3-4)

**Zadania:**

- Implementacja PokemonDetailPage POM
- Testy szczegółów (TC-DETAIL-001 do TC-DETAIL-006)
- Integracja z PokeAPI (mockowanie w fixtures)

**Deliverables:**

- 6 testów szczegółów pokemona
- pokemon.fixture.ts z mock data

**Cel pokrycia:** 100% US-002

### 10.5 Faza 5: Testy Ulubionych - US-003 (Tydzień 4)

**Zadania:**

- Implementacja FavoritesPage POM
- Testy dodawania/usuwania (TC-FAV-001, 002)
- Testy listy (TC-FAV-003, 004, 005)
- Testy synchronizacji (TC-FAV-006)
- Integracja z authenticated fixtures

**Deliverables:**

- 6 testów ulubionych
- Fixtures dla favorites test data

**Cel pokrycia:** 100% US-003

### 10.6 Faza 6: Testy Czatu AI - US-004 (Tydzień 5)

**Zadania:**

- Implementacja AIChatPage POM
- Testy identyfikacji (TC-AI-001, 004)
- Testy konwersacji (TC-AI-002)
- Testy off-domain (TC-AI-003)
- Testy error handling (TC-AI-005, 006, 007)
- Mockowanie OpenRouter.ai API

**Deliverables:**

- 7 testów czatu AI
- AI fixtures z mock responses

**Cel pokrycia:** 100% US-004

### 10.7 Faza 7: Testy Ruchów - US-006 (Tydzień 5)

**Zadania:**

- Implementacja MovesPage POM
- Testy listy i sortowania (TC-MOVES-001 do TC-MOVES-004)

**Deliverables:**

- 4 testy ruchów pokemonów

**Cel pokrycia:** 100% US-006

### 10.8 Faza 8: Testy Niefunkcjonalne (Tydzień 6)

**Zadania:**

- Testy responsywności (TC-RESP-001 do TC-RESP-003)
- Testy accessibility (TC-ACCESS-001 do TC-ACCESS-003)
- Integracja axe-core
- Testy keyboard navigation

**Deliverables:**

- 6 testów niefunkcjonalnych
- Raport dostępności

**Cel pokrycia:** Wszystkie wymagania niefunkcjonalne

### 10.9 Faza 9: Stabilizacja i Optymalizacja (Tydzień 7)

**Zadania:**

- Naprawa flaky tests
- Optymalizacja czasu wykonania testów
- Code review wszystkich testów
- Dokumentacja run book
- Regression testing

**Deliverables:**

- Stabilna suita testów (0% flaky rate)
- Czas wykonania < 15 min
- Pełna dokumentacja

### 10.10 Kamienie Milowe

| Milestone                       | Tydzień | Kryteria Akceptacji                              |
| ------------------------------- | ------- | ------------------------------------------------ |
| **M1: Setup Complete**          | 1       | Infrastruktura testowa gotowa, CI/CD działa      |
| **M2: Auth Tests Complete**     | 2       | US-005 w pełni pokryte (8 testów)                |
| **M3: Core Features Complete**  | 4       | US-001, US-002, US-003 pokryte (20 testów)       |
| **M4: All Features Complete**   | 5       | US-004, US-006 pokryte (11 testów)               |
| **M5: Non-functional Complete** | 6       | Responsywność, dostępność (6 testów)             |
| **M6: Production Ready**        | 7       | Wszystkie testy stabilne, dokumentacja kompletna |

**Łącznie:** ~45 testów E2E, pokrywające wszystkie kluczowe user stories

---

## 11. Metryki i Cele

### 11.1 Metryki Sukcesu

| Metryka                        | Cel                        | Pomiar                        |
| ------------------------------ | -------------------------- | ----------------------------- |
| **Pokrycie User Stories**      | 100% US-001 do US-006      | Ilość testów/user story       |
| **Test Pass Rate**             | ≥ 95%                      | (Passed / Total) × 100%       |
| **Flaky Test Rate**            | ≤ 2%                       | (Flaky / Total) × 100%        |
| **Test Execution Time**        | < 15 min (full suite)      | Czas w CI/CD                  |
| **Bug Detection Rate**         | ≥ 80% bugs przed produkcją | Bugs found E2E / Total bugs   |
| **Mean Time to Detect (MTTD)** | < 24h                      | Czas od commit do wykrycia    |
| **Test Maintainability**       | High (POM + fixtures)      | Subiektywna ocena code review |

### 11.2 Raportowanie

**Daily:**

- CI/CD status (pass/fail)
- Liczba failed tests
- Blockers

**Weekly:**

- Test pass rate trend
- Flaky tests report
- Execution time trend
- Coverage progress

**Per Milestone:**

- Pełny raport testów
- Screenshots/videos failed tests
- Recommendations

---

## 12. Best Practices i Recommendations

### 12.1 Do's

✅ **Używaj Page Object Model** - Łatwiejsze utrzymanie
✅ **Fixtures dla reusable setup** - DRY principle
✅ **ARIA-first selectors** - Lepsze dla accessibility
✅ **Izolacja testów** - Własne dane testowe
✅ **Parallel execution** - Szybsze wykonanie
✅ **Auto-retry w CI** - Mniej false negatives
✅ **Screenshots on failure** - Debugging
✅ **Meaningful test names** - Czytelność
✅ **Cleanup after tests** - Fixtures/hooks
✅ **Mock external APIs** - Stabilność

### 12.2 Don'ts

❌ **Nie używaj sleep/wait** - Używaj waitFor\*
❌ **Nie hardcode URLs** - baseURL w config
❌ **Nie używaj CSS selectors** - ARIA-first
❌ **Nie share state between tests** - Izolacja
❌ **Nie ignoruj flaky tests** - Napraw natychmiast
❌ **Nie skip tests** - Investigate i fix
❌ **Nie używaj test.only** - CI forbids
❌ **Nie test implementation details** - User perspective
❌ **Nie duplikuj logic** - Helpers i POM
❌ **Nie commit .env z secrets** - .env.sample only

### 12.3 Debugging Tips

1. **Headful mode:**

   ```bash
   npx playwright test --headed
   ```

2. **Debug pojedynczego testu:**

   ```bash
   npx playwright test --debug search.spec.ts
   ```

3. **UI Mode:**

   ```bash
   npx playwright test --ui
   ```

4. **Trace Viewer:**

   ```bash
   npx playwright show-trace trace.zip
   ```

5. **Console logs:**
   ```typescript
   await page.on("console", (msg) => console.log(msg.text()));
   ```

---

## 13. Dokumentacja dla Zespołu

### 13.1 Uruchamianie Testów Lokalnie

```bash
# Wszystkie testy
npm run test:e2e

# Konkretny plik
npx playwright test tests/e2e/auth/login.spec.ts

# Konkretny projekt (browser)
npx playwright test --project=chromium

# Headed mode (z UI przeglądarki)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# UI mode (interaktywny)
npx playwright test --ui

# Tylko failed tests
npx playwright test --last-failed
```

### 13.2 Tworzenie Nowego Testu

**Krok 1:** Określ User Story i Test Case z planu testów

**Krok 2:** Utwórz/rozszerz Page Object

```typescript
// tests/pages/NewFeaturePage.ts
import { BasePage } from "./BasePage";

export class NewFeaturePage extends BasePage {
  // Selectors
  readonly mainElement = this.page.getByRole("main");

  // Actions
  async doSomething() {
    await this.mainElement.click();
  }

  // Assertions
  async expectSomething() {
    await expect(this.mainElement).toBeVisible();
  }
}
```

**Krok 3:** Napisz test

```typescript
// tests/e2e/feature/new-feature.spec.ts
import { test, expect } from "@playwright/test";
import { NewFeaturePage } from "../../pages/NewFeaturePage";

test.describe("New Feature - US-XXX", () => {
  test("TC-XXX-001: should do something", async ({ page }) => {
    const featurePage = new NewFeaturePage(page);
    await featurePage.goto();

    await featurePage.doSomething();

    await featurePage.expectSomething();
  });
});
```

**Krok 4:** Uruchom i zweryfikuj

```bash
npx playwright test new-feature.spec.ts --headed
```

### 13.3 Troubleshooting

**Problem:** Test fails with timeout
**Rozwiązanie:** Zwiększ timeout lub używaj waitFor\* methods

**Problem:** Flaky test (czasami pass, czasami fail)
**Rozwiązanie:**

- Sprawdź race conditions
- Dodaj explicit waits
- Sprawdź network requests
- Użyj retry logic dla specific assertions

**Problem:** Element not found
**Rozwiązanie:**

- Sprawdź czy element jest na stronie (screenshot)
- Sprawdź czy selector jest poprawny
- Sprawdź czy element jest w shadow DOM
- Użyj `page.pause()` do debugowania

**Problem:** Test działa lokalnie ale nie w CI
**Rozwiązanie:**

- Sprawdź environment variables
- Sprawdź timeouts (może być wolniejsze w CI)
- Sprawdź viewport size
- Sprawdź czy Supabase local działa w CI

---

## 14. Podsumowanie

### 14.1 Kluczowe Deliverables

Po zakończeniu implementacji plan dostarczy:

✅ **45+ testów E2E** pokrywających wszystkie user stories
✅ **Page Object Model** dla łatwej maintainability
✅ **Fixtures i helpers** dla reusable logic
✅ **CI/CD integration** z GitHub Actions
✅ **Multi-browser testing** (Chromium, Firefox, WebKit)
✅ **Responsive testing** (Desktop, Tablet, Mobile)
✅ **Accessibility testing** (axe-core, keyboard nav)
✅ **Comprehensive reporting** (HTML, JSON, GitHub Actions)
✅ **Dokumentacja** dla zespołu
✅ **Stabilna suita** (<2% flaky rate)

### 14.2 Oczekiwane Rezultaty

- **100% pokrycia** kluczowych user stories (US-001 do US-006)
- **< 15 min** czas wykonania pełnej suity w CI/CD
- **≥ 95%** test pass rate
- **Zero critical bugs** w produkcji wykrywanych przez E2E
- **Szybki feedback** dla developerów (<10 min od commit)
- **Łatwe utrzymanie** dzięki POM i fixtures

### 14.3 Następne Kroki

1. **Approval planu** przez Tech Lead i zespół
2. **Setup środowiska** (Faza 1)
3. **Rozpoczęcie implementacji** według harmonogramu
4. **Weekly sync** dla statusu i blockerów
5. **Milestone reviews** po każdej fazie

---

**Data utworzenia:** 2025-10-15
**Wersja:** 1.0
**Autor:** Claude Code (AI Assistant)
**Status:** Draft - Do przeglądu i zatwierdzenia

**Kontakt:** arturpasiut@example.com
**Repository:** https://github.com/arturpasiut/10x-poke-sky
