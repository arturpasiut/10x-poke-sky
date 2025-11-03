# 10x Poke Sky

10x Poke Sky to aplikacja typu Pokédex rozwijana w Astro i React. Łączy dane z publicznego PokeAPI, Supabase oraz moduły AI, aby ułatwić wyszukiwanie Pokémonów, budowanie kolekcji i eksperymentowanie z rekomendacjami.

## Najważniejsze funkcje
- Interaktywny Pokédex z filtrowaniem po typie, regionie i generacji, sortowaniem oraz synchronizacją stanu z parametrami URL.
- Karta Pokémona ze statystykami, zestawieniem ruchów, rozgałęzionymi ewolucjami i możliwością dodania do ulubionych (po zalogowaniu).
- Widok ruchów z filtrowaniem po typach, klasach obrażeń, regionach oraz przedziałach mocy.
- Wyszukiwarka łańcuchów ewolucji z timeline'em, preferencjami wizualnymi i szybkim przejściem do kart.
- Czat AI, który na podstawie opisu próbuje wskazać pasujące Pokemony (OpenRouter/Gemini, fallback do mocków przy braku kluczy).
- Obsługa kont użytkowników (rejestracja, logowanie, reset hasła) oraz lista ulubionych zsynchronizowana z Supabase.
- W przygotowaniu: widok lokacji i panel ustawień – aktualnie na stronach `/locations` i `/settings` znajdują się placeholdery.

## Technologia
- Astro 5 + React 19 (SSR + wyspy dla interaktywnych widoków).
- TypeScript 5, Zustand i dedykowane hooki do zapytań HTTP oraz synchronizacji stanu z URL.
- Tailwind CSS 4 i własne design tokens (konfiguracja w `components.json`).
- Supabase (auth, RLS, edge functions w `supabase/functions` do cache'owania danych PokeAPI).
- Vitest + Testing Library, Playwright i MSW do testów; ESLint oraz Prettier pilnują spójności kodu.

## Wymagania
- Node.js 22 (plik `.nvmrc`).
- npm 10+.
- Opcjonalnie Supabase CLI i Docker, jeżeli chcesz uruchomić lokalną instancję bazy.

## Szybki start
1. `git clone <repo-url>`
2. `cd 10x-poke-sky`
3. `npm install`
4. `cp .env.sample .env` i uzupełnij:
   - `SUPABASE_URL` oraz `SUPABASE_KEY` – mogą wskazywać lokalną instancję z Supabase CLI lub pozostać testowe; są wymagane, aby middleware poprawnie inicjalizował sesję.
   - `POKEAPI_BASE_URL` i `USE_POKEAPI_MOCK` – domyślnie korzystamy z publicznego PokeAPI; włączenie mocków kieruje zapytania do lokalnych funkcji edge.
   - `OPENROUTER_API_KEY` / `GEMINI_API_KEY` – opcjonalne, odblokowują realne odpowiedzi w czacie AI.
   - `PLAYWRIGHT_BASE_URL` oraz dane testowych kont – wykorzystywane w scenariuszach e2e.
5. (Opcjonalnie) `supabase start` i `supabase db reset`, aby uruchomić lokalną bazę z migracjami z `supabase/migrations`; funkcje edge znajdują się w `supabase/functions`.
6. `npm run dev` i otwórz `http://localhost:4321`.

## Przydatne skrypty
- `npm run dev` – tryb developerski Astro.
- `npm run build` / `npm run preview` – budowanie i podgląd produkcyjny.
- `npm run lint` oraz `npm run lint:fix` – analiza i automatyczne poprawki zgodnie z ESLint/Prettier.
- `npm run test` / `npm run test:coverage` – testy jednostkowe oraz raport pokrycia (Vitest + Testing Library).
- `npm run test:e2e` – scenariusze Playwright (wymagają działającego dev servera i danych z `.env`).
- `npm run dev:e2e` – uruchamia Astro w trybie testowym na potrzeby Playwright.

## Struktura projektu
```text
src/
  components/      widoki UI dla pokedexu, ewolucji, ruchów, AI i auth
  hooks/           logika zapytań oraz synchronizacja filtrów z URL
  lib/             warstwa domenowa (pokemon, moves, evolution, profile, api)
  pages/           strony Astro (home, pokedex, favorites, auth, ai, etc.)
  stores/          magazyny Zustand do zarządzania filtrami i stanem UI
supabase/
  migrations/      schemat bazy i polityki RLS
  functions/       edge functions używane przez aplikację i testy
tests/             Vitest + Playwright wraz z fixture'ami
```

## Jakość i testy
- Komponenty i hooki mają testy w `src/**/__tests__` oraz raporty w `coverage/`.
- Testy e2e w `tests/e2e/` obejmują podstawowe ścieżki Pokédexu i ulubionych.
- `msw` mockuje integracje z zewnętrznymi API podczas testów.

## Licencja
MIT
