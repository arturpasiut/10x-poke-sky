# Feature Flags Plan

## Cele
- Rozdzielić deploymenty od releasów za pomocą flag funkcjonalności.
- Zapewnić wspólny moduł TypeScript dostępny na backendzie i frontendzie.
- Obsłużyć środowiska `local`, `integration`, `prod` z fallbackiem na `local`.

## Plan wdrożenia
1. Utworzyć moduł `src/features/featureFlags.ts` przechowujący konfigurację flag (`auth`, `collections`) i helpery `getEnvName`, `getFeatureFlags`, `isFeatureEnabled`, `assertFeatureEnabled`.
2. Skonfigurować źródła środowiska (`ENV_NAME` z `.env`, `process.env`, `import.meta.env`) i zadbać o fallback na `local` przy nieznanej wartości.
3. Zaimplementować wykorzystanie flag na endpointach API (kolekcje, auth) przez sprawdzenie `assertFeatureEnabled` lub `isFeatureEnabled` przed logiką biznesową.
4. Zintegrować flagi na stronach Astro (`src/pages/auth/login.astro`, `src/pages/auth/register.astro`, `src/pages/auth/forgot.astro`) ukrywając lub przekierowując w zależności od stanu flagi `auth`.
5. Wprowadzić kontrolę widoczności kolekcji w UI oraz API na bazie flagi `collections`, w tym obsługę fallbacków.
6. Dodać testy jednostkowe modułu `featureFlags` (np. Vitest) i testy integracyjne krytycznych ścieżek, aby potwierdzić zachowanie w każdym środowisku.

## Dodatkowe uwagi
- Przechowuj domyślne wartości flag w repo (statyczna konfiguracja), ale umożliwiaj nadpisanie przez `.env` jeśli zajdzie potrzeba w przyszłości.
- Dokumentuj nowe flagi oraz ich wpływ w README lub changelogu, aby ułatwić zarządzanie releasami.
- W przyszłości rozważ panel administracyjny lub system zdalnej konfiguracji, jeśli liczba flag wzrośnie.
