# Changelog

## 2025-10-09

### Added

- Interaktywny widok Pokédex (`/pokemon`) z pełną hierarchią komponentów, obsługą filtrów, sortowania i synchronizacją URL.
- Dedykowane style (`src/styles/pokemon.css`) i gradientowe karty Pokémonów w siatce.
- Hooki `usePokemonFilterOptions` i `usePokemonListQuery` agregujące dane oraz obsługujące błędy i retry.

### Testing

- Konfiguracja Vitest + React Testing Library wraz z testami jednostkowymi dla kluczowych komponentów i hooka.
- Wprowadzenie Playwrighta oraz smoke testu sprawdzającego nagłówek i wyszukiwarkę widoku Pokédex.

### Tooling

- Skrypty `npm run test`, `npm run test:coverage`, `npm run test:e2e` oraz dokumentacja uruchamiania testów.
