# Plan Realizacji Projektu: 10x-poke-sky

## Cel
Ten plan opisuje, jak rozbudować obecną bazę Astro do pełnej wersji 10x-poke-sky, spełniającej wymagania z `project-prd-codex.md`. Każda faza zawiera kolejne kroki, oczekiwane rezultaty i kryteria przekazania, tak aby dowolny deweloper lub agent AI mógł przejąć pracę w dowolnym momencie.

## Zasady przewodnie
1. Dostarczaj wartość użytkownikom iteracyjnie, utrzymując repozytorium w stanie gotowym do releasu.
2. Zakres produktu opisuje PRD; ten dokument rozkłada go na działania.
3. Zachowaj zgodność schematu Supabase, modeli TypeScript i kontraktów UI.
4. Dbaj o wydajność, dostępność i bezpieczeństwo w trakcie prac, nie odkładaj poprawek na koniec.

## Kamienie milowe
| Faza | Zakres | Ukończone, gdy |
| --- | --- | --- |
| 0 | Środowisko i architektura | Skonfigurowano Supabase, pliki env, fundament design systemu |
| 1 | Layout, routing, komponenty wspólne | Działają trasy Astro, layouty, nawigacja i store Zustand |
| 2 | Dane i cache | Supabase cache’uje dane Pokemonów z walidacją ścieżki odświeżania |
| 3 | Odkrywanie Pokemonów (US-001) | Lista z filtrami i testami działa, brak wyników kieruje do AI |
| 4 | Szczegóły Pokemona (US-002) | Widok statystyk, ewolucji, ruchów i CTA ulubionych gotowy |
| 5 | Autoryzacja (US-005) | Logowanie i rejestracja z Supabase, polityki dostępu wymuszają ochronę |
| 6 | Ulubione (US-003) | Dodawanie/usuwanie ulubionych działa, trasa chroniona, testy przechodzą |
| 7 | Katalog ruchów (US-006) | Strona ruchów z sortowaniem, zapamiętywaniem filtrów |
| 8 | Czat AI (US-004) | Gemini rozpoznaje Pokemony i sugeruje trafne wyniki |
| 9 | Jakość i niezawodność | Audyty wydajności, dostępności, bezpieczeństwa zaliczone |
| 10 | Release i przekazanie | CI/CD, dokumentacja, checklist launchowa ukończone |

## Faza 0 – Przygotowanie fundamentów
1. [x] Przejrzyj repo (layouty, komponenty, konfiguracje) i usuń treści demo, zostawiając przydatne utility.
2. [x] Utwórz `.env` oraz `.env.sample` z danymi Supabase, PokeAPI i Gemini; dodaj walidację środowiska w `src/lib/env.ts`.
3. [x] Załóż projekt Supabase, ustaw parametry auth i utwórz tabele `profiles`, `favorites`, `pokemon_cache`, `moves_cache`, `ai_queries` wraz z politykami RLS ograniczającymi dostęp do właściciela rekordu.
4. [x] Skonfiguruj Edge Functions Supabase (lub REST) do pobierania danych o Pokemonach i umieść je w `supabase/functions`.
5. [x] Dostosuj tooling (opcjonalnie Storybook) i skonfiguruj Tailwind zgodnie z tokenami projektowymi z zespołu designu.
6. [x] Zaktualizuj README o kroki uruchomienia lokalnego i upewnij się, że `npm run dev` działa z placeholderami.
 
## Faza 1 – Layout, routing, komponenty współdzielone
1. [x] Zdefiniuj layouty Astro (`MainLayout`, `AuthLayout`) i podepnij trasy `index`, `pokemon/[identifier]`, `moves`, `favorites`, `auth/login`, `auth/register`, `auth/forgot`.
2. [x] Zaimplementuj globalną nawigację, stopkę oraz responsywne siatki zgodne z tokenami Tailwind.
3. [x] Dodaj sklepy Zustand: `useSessionStore` (stan Supabase) i `useUiStore` (flag UI).
4. [x] Utwórz komponenty UI wielokrotnego użytku (przyciski, karty, badge, zakładki, modal) oraz, jeśli to możliwe, dokumentację w Storybook/MDX.
5. [x] Dopnij automaty `npm run lint` i formatowanie (Husky, lint-staged) oraz potwierdź, że przechodzą lokalnie.
6. [-] Przygotuj zrzuty ekranów layoutu lub testy wizualne Playwright do akceptacji designu.

## Faza 2 – Integracja danych i cache
1. [x] Wygeneruj typy TypeScript dla odpowiedzi PokeAPI (np. przy pomocy OpenAPI) i umieść je w `src/lib/types/pokemon.ts`.
2. [x] Zbuduj wrapper HTTP w `src/lib/api/pokeapi.ts` z retry, timeoutem i normalizacją błędów.
3. [x] Napisz funkcję edge `fetch-pokemon-list`, która sprawdza `pokemon_cache`, odświeża wpisy starsze niż 24h i zwraca paginowane wyniki.
4. [x] Zaimplementuj funkcję edge `fetch-pokemon-details` dla pojedynczego Pokemona, ruchów i ewolucji z analogicznym cachingiem.
5. [x] Dodaj nocny cron Supabase odświeżający najpopularniejszych Pokemonów i ruchy (lista w tabeli konfiguracyjnej).
6. [x] Wprowadź lokalny cache w przeglądarce (IndexedDB/LocalStorage) dla ostatniej listy i obsługę hydracji w hooku React.
7. [x] Przygotuj testy Vitest obejmujące logikę TTL cache i transformatory danych (porównanie z typami).

## Faza 3 – Odkrywanie Pokemonów (US-001)
1. [x] Zbuduj widok główny listy korzystający z `fetch-pokemon-list` z paginacją lub „infinite scroll” zgodnie z designem.
2. [x] Zaimplementuj pole wyszukiwania z debounce, powiązane z parametrami URL; korzystaj z meta danych filtrów przechowywanych w Supabase.
3. [x] Wyświetlaj kontrolki filtrów (typ, generacja, region) aktualizujące zapytanie listy.
4. [x] Obsłuż stany pusty/błąd, wyświetlając sugestię przejścia do czatu AI przy braku wyników.
5. [x] Dodaj testy Vitest + RTL dla paska wyszukiwania, reduktora filtrów i renderowania kart.
6. [x] Napisz scenariusz Playwright obejmujący wyszukiwanie, kombinacje filtrów i wyświetlanie komunikatu „brak wyników”.

## Faza 4 – Szczegóły Pokemona (US-002)
1. [x] Skonfiguruj dynamiczną trasę `pokemon/[identifier]` w Astro, pobierając dane po stronie serwera przez warstwę cache.
2. [x] Zbuduj nagłówek (grafika, nazwa, typy) i dodaj akcje (CTA ulubionych dla zalogowanych albo przekierowanie do logowania).
3. [x] Zaimplementuj sekcję statystyk (paski lub wykres radarowy) z weryfikacją wartości względem PokeAPI.
4. [x] Wyświetl linię ewolucji i listę ruchów, korzystając z cache ruchów dla wydajności.
5. [x] Dodaj breadcrumbs lub przycisk powrotu do ostatnich wyników wyszukiwania.
6. Przygotuj testy jednostkowe transformacji (normalizacja statystyk, parsowanie ewolucji) i scenariusz Playwright od wyszukiwarki do detalu.

## Faza 5 – Autoryzacja (US-005)
1. Podłącz klienta Supabase w warstwie Astro (SSR) oraz w kontekście React, aby śledzić sesję.
2. Zbuduj formularz rejestracji (React Hook Form + Zod) z walidacją po obu stronach.
3. Utwórz formularz logowania z opcją zapamiętania użytkownika i bezpiecznym przekierowaniem.
4. Dodaj wylogowanie dostępne z globalnej nawigacji z optymistycznym feedbackiem UI.
5. W `auth/forgot` pokaż jasny komunikat o braku funkcji resetu hasła oraz ewentualny link kontaktowy.
6. Napisz scenariusze Playwright: rejestracja, logowanie, wylogowanie, próba wejścia na trasę chronioną bez sesji.

## Faza 6 – Ulubione (US-003)
1. Potwierdź, że polityki RLS tabeli `favorites` dopuszczają tylko operacje właściciela; przetestuj w Supabase SQL Editor.
2. Zaimplementuj hook `useFavorites` do listowania, dodawania i usuwania ulubionych z optymistyczną aktualizacją.
3. Dodaj przycisk ulubionych do kafli i strony szczegółów; bez sesji kieruj do logowania.
4. Zbuduj stronę `/favorites` z listą, filtrowaniem i sortowaniem spójnym z widokiem głównym.
5. Zapewnij paginację serwerową i ewentualnie cache, aby uniknąć dużego obciążenia przy wielu rekordach.
6. Pokryj hook testami Vitest (mock Supabase) i scenariuszem Playwright dodawania/usuwania ulubionych.

## Faza 7 – Katalog ruchów (US-006)
1. Rozszerz cache Supabase o metadane ruchów, uwzględniając typ, region i parametry mocy.
2. Stwórz stronę `/moves` z wirtualizowaną tabelą lub siatką, aby obsłużyć duże zestawy danych.
3. Dodaj sortowanie po typie, regionie i mocy oraz zapisywanie filtrów w URL i LocalStorage.
4. Wprowadź skróty do kart Pokemona (np. liczba pokemonów uczących się ruchu, link do filtrowanego wyszukiwania).
5. Zweryfikuj poprawność danych względem PokeAPI na próbkach podczas QA.
6. Przygotuj testy jednostkowe logiki sortowania i scenariusz Playwright dla kombinacji filtrów.

## Faza 8 – Czat rozpoznający Pokemony (US-004)
1. Dodaj abstrakcję klienta AI w `src/lib/ai/client.ts` z interfejsem umożliwiającym podmianę dostawcy (Gemini teraz, OpenRouter później).
2. Zaimplementuj integrację z Gemini (klucz w Supabase secrets, wrapper HTTP z obsługą streamingu jeśli dostępny).
3. Opracuj szablon promptu, który łączy opis użytkownika ze zwięzłym kontekstem danych PokeAPI dla lepszej celności.
4. Zbuduj UI czatu z historią, wskaźnikami ładowania, przyciskiem ponów i kartami sugestii prowadzącymi do szczegółów Pokemona.
5. Dodaj zabezpieczenia: odrzuć zapytania niezwiązane ze światem Pokemon, ogranicz liczbę tokenów, oczyść wrażliwe wejścia.
6. Loguj zapytania w `ai_queries` wraz z wynikiem, czasem i limitem rate (np. 10/min na użytkownika) wymuszanym po stronie funkcji edge.
7. Napisz testy Vitest dla generatora promptów i parsera odpowiedzi oraz scenariusz Playwright dla pozytywnego rozpoznania.

## Faza 9 – Jakość, wydajność, dostępność, bezpieczeństwo
1. Optymalizuj zasoby: Astro Image, tree-shaking Tailwind (`@layer`), code-splitting tras w razie potrzeby.
2. Uruchom Lighthouse i WebPageTest, zapisuj wyniki (JSON) w repo i popraw regresje, aby spełniać SLA z PRD.
3. Przeprowadź audyty dostępności (axe, testy screen reader) i napraw błędy focusu, ARIA, kontrastów.
4. Dodaj nagłówki bezpieczeństwa w middleware Astro, waliduj wejścia i sprawdź polityki Supabase pod kątem wycieków.
5. Ustaw monitoring i alerty: logi Supabase, Cloudflare Analytics, narzędzie do śledzenia błędów (np. Sentry) oraz dashboard KPI.
6. Zaktualizuj dokumentację o tuning wydajności i znane ograniczenia dla przyszłych opiekunów projektu.

## Faza 10 – Release i przekazanie
1. Dokończ workflow GitHub Actions uruchamiający lint, testy jednostkowe, integracyjne i Playwright na PR oraz gałęzi głównej.
2. Skonfiguruj deployment na Cloudflare Pages z gałęzi `main`, ustawiając zmienne środowiskowe produkcji.
3. Przeprowadź testy RC: smoke testy kluczowych ścieżek, weryfikacja cronów cache, kontrola limitów Gemini.
4. Przygotuj release notes z podsumowaniem funkcji, ograniczeń i kolejnych kroków; uzyskaj akceptację interesariuszy.
5. Opracuj runbook operacyjny: procedury incydentów, kopie zapasowe Supabase, harmonogram monitorowania kosztów AI.
6. Otaguj wersję `v1.0.0` w repozytorium i przejdź do trybu utrzymania z backlogiem usprawnień po starcie.

## Zalecany sposób prowadzenia zadań
1. Twórz issue w GitHub dla każdego numerowanego kroku; linkuj do tego dokumentu i przypisuj odpowiedzialnych.
2. Realizuj fazy sekwencyjnie, odkładając start prac nad AI do momentu ustabilizowania core’owych funkcji.
3. Po każdym kroku aktualizuj tablicę statusów i dopilnuj, by testy nowych funkcji były scalone przed przejściem dalej.

## Wskazówki do pracy z AI
1. Rozpoczynając sesję, znajdź bieżącą fazę i najwyższy niedokończony krok; zajmij się nim lub wesprzyj w realizacji.
2. Zanim uruchomisz skrypty zależne od usług, potwierdź ustawienia zmiennych środowiskowych i połączenie z Supabase.
3. W razie wątpliwości sięgnij do `project-prd-codex.md` i tego planu, a pytania eskaluj do właściciela produktu.
4. Po wykonaniu zadania opisz rezultat w commicie i zaktualizuj plan, jeśli zakres lub ryzyka się zmieniły.
