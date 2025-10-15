# Plan Testów - 10x-poke-sky

## 1. Zakres i cele testów

### 1.1 Cel testowania
Zapewnienie wysokiej jakości aplikacji webowej 10x-poke-sky poprzez weryfikację wszystkich kluczowych funkcjonalności, wydajności, bezpieczeństwa i zgodności z wymaganiami biznesowymi określonymi w PRD.

### 1.2 Zakres testów - CO BĘDZIE TESTOWANE

#### Frontend (Astro + React)
- Wszystkie strony Astro (routing, SSR, renderowanie)
- Interaktywne komponenty React (stan, interakcje użytkownika)
- Responsywność UI (desktop, tablet, mobile)
- Walidacja formularzy i obsługa błędów
- Zarządzanie stanem (Zustand)
- Integracja komponentów UI (shadcn/ui)

#### Backend i API
- Endpointy API Astro (`/api/*`)
- Autentykacja i autoryzacja (Supabase Auth)
- Operacje CRUD na bazie danych PostgreSQL
- Integracja z PokeAPI
- Integracja z OpenRouter.ai (AI)
- Middleware i ochrona CSRF

#### Funkcjonalności kluczowe (User Stories)
- **US-001**: Wyszukiwanie pokemonów (nazwa, typ, generacja, region)
- **US-002**: Wyświetlanie szczegółów pokemona (statystyki, ewolucje, ruchy)
- **US-003**: Zarządzanie ulubionymi pokemonami (dodawanie/usuwanie)
- **US-004**: Czat AI do rozpoznawania pokemonów
- **US-005**: Rejestracja, logowanie, wylogowanie, reset hasła
- **US-006**: Przeglądanie i filtrowanie ruchów pokemonów

#### Bezpieczeństwo
- Ochrona przed XSS, CSRF, SQL Injection
- Bezpieczne przechowywanie haseł (bcrypt via Supabase)
- Weryfikacja tokenów JWT
- Walidacja danych wejściowych (Zod)

#### Wydajność
- Czas ładowania strony głównej < 2s
- Czas odpowiedzi wyszukiwania < 1s
- Optymalizacja zapytań do bazy danych
- Cache'owanie danych z PokeAPI

### 1.3 Zakres testów - CO NIE BĘDZIE TESTOWANE

- Zaawansowane funkcje wyszukiwania wykraczające poza MVP
- Grupowanie pokemonów (według typów, regionów, ewolucji)
- Rozbudowane funkcje społeczne (komentarze, dzielenie się, rankingi)
- Szczegółowe informacje o ruchach (poza MVP - US-006 nice to have)
- Testowanie wydajności pod ekstremalnym obciążeniem (load testing)
- Testy penetracyjne i audyty bezpieczeństwa (poza zakresem MVP)
- Kompatybilność z przeglądarkami starszymi niż 2 lata

## 2. Rodzaje testów

### 2.1 Testy jednostkowe (Unit Tests) - Vitest + React Testing Library
- **Cel**: Weryfikacja poprawności działania pojedynczych funkcji, hooków i komponentów w izolacji
- **Zakres**:
  - Komponenty React (UI logic, props, state)
  - Custom hooki (usePokemonListQuery, useAiChatSession, itp.)
  - Funkcje pomocnicze i transformatory danych
  - Walidatory (Zod schemas)
  - Mappers i filtry
- **Narzędzia**: Vitest, React Testing Library, @testing-library/dom, MSW
- **Pokrycie kodu**: Cel minimalny 70%, optymalny 85%

### 2.2 Testy integracyjne (Integration Tests) - Vitest + MSW
- **Cel**: Weryfikacja współpracy między modułami, komponentami i API
- **Zakres**:
  - Integracja komponentów React z hookami i store'ami (Zustand)
  - Komunikacja frontend-backend (API endpoints)
  - Integracja z Supabase (auth, database operations)
  - Integracja z PokeAPI (mock'owane przez MSW)
  - Integracja z OpenRouter.ai (mock'owane przez MSW)
  - Flow autentykacji (login, register, logout, reset password)
- **Narzędzia**: Vitest, MSW (Mock Service Worker), Supabase test client

### 2.3 Testy end-to-end (E2E Tests) - Playwright
- **Cel**: Symulacja pełnych ścieżek użytkownika w przeglądarce
- **Zakres**:
  - Krytyczne user stories (US-001 do US-006)
  - Flow rejestracji i logowania
  - Wyszukiwanie, filtrowanie i paginacja pokemonów
  - Wyświetlanie szczegółów pokemona
  - Dodawanie/usuwanie ulubionych
  - Interakcja z czatem AI
  - Responsywność na różnych urządzeniach (desktop, tablet, mobile)
  - Testowanie w Chrome, Firefox, Safari (Webkit)
- **Narzędzia**: Playwright
- **Automatyzacja**: Uruchamianie w pipeline CI/CD (GitHub Actions)

### 2.4 Testy API (API Tests) - Vitest
- **Cel**: Weryfikacja poprawności endpointów API
- **Zakres**:
  - Wszystkie endpointy `/api/*`
  - Walidacja request/response (status codes, headers, body)
  - Obsługa błędów (400, 401, 403, 404, 422, 500)
  - Autoryzacja i dostęp do chronionych zasobów
  - Rate limiting (jeśli zaimplementowany)
- **Narzędzia**: Vitest

### 2.5 Testy bezpieczeństwa (Security Tests) - Manualne
- **Cel**: Identyfikacja luk bezpieczeństwa
- **Zakres**:
  - Weryfikacja ochrony CSRF
  - Testowanie sanityzacji danych wejściowych (XSS)
  - Weryfikacja tokenów JWT i sesji
  - Testowanie flow resetowania hasła
  - Weryfikacja haszowania haseł (inspekcja bazy danych)
- **Narzędzia**: Manualne testowanie

### 2.6 Testy wydajności (Performance Tests) - Lighthouse CI
- **Cel**: Weryfikacja spełnienia wymagań niefunkcjonalnych dotyczących wydajności
- **Zakres**:
  - Czas ładowania strony głównej < 2s
  - Czas odpowiedzi wyszukiwania < 1s
  - Core Web Vitals (LCP, FID, CLS)
  - Optymalizacja obrazów i assetsów
- **Narzędzia**: Lighthouse CI

### 2.7 Testy dostępności (Accessibility Tests) - axe-core, Playwright
- **Cel**: Zapewnienie zgodności z WCAG 2.1 poziom AA
- **Zakres**:
  - Nawigacja klawiaturą
  - Wsparcie dla screen readerów
  - Kontrasty kolorów
  - Struktura semantyczna HTML
  - Etykiety formularzy i komunikaty błędów
- **Narzędzia**: axe-core, Playwright accessibility testing, WAVE

### 2.8 Testy responsywności (Responsive Tests) - Playwright
- **Cel**: Weryfikacja poprawnego wyświetlania na różnych urządzeniach
- **Zakres**:
  - Desktop (1920x1080, 1366x768)
  - Tablet (768x1024, 1024x768)
  - Mobile (375x667 iPhone, 360x640 Android)
  - Orientacja portrait i landscape
- **Narzędzia**: Playwright viewports, Chrome DevTools

## 3. Scenariusze testowe

### 3.1 Autentykacja i autoryzacja

#### TC-AUTH-001 - Rejestracja nowego użytkownika (Wysoki)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Przejdź do `/auth/register`
  2. Wypełnij formularz: email (test@example.com), hasło (Haslo123!), powtórz hasło (Haslo123!)
  3. Kliknij przycisk "Zarejestruj się"
  4. Sprawdź czy wyświetla się komunikat sukcesu
  5. Sprawdź czy otrzymano email potwierdzający (w środowisku testowym sprawdź Supabase)
- **Oczekiwane rezultaty**:
  - Użytkownik zostaje zarejestrowany w bazie danych
  - Wyświetla się komunikat "Zarejestrowano pomyślnie. Sprawdź email aby potwierdzić konto."
  - Email potwierdzający został wysłany
- **Priorytet**: Wysoki

#### TC-AUTH-002 - Walidacja formularza rejestracji (Średni)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Przejdź do `/auth/register`
  2. Wypełnij formularz z nieprawidłowymi danymi:
     - Email: "nieprawidlowy-email"
     - Hasło: "123" (za krótkie)
     - Powtórz hasło: "456" (niezgodne)
  3. Kliknij przycisk "Zarejestruj się"
- **Oczekiwane rezultaty**:
  - Wyświetlają się komunikaty błędów walidacji
  - Formularz nie zostaje wysłany
  - Użytkownik nie zostaje zarejestrowany
- **Priorytet**: Średni

#### TC-AUTH-003 - Logowanie z poprawnymi danymi (Wysoki)
- **Warunki wstępne**: Użytkownik ma aktywne konto (email: test@example.com, hasło: Haslo123!)
- **Kroki**:
  1. Przejdź do `/auth/login`
  2. Wypełnij formularz: email (test@example.com), hasło (Haslo123!)
  3. Zaznacz checkbox "Zapamiętaj mnie"
  4. Kliknij przycisk "Zaloguj się"
- **Oczekiwane rezultaty**:
  - Użytkownik zostaje zalogowany
  - Przekierowanie na stronę główną `/`
  - W prawym górnym rogu widoczny email użytkownika
  - Sesja zostaje zapisana (cookie)
- **Priorytet**: Wysoki

#### TC-AUTH-004 - Logowanie z niepoprawnymi danymi (Wysoki)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Przejdź do `/auth/login`
  2. Wypełnij formularz: email (test@example.com), hasło (ZleHaslo123!)
  3. Kliknij przycisk "Zaloguj się"
- **Oczekiwane rezultaty**:
  - Wyświetla się komunikat błędu "Nieprawidłowy adres e-mail lub hasło."
  - Użytkownik nie zostaje zalogowany
  - Pozostaje na stronie logowania
- **Priorytet**: Wysoki

#### TC-AUTH-005 - Wylogowanie (Wysoki)
- **Warunki wstępne**: Użytkownik jest zalogowany
- **Kroki**:
  1. Kliknij przycisk "Wyloguj" w prawym górnym rogu
  2. Potwierdź wylogowanie (jeśli wymagane)
- **Oczekiwane rezultaty**:
  - Użytkownik zostaje wylogowany
  - Sesja zostaje usunięta
  - Przekierowanie na stronę logowania `/auth/login`
  - W prawym górnym rogu widoczny przycisk "Zaloguj się"
- **Priorytet**: Wysoki

#### TC-AUTH-006 - Reset hasła (Średni)
- **Warunki wstępne**: Użytkownik ma aktywne konto (email: test@example.com)
- **Kroki**:
  1. Przejdź do `/auth/login`
  2. Kliknij link "Zapomniałem hasła"
  3. Wypełnij formularz: email (test@example.com)
  4. Kliknij przycisk "Wyślij link resetujący"
  5. Sprawdź email (w środowisku testowym sprawdź Supabase)
  6. Kliknij link resetujący w emailu
  7. Wprowadź nowe hasło i potwierdź
  8. Zaloguj się z nowym hasłem
- **Oczekiwane rezultaty**:
  - Email z linkiem resetującym został wysłany
  - Link resetujący jest ważny (nie wygasł)
  - Hasło zostało zmienione
  - Użytkownik może zalogować się z nowym hasłem
- **Priorytet**: Średni

#### TC-AUTH-007 - Ochrona CSRF (Wysoki)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Wyślij request POST do `/api/auth/login` bez nagłówka Origin/Referer
  2. Sprawdź odpowiedź
- **Oczekiwane rezultaty**:
  - Odpowiedź: 403 Forbidden
  - Komunikat: "Nieautoryzowane źródło żądania."
- **Priorytet**: Wysoki

#### TC-AUTH-008 - Dostęp do chronionych zasobów bez logowania (Wysoki)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Spróbuj uzyskać dostęp do `/favorites`
  2. Sprawdź odpowiedź
- **Oczekiwane rezultaty**:
  - Przekierowanie na stronę logowania `/auth/login`
  - LUB wyświetlenie komunikatu "Zaloguj się, aby zobaczyć ulubione pokemony"
- **Priorytet**: Wysoki

### 3.2 Wyszukiwanie pokemonów (US-001)

#### TC-SEARCH-001 - Wyszukiwanie pokemona po nazwie (Wysoki)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. W polu wyszukiwania wpisz "pikachu"
  2. Naciśnij Enter lub poczekaj na autouzupełnianie
  3. Sprawdź wyniki wyszukiwania
- **Oczekiwane rezultaty**:
  - Wyświetla się lista pokemonów zawierających "pikachu" w nazwie
  - Pikachu jest na liście wyników
  - Każdy pokemon ma miniaturkę, nazwę, typ/typy
- **Priorytet**: Wysoki

#### TC-SEARCH-002 - Wyszukiwanie z pustym zapytaniem (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. Pole wyszukiwania pozostaw puste
  2. Sprawdź wyświetloną listę
- **Oczekiwane rezultaty**:
  - Wyświetla się pełna lista pokemonów (pierwsza strona z paginacją)
  - Domyślnie posortowane według ID pokemona (lub innej domyślnej kolejności)
- **Priorytet**: Średni

#### TC-SEARCH-003 - Filtrowanie po typie (Wysoki)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. Otwórz panel filtrów (przycisk "Filtry" lub panel boczny)
  2. Zaznacz typ "Electric"
  3. Kliknij "Zastosuj filtry"
- **Oczekiwane rezultaty**:
  - Wyświetla się lista pokemonów typu Electric
  - Każdy pokemon ma typ Electric (może mieć również drugi typ)
  - Liczba wyników jest zgodna z filtrem
- **Priorytet**: Wysoki

#### TC-SEARCH-004 - Filtrowanie po generacji (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. Otwórz panel filtrów
  2. Wybierz generację "1"
  3. Kliknij "Zastosuj filtry"
- **Oczekiwane rezultaty**:
  - Wyświetla się lista pokemonów z generacji 1 (Kanto)
  - Zakres ID pokemonów: 1-151
- **Priorytet**: Średni

#### TC-SEARCH-005 - Filtrowanie wielokryteriowe (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. Otwórz panel filtrów
  2. Zaznacz typ "Water"
  3. Wybierz generację "1"
  4. Kliknij "Zastosuj filtry"
- **Oczekiwane rezultaty**:
  - Wyświetla się lista pokemonów typu Water z generacji 1
  - Przykłady: Squirtle, Wartortle, Blastoise, Psyduck, Golduck, Poliwag, etc.
- **Priorytet**: Średni

#### TC-SEARCH-006 - Brak wyników wyszukiwania (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. W polu wyszukiwania wpisz "nieistniejacypokemon123"
  2. Naciśnij Enter
- **Oczekiwane rezultaty**:
  - Wyświetla się komunikat "Nie znaleziono pokemonów spełniających kryteria"
  - Sugestia: "Spróbuj użyć czatu AI, aby opisać pokemona"
  - Przycisk/link do czatu AI `/ai`
- **Priorytet**: Średni

#### TC-SEARCH-007 - Paginacja wyników (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`, wyniki wyszukiwania > 1 strona
- **Kroki**:
  1. Wyszukaj pokemony (lub pozostaw puste dla wszystkich)
  2. Przewiń do dołu strony
  3. Kliknij przycisk "Następna strona" lub numer strony "2"
  4. Sprawdź wyświetlone wyniki
- **Oczekiwane rezultaty**:
  - Wyświetla się druga strona wyników
  - Numer aktywnej strony: 2
  - Przyciski paginacji działają poprawnie (poprzednia, następna, numery stron)
  - URL zawiera parametr strony (np. `?page=2`)
- **Priorytet**: Średni

#### TC-SEARCH-008 - Sortowanie wyników (Niski)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. Kliknij rozwijane menu sortowania
  2. Wybierz "Nazwa (A-Z)"
  3. Sprawdź kolejność wyników
- **Oczekiwane rezultaty**:
  - Wyniki są posortowane alfabetycznie według nazwy (A-Z)
  - Pierwszy pokemon na liście: Abomasnow lub Abra (w zależności od danych)
- **Priorytet**: Niski

### 3.3 Szczegóły pokemona (US-002)

#### TC-DETAIL-001 - Wyświetlenie szczegółów pokemona (Wysoki)
- **Warunki wstępne**: Użytkownik jest na stronie `/pokemon`
- **Kroki**:
  1. Wyszukaj pokemona "Pikachu"
  2. Kliknij na kartę Pikachu z listy wyników
  3. Sprawdź stronę szczegółów
- **Oczekiwane rezultaty**:
  - Przekierowanie na `/pokemon/pikachu` lub `/pokemon/25`
  - Wyświetla się:
    - Obraz pokemona (sprite)
    - Nazwa: Pikachu
    - Typ/typy: Electric
    - Podstawowe statystyki: HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed
    - Sekcja ewolucji (Pichu → Pikachu → Raichu)
    - Lista ruchów pokemona (minimum kilka wyświetlonych)
  - Przycisk "Dodaj do ulubionych" (jeśli zalogowany) lub "Zaloguj się, aby dodać do ulubionych"
- **Priorytet**: Wysoki

#### TC-DETAIL-002 - Wyświetlenie ewolucji pokemona (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie szczegółów pokemona z ewolucjami (np. Charmander)
- **Kroki**:
  1. Przejdź do `/pokemon/charmander`
  2. Przewiń do sekcji "Ewolucje"
  3. Sprawdź wyświetlone informacje
- **Oczekiwane rezultaty**:
  - Wyświetla się timeline/graf ewolucji: Charmander → Charmeleon (level 16) → Charizard (level 36)
  - Każdy pokemon w łańcuchu ewolucji ma miniaturkę
  - Warunki ewolucji są wyświetlone (jeśli dostępne)
- **Priorytet**: Średni

#### TC-DETAIL-003 - Wyświetlenie ruchów pokemona (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie szczegółów pokemona (np. Pikachu)
- **Kroki**:
  1. Przejdź do `/pokemon/pikachu`
  2. Przewiń do sekcji "Ruchy"
  3. Sprawdź wyświetlone informacje
- **Oczekiwane rezultaty**:
  - Wyświetla się lista ruchów pokemona
  - Każdy ruch ma: nazwę, typ, moc, dokładność
  - Ruchy mogą być posortowane/filtrowane (jeśli zaimplementowane)
- **Priorytet**: Średni

#### TC-DETAIL-004 - Powrót do listy wyszukiwania (Niski)
- **Warunki wstępne**: Użytkownik jest na stronie szczegółów pokemona
- **Kroki**:
  1. Kliknij przycisk "Wróć" lub "Powrót do listy" lub nawigacja wstecz przeglądarki
- **Oczekiwane rezultaty**:
  - Powrót do poprzedniej strony z wynikami wyszukiwania
  - Zachowanie filtrów i strony (jeśli zaimplementowane)
- **Priorytet**: Niski

#### TC-DETAIL-005 - Bezpośredni dostęp do szczegółów pokemona (Średni)
- **Warunki wstępne**: Brak
- **Kroki**:
  1. Wpisz w przeglądarce URL `/pokemon/charizard`
  2. Naciśnij Enter
- **Oczekiwane rezultaty**:
  - Strona szczegółów Charizarda ładuje się poprawnie
  - Wszystkie dane są wyświetlone (jak w TC-DETAIL-001)
- **Priorytet**: Średni

#### TC-DETAIL-006 - Obsługa nieistniejącego pokemona (Niski)
- **Warunki wstępne**: Brak
- **Kroki**:
  1. Wpisz w przeglądarce URL `/pokemon/nieistniejacypokemon`
  2. Naciśnij Enter
- **Oczekiwane rezultaty**:
  - Wyświetla się strona błędu 404
  - Komunikat: "Pokemon nie został znaleziony"
  - Link/przycisk do powrotu na stronę główną lub wyszukiwania
- **Priorytet**: Niski

### 3.4 Ulubione pokemony (US-003)

#### TC-FAV-001 - Dodanie pokemona do ulubionych (Wysoki)
- **Warunki wstępne**: Użytkownik jest zalogowany, jest na stronie szczegółów pokemona (np. Pikachu), pokemon nie jest w ulubionych
- **Kroki**:
  1. Kliknij przycisk "Dodaj do ulubionych" (ikona serca lub tekst)
  2. Sprawdź zmianę stanu przycisku
  3. Przejdź do `/favorites`
- **Oczekiwane rezultaty**:
  - Przycisk zmienia stan na "Usuń z ulubionych" (wypełnione serce)
  - Wyświetla się komunikat "Dodano do ulubionych"
  - Pokemon pojawia się na liście ulubionych `/favorites`
- **Priorytet**: Wysoki

#### TC-FAV-002 - Usunięcie pokemona z ulubionych (Wysoki)
- **Warunki wstępne**: Użytkownik jest zalogowany, pokemon (np. Pikachu) jest w ulubionych
- **Kroki**:
  1. Przejdź do strony szczegółów pokemona lub `/favorites`
  2. Kliknij przycisk "Usuń z ulubionych"
  3. Sprawdź zmianę stanu
- **Oczekiwane rezultaty**:
  - Przycisk zmienia stan na "Dodaj do ulubionych" (puste serce)
  - Wyświetla się komunikat "Usunięto z ulubionych"
  - Pokemon znika z listy ulubionych `/favorites`
- **Priorytet**: Wysoki

#### TC-FAV-003 - Wyświetlenie listy ulubionych (Wysoki)
- **Warunki wstępne**: Użytkownik jest zalogowany i ma ulubione pokemony (min. 3)
- **Kroki**:
  1. Przejdź do `/favorites`
  2. Sprawdź wyświetloną listę
- **Oczekiwane rezultaty**:
  - Wyświetla się lista ulubionych pokemonów
  - Każdy pokemon ma miniaturkę, nazwę, typ/typy
  - Przycisk/ikona do usunięcia z ulubionych
  - Możliwość kliknięcia na pokemona, aby przejść do szczegółów
- **Priorytet**: Wysoki

#### TC-FAV-004 - Pusta lista ulubionych (Średni)
- **Warunki wstępne**: Użytkownik jest zalogowany i nie ma ulubionych pokemonów
- **Kroki**:
  1. Przejdź do `/favorites`
  2. Sprawdź wyświetloną treść
- **Oczekiwane rezultaty**:
  - Wyświetla się komunikat "Nie masz jeszcze ulubionych pokemonów"
  - Sugestia: "Przeglądaj pokemony i dodawaj je do ulubionych"
  - Link/przycisk do `/pokemon`
- **Priorytet**: Średni

#### TC-FAV-005 - Dostęp do ulubionych bez logowania (Wysoki)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Przejdź do `/favorites`
  2. Sprawdź wyświetloną treść
- **Oczekiwane rezultaty**:
  - Przekierowanie na `/auth/login`
  - LUB wyświetlenie komunikatu "Zaloguj się, aby zobaczyć ulubione pokemony"
  - Przycisk/link "Zaloguj się"
- **Priorytet**: Wysoki

#### TC-FAV-006 - Synchronizacja ulubionych między sesjami (Średni)
- **Warunki wstępne**: Użytkownik jest zalogowany i ma ulubione pokemony
- **Kroki**:
  1. Zaloguj się na koncie (test@example.com)
  2. Dodaj Pikachu do ulubionych
  3. Wyloguj się
  4. Zaloguj się ponownie na tym samym koncie
  5. Przejdź do `/favorites`
- **Oczekiwane rezultaty**:
  - Pikachu nadal jest na liście ulubionych
  - Ulubione są zachowane między sesjami (przechowywane w bazie danych)
- **Priorytet**: Średni

### 3.5 Czat AI - rozpoznawanie pokemonów (US-004)

#### TC-AI-001 - Rozpoznanie pokemona po opisie (Wysoki)
- **Warunki wstępne**: Użytkownik jest na stronie `/ai`
- **Kroki**:
  1. W polu czatu wpisz: "Żółty elektryczny pokemon z czerwonymi policzkami i błyskawicznym ogonem"
  2. Wyślij wiadomość
  3. Poczekaj na odpowiedź AI
- **Oczekiwane rezultaty**:
  - AI odpowiada z sugestią: "To prawdopodobnie Pikachu"
  - Wyświetla się lista sugerowanych pokemonów (min. 1, max 3-5)
  - Każdy pokemon ma miniaturkę, nazwę, krótki opis
  - Możliwość kliknięcia na pokemona, aby przejść do szczegółów
- **Priorytet**: Wysoki

#### TC-AI-002 - Wieloetapowa konwersacja z AI (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/ai`
- **Kroki**:
  1. Wpisz: "Szukam pokemona typu woda"
  2. Poczekaj na odpowiedź AI (prawdopodobnie poprosi o więcej szczegółów)
  3. Wpisz: "Jest duży i przypomina żółwia z działami na skorupie"
  4. Poczekaj na odpowiedź AI
- **Oczekiwane rezultaty**:
  - AI prowadzi konwersację, zadając pytania doprecyzowujące
  - Ostatecznie AI sugeruje: "To Blastoise"
  - Historia konwersacji jest zachowana i wyświetlana
- **Priorytet**: Średni

#### TC-AI-003 - Obsługa pytań spoza świata Pokemon (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/ai`
- **Kroki**:
  1. Wpisz: "Jaka jest stolica Francji?"
  2. Wyślij wiadomość
  3. Poczekaj na odpowiedź AI
- **Oczekiwane rezultaty**:
  - AI odmawia odpowiedzi: "Mogę odpowiadać tylko na pytania dotyczące świata Pokémon"
  - LUB AI sugeruje: "Spróbuj zapytać o pokemony"
  - Wyświetla się banner ostrzegawczy/caution
- **Priorytet**: Średni

#### TC-AI-004 - Wyświetlanie karty sugerowanego pokemona (Średni)
- **Warunki wstępne**: AI zasugerował pokemona (np. TC-AI-001)
- **Kroki**:
  1. Kliknij na kartę sugerowanego pokemona (Pikachu)
- **Oczekiwane rezultaty**:
  - Przekierowanie na `/pokemon/pikachu`
  - Strona szczegółów pokemona ładuje się poprawnie
- **Priorytet**: Średni

#### TC-AI-005 - Obsługa błędów AI (rate limit, timeout) (Niski)
- **Warunki wstępne**: Użytkownik wysłał wiele zapytań w krótkim czasie (przekroczono rate limit)
- **Kroki**:
  1. Wyślij kilkanaście zapytań w ciągu minuty
  2. Sprawdź odpowiedź AI
- **Oczekiwane rezultaty**:
  - Wyświetla się komunikat o przekroczeniu limitu zapytań
  - Sugestia: "Spróbuj ponownie za X sekund/minut"
  - Możliwość ponowienia próby (przycisk "Retry")
- **Priorytet**: Niski

#### TC-AI-006 - Dostęp do czatu AI bez logowania (Średni)
- **Warunki wstępne**: Użytkownik nie jest zalogowany
- **Kroki**:
  1. Przejdź do `/ai`
  2. Wpisz zapytanie i wyślij
- **Oczekiwane rezultaty**:
  - Czat AI działa dla użytkowników niezalogowanych (zgodnie z US-005)
  - Funkcjonalność jest identyczna jak dla zalogowanych
- **Priorytet**: Średni

#### TC-AI-007 - Skeleton/loading state podczas oczekiwania na odpowiedź AI (Niski)
- **Warunki wstępne**: Użytkownik wysłał zapytanie do AI
- **Kroki**:
  1. Wyślij zapytanie i natychmiast sprawdź UI
- **Oczekiwane rezultaty**:
  - Wyświetla się skeleton/spinner podczas ładowania odpowiedzi
  - Pole tekstowe jest zablokowane (nie można wysłać kolejnego zapytania)
  - Po otrzymaniu odpowiedzi skeleton znika, wyświetla się treść
- **Priorytet**: Niski

### 3.6 Przeglądanie ruchów pokemonów (US-006)

#### TC-MOVES-001 - Wyświetlenie listy ruchów (Średni)
- **Warunki wstępne**: Użytkownik przechodzi na stronę `/moves`
- **Kroki**:
  1. Przejdź do `/moves`
  2. Sprawdź wyświetloną listę
- **Oczekiwane rezultaty**:
  - Wyświetla się lista ruchów pokemonów
  - Każdy ruch ma: nazwę, typ, moc, dokładność
  - Domyślne sortowanie (np. alfabetycznie lub po ID)
- **Priorytet**: Średni

#### TC-MOVES-002 - Sortowanie ruchów po typie (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/moves`
- **Kroki**:
  1. Kliknij rozwijane menu sortowania
  2. Wybierz "Typ"
  3. Sprawdź kolejność wyników
- **Oczekiwane rezultaty**:
  - Ruchy są posortowane według typu (alfabetycznie lub grupowane po typie)
  - Wszystkie ruchy typu "Fire" są razem, potem "Water", etc.
- **Priorytet**: Średni

#### TC-MOVES-003 - Sortowanie ruchów po mocy (Średni)
- **Warunki wstępne**: Użytkownik jest na stronie `/moves`
- **Kroki**:
  1. Kliknij rozwijane menu sortowania
  2. Wybierz "Moc (malejąco)"
  3. Sprawdź kolejność wyników
- **Oczekiwane rezultaty**:
  - Ruchy są posortowane od najsilniejszych do najsłabszych
  - Pierwszy ruch ma najwyższą wartość mocy
- **Priorytet**: Średni

#### TC-MOVES-004 - Filtrowanie ruchów po typie (Niski)
- **Warunki wstępne**: Użytkownik jest na stronie `/moves`
- **Kroki**:
  1. Otwórz panel filtrów lub rozwijane menu filtrowania
  2. Wybierz typ "Fire"
  3. Kliknij "Zastosuj"
- **Oczekiwane rezultaty**:
  - Wyświetlają się tylko ruchy typu Fire
  - Przykłady: Flamethrower, Fire Blast, Ember, etc.
- **Priorytet**: Niski

### 3.7 Responsywność i dostępność

#### TC-RESP-001 - Wyświetlanie na desktop (1920x1080) (Średni)
- **Warunki wstępne**: Przeglądarka ustawiona na rozdzielczość 1920x1080
- **Kroki**:
  1. Przejdź przez kluczowe strony: `/`, `/pokemon`, `/pokemon/pikachu`, `/favorites`, `/ai`
  2. Sprawdź layout każdej strony
- **Oczekiwane rezultaty**:
  - Wszystkie elementy są wyświetlane poprawnie
  - Brak poziomego scrollowania
  - Tekst jest czytelny
  - Obrazy nie są rozciągnięte/zniekształcone
- **Priorytet**: Średni

#### TC-RESP-002 - Wyświetlanie na tablet (768x1024) (Średni)
- **Warunki wstępne**: Przeglądarka/emulator ustawiony na rozdzielczość 768x1024
- **Kroki**:
  1. Przejdź przez kluczowe strony
  2. Sprawdź layout, nawigację, filtry (czy przechodzą w mobile drawer)
- **Oczekiwane rezultaty**:
  - Layout dostosowuje się do szerokości ekranu
  - Nawigacja może być ukryta w hamburger menu (opcjonalnie)
  - Filtry mogą być w drawer/modal
  - Wszystkie elementy są dostępne i funkcjonalne
- **Priorytet**: Średni

#### TC-RESP-003 - Wyświetlanie na mobile (375x667) (Wysoki)
- **Warunki wstępne**: Przeglądarka/emulator ustawiony na rozdzielczość 375x667 (iPhone SE)
- **Kroki**:
  1. Przejdź przez kluczowe strony
  2. Sprawdź layout, nawigację, formularze
  3. Testuj gesty (swipe, scroll)
- **Oczekiwane rezultaty**:
  - Layout jest w pełni responsywny
  - Tekst jest czytelny (nie za mały)
  - Przyciski mają odpowiednią wielkość (min. 44x44px dla touch)
  - Nawigacja w hamburger menu
  - Filtry w bottom drawer lub modal
  - Formularze są łatwe do wypełnienia na małym ekranie
- **Priorytet**: Wysoki

#### TC-ACCESS-001 - Nawigacja klawiaturą (Wysoki)
- **Warunki wstępne**: Użytkownik na stronie `/pokemon`
- **Kroki**:
  1. Używaj klawisza Tab do nawigacji między elementami
  2. Sprawdź czy focus jest widoczny
  3. Użyj Enter/Space do aktywacji przycisków/linków
  4. Użyj Escape do zamknięcia modali/drawer'ów
- **Oczekiwane rezultaty**:
  - Wszystkie interaktywne elementy są dostępne za pomocą klawiatury
  - Focus jest widoczny (outline/border)
  - Kolejność tabulacji jest logiczna (top-to-bottom, left-to-right)
  - Escape zamyka modale/drawer'y
- **Priorytet**: Wysoki

#### TC-ACCESS-002 - Testowanie ze screen readerem (Średni)
- **Warunki wstępne**: Screen reader włączony (NVDA, JAWS, VoiceOver)
- **Kroki**:
  1. Przejdź przez stronę główną `/`
  2. Nawiguj do `/pokemon`
  3. Użyj wyszukiwarki i filtrów
  4. Sprawdź czy screen reader odczytuje treści poprawnie
- **Oczekiwane rezultaty**:
  - Wszystkie elementy mają odpowiednie aria-labels
  - Nagłówki są hierarchiczne (h1, h2, h3)
  - Formularze mają etykiety powiązane z polami (label for)
  - Komunikaty błędów są odczytywane
  - Obrazy mają alt text
- **Priorytet**: Średni

#### TC-ACCESS-003 - Kontrast kolorów (Niski)
- **Warunki wstępne**: Użyj narzędzia do sprawdzania kontrastu (axe DevTools, WAVE)
- **Kroki**:
  1. Przejdź przez kluczowe strony
  2. Uruchom audyt dostępności
  3. Sprawdź raport
- **Oczekiwane rezultaty**:
  - Wszystkie teksty mają kontrast min. 4.5:1 (WCAG AA)
  - Duże teksty (18pt+) mają kontrast min. 3:1
  - Brak błędów kontrastu w raporcie
- **Priorytet**: Niski

### 3.8 Wydajność

#### TC-PERF-001 - Czas ładowania strony głównej (Wysoki)
- **Warunki wstępne**: Przeglądarka z czystym cache, połączenie sieciowe: Fast 3G
- **Kroki**:
  1. Wyczyść cache przeglądarki
  2. Otwórz Chrome DevTools > Network > Throttling: Fast 3G
  3. Przejdź do `/`
  4. Zmierz czas ładowania (DOMContentLoaded, Load)
- **Oczekiwane rezultaty**:
  - DOMContentLoaded < 1.5s
  - Load < 2s
  - FCP (First Contentful Paint) < 1s
- **Priorytet**: Wysoki

#### TC-PERF-002 - Czas odpowiedzi wyszukiwania (Wysoki)
- **Warunki wstępne**: Użytkownik na stronie `/pokemon`
- **Kroki**:
  1. Otwórz Chrome DevTools > Network
  2. W polu wyszukiwania wpisz "pikachu"
  3. Zmierz czas odpowiedzi API (Time to First Byte)
- **Oczekiwane rezultaty**:
  - TTFB < 500ms
  - Total time < 1s
  - Wyniki wyświetlają się płynnie (bez zauważalnego opóźnienia)
- **Priorytet**: Wysoki

#### TC-PERF-003 - Lighthouse audit (Średni)
- **Warunki wstępne**: Chrome DevTools Lighthouse
- **Kroki**:
  1. Otwórz Chrome DevTools > Lighthouse
  2. Wybierz kategorie: Performance, Accessibility, Best Practices, SEO
  3. Uruchom audyt dla strony głównej `/`
  4. Uruchom audyt dla `/pokemon`
- **Oczekiwane rezultaty**:
  - Performance: ≥ 85
  - Accessibility: ≥ 90
  - Best Practices: ≥ 90
  - SEO: ≥ 90
- **Priorytet**: Średni

#### TC-PERF-004 - Core Web Vitals (Średni)
- **Warunki wstępne**: Chrome DevTools > Performance
- **Kroki**:
  1. Zmierz LCP, FID, CLS dla kluczowych stron
  2. Użyj Chrome UX Report lub PageSpeed Insights
- **Oczekiwane rezultaty**:
  - LCP (Largest Contentful Paint) < 2.5s (good)
  - FID (First Input Delay) < 100ms (good)
  - CLS (Cumulative Layout Shift) < 0.1 (good)
- **Priorytet**: Średni

### 3.9 Bezpieczeństwo

#### TC-SEC-001 - Ochrona przed XSS (Cross-Site Scripting) (Wysoki)
- **Warunki wstępne**: Użytkownik ma dostęp do formularzy (wyszukiwanie, czat AI)
- **Kroki**:
  1. W polu wyszukiwania wpisz: `<script>alert('XSS')</script>`
  2. Wyślij zapytanie
  3. Sprawdź czy skrypt się wykonał
- **Oczekiwane rezultaty**:
  - Skrypt NIE jest wykonywany
  - Tekst jest renderowany jako plain text lub sanityzowany
  - Brak alertu "XSS" w przeglądarce
- **Priorytet**: Wysoki

#### TC-SEC-002 - Walidacja danych wejściowych (Wysoki)
- **Warunki wstępne**: Użytkownik na stronie rejestracji
- **Kroki**:
  1. Wypełnij formularz z niebezpiecznymi znakami:
     - Email: `test+<script>@example.com`
     - Hasło: `Pass'; DROP TABLE users;--`
  2. Wyślij formularz
  3. Sprawdź odpowiedź API i bazę danych
- **Oczekiwane rezultaty**:
  - Walidacja Zod odrzuca nieprawidłowe dane
  - Dane są sanityzowane przed zapisem do bazy
  - Brak SQL Injection (Supabase używa prepared statements)
  - Odpowiedź: 422 Unprocessable Entity z błędami walidacji
- **Priorytet**: Wysoki

#### TC-SEC-003 - Weryfikacja tokenów JWT (Wysoki)
- **Warunki wstępne**: Użytkownik zalogowany
- **Kroki**:
  1. Zaloguj się i skopiuj JWT token (z cookies/localStorage)
  2. Wyloguj się
  3. Spróbuj użyć skopiowanego tokenu do autoryzowanego zapytania (np. POST `/api/users/me/favorites/25`)
  4. Zmień 1 znak w tokenie i ponów zapytanie
- **Oczekiwane rezultaty**:
  - Po wylogowaniu token jest unieważniony (jeśli sesja nie jest persistent)
  - Zmodyfikowany token jest odrzucany
  - Odpowiedź: 401 Unauthorized
- **Priorytet**: Wysoki

#### TC-SEC-004 - Haszowanie haseł (Wysoki)
- **Warunki wstępne**: Dostęp do bazy danych Supabase (środowisko dev/test)
- **Kroki**:
  1. Zarejestruj użytkownika z hasłem: `Haslo123!`
  2. Sprawdź w bazie danych (Supabase Dashboard > Table Editor > auth.users)
  3. Zweryfikuj czy hasło jest zahaszowane
- **Oczekiwane rezultaty**:
  - Hasło w bazie danych jest zahaszowane (bcrypt hash)
  - Hasło NIE jest przechowywane w formie plain text
  - Hash wygląda np.: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- **Priorytet**: Wysoki

#### TC-SEC-005 - Rate limiting dla API (Niski)
- **Warunki wstępne**: Dostęp do endpointów API
- **Kroki**:
  1. Wyślij 100 requestów do `/api/auth/login` w ciągu 10 sekund
  2. Sprawdź odpowiedź
- **Oczekiwane rezultaty**:
  - Po przekroczeniu limitu (np. 10 requestów/min) API zwraca 429 Too Many Requests
  - Odpowiedź zawiera nagłówek Retry-After
  - (Jeśli rate limiting nie jest zaimplementowany, ten test jest informacyjny)
- **Priorytet**: Niski

## 4. Narzędzia i frameworki testowe

### 4.1 Testy jednostkowe i integracyjne
- **Vitest 3.2.4**: Runner testów, kompatybilny z Vite/Astro
- **React Testing Library 16.3.0**: Testowanie komponentów React
- **@testing-library/dom**: Testowanie statycznych komponentów Astro
- **@testing-library/jest-dom 6.9.1**: Dodatkowe matchery dla asercji
- **@testing-library/user-event 14.6.1**: Symulacja interakcji użytkownika
- **jsdom 22.1.0**: Środowisko DOM dla testów
- **MSW (Mock Service Worker)**: Mockowanie API (PokeAPI, OpenRouter.ai) - do zainstalowania
- **Vitest Coverage (v8)**: Generowanie raportów pokrycia kodu

### 4.2 Testy end-to-end
- **Playwright 1.56.0**: Framework E2E, wieloprzeglądarkowy (Chromium, Firefox, WebKit)
- **Playwright Test**: Wbudowany test runner
- **Playwright Accessibility Testing**: Audyty dostępności (axe-core integration)

### 4.3 Testy API
- **Vitest**: Testowanie endpointów API

### 4.4 Lintowanie i formatowanie
- **ESLint 9.23.0**: Statyczna analiza kodu
- **Prettier 0.14.1**: Formatowanie kodu
- **eslint-plugin-jsx-a11y 6.10.2**: Linting dostępności dla JSX

### 4.5 CI/CD
- **GitHub Actions**: Pipeline CI/CD (workflow master.yml)
- **Husky 9.1.7**: Git hooks (pre-commit)
- **lint-staged 15.5.0**: Lintowanie staged files

### 4.6 Testy wydajności
- **Lighthouse CI**: Audyty wydajności w pipeline CI/CD - do skonfigurowania

### 4.7 Testy bezpieczeństwa
- **Manualne testowanie**: Weryfikacja CSRF, XSS, SQL Injection

### 4.8 Testy dostępności
- **axe-core**: Audyty dostępności (zintegrowane z Playwright)
- **WAVE** (zewnętrzne): Browser extension dla manualnych testów
- **NVDA/JAWS/VoiceOver**: Screen readery do manualnych testów

## 5. Wymagania środowiska testowego

### 5.1 Środowisko lokalne (Development)
- **Node.js**: 22.x (zgodnie z .nvmrc)
- **Package manager**: npm (package-lock.json)
- **Przeglądarka**: Chrome/Chromium najnowsza wersja
- **Baza danych**: Supabase Local Development
  - PostgreSQL (wersja zgodna z Supabase Cloud)
  - Uruchomiona lokalnie via `supabase start`
- **Zmienne środowiskowe**: `.env` (na podstawie `.env.sample`)
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`
  - `PLAYWRIGHT_BASE_URL` (dla E2E testów)

### 5.2 Środowisko CI/CD (GitHub Actions)
- **Runner**: Ubuntu latest
- **Node.js**: 22.x
- **Supabase CLI**: Najnowsza wersja
- **Playwright browsers**: Chromium, Firefox, WebKit
- **Secrets**: Konfiguracja w GitHub Secrets
  - `SUPABASE_PROJECT_ID`
  - `SUPABASE_ACCESS_TOKEN`
  - `OPENROUTER_API_KEY`
  - `CLOUDFLARE_API_TOKEN` (dla deployment)

### 5.3 Środowisko staging (Cloudflare Pages Preview)
- **Deployment**: Automatyczny dla każdego PR
- **URL**: `https://<branch>.<project>.pages.dev`
- **Baza danych**: Supabase Cloud (staging project)
- **Testy E2E**: Uruchamiane przeciwko preview URL

### 5.4 Środowisko produkcyjne (Cloudflare Pages)
- **URL**: `https://<domain>.pages.dev` lub custom domain
- **Baza danych**: Supabase Cloud (production project)
- **Monitoring**: Cloudflare Analytics
- **Smoke tests**: Podstawowe testy E2E po deployment

## 6. Wymagania dotyczące danych testowych

### 6.1 Użytkownicy testowi
- **User 1 - Regular User**:
  - Email: `test-user@example.com`
  - Hasło: `TestUser123!`
  - Ulubione pokemony: Pikachu (25), Charizard (6), Mewtwo (150)

- **User 2 - Empty Favorites**:
  - Email: `empty-favs@example.com`
  - Hasło: `EmptyFavs123!`
  - Ulubione pokemony: brak

- **User 3 - New Registration**:
  - Email: `new-user-{timestamp}@example.com`
  - Hasło: `NewUser123!`
  - Tworzony dynamicznie podczas testów rejestracji

### 6.2 Dane pokemonów
- **Źródło**: PokeAPI (https://pokeapi.co/)
- **Mock data** (dla testów jednostkowych/integracyjnych):
  - Minimum 10 pokemonów z różnych generacji
  - Różne typy: Electric, Water, Fire, Grass, Psychic
  - Z ewolucjami: Charmander → Charmeleon → Charizard
  - Bez ewolucji: Lapras, Snorlax
  - JSON fixtures w `src/lib/__fixtures__/pokemon.json`

### 6.3 Dane ruchów
- **Źródło**: PokeAPI
- **Mock data**:
  - Minimum 20 ruchów różnych typów
  - Z różnymi mocami (0-250) i dokładnościami (0-100)
  - JSON fixtures w `src/lib/__fixtures__/moves.json`

### 6.4 Dane AI (OpenRouter.ai)
- **Mock responses** (dla testów):
  - Pomyślna odpowiedź: sugestia Pikachu dla "żółty elektryczny pokemon"
  - Off-domain response: odpowiedź na pytanie spoza świata Pokemon
  - Error response: 429 Too Many Requests (rate limit)
  - JSON fixtures w `src/lib/__fixtures__/ai-responses.json`

### 6.5 Seed data dla bazy danych
- **Lokalizacja**: `supabase/seeds/` (do utworzenia)
- **Zawartość**:
  - 3 użytkowników testowych (jak w 6.1)
  - Relacje favorites (user_id, pokemon_id)
  - Tabela ai_queries (historia zapytań AI dla testów)

### 6.6 Zarządzanie danymi testowymi
- **Setup**: Przed testami E2E uruchom seed script
  ```bash
  supabase db reset
  npm run seed:test
  ```
- **Teardown**: Po testach wyczyść dane testowe (opcjonalnie, jeśli baza testowa jest dedykowana)
- **Izolacja**: Każdy test E2E powinien tworzyć własne dane (unikalne emaile z timestamp) lub używać dedykowanych użytkowników

## 7. Ocena ryzyka

### 7.1 Obszary wysokiego ryzyka

#### 7.1.1 Autentykacja i autoryzacja (Krytyczny)
- **Ryzyko**: Luki w autentykacji mogą prowadzić do nieautoryzowanego dostępu do kont użytkowników i danych osobowych
- **Mitygacja**:
  - Intensywne testowanie flow logowania/rejestracji (TC-AUTH-*)
  - Testy bezpieczeństwa (TC-SEC-001 do TC-SEC-005)
  - Code review przez doświadczonego developera
  - Weryfikacja implementacji JWT przez Supabase
- **Priorytet testowania**: Wysoki

#### 7.1.2 Integracja z zewnętrznymi API (Wysoki)
- **Ryzyko**: PokeAPI i OpenRouter.ai mogą być niedostępne, zwracać nieprawidłowe dane lub zmieniać format odpowiedzi
- **Mitygacja**:
  - Mockowanie API w testach jednostkowych/integracyjnych (MSW)
  - Obsługa błędów sieciowych (retry logic, timeout)
  - Testy z prawdziwymi API w środowisku staging (smoke tests)
  - Monitoring uptime API (alerting)
- **Priorytet testowania**: Wysoki

#### 7.1.3 Czat AI - rozpoznawanie pokemonów (Wysoki)
- **Ryzyko**: AI może generować nieprawidłowe lub off-domain odpowiedzi, przekraczać rate limity, lub zwracać wrażliwe treści
- **Mitygacja**:
  - Testy scenariuszy edge case (TC-AI-003, TC-AI-005)
  - Prompt engineering (testowanie prompts z różnymi inputami)
  - Rate limiting na poziomie aplikacji
  - Monitoring kosztów API (OpenRouter.ai)
  - Content moderation (filtrowanie odpowiedzi AI)
- **Priorytet testowania**: Wysoki

#### 7.1.4 Wydajność wyszukiwania (Średni-Wysoki)
- **Ryzyko**: Wolne wyszukiwanie (> 1s) może frustrować użytkowników i obniżać adopcję aplikacji
- **Mitygacja**:
  - Testy wydajności (TC-PERF-002)
  - Optymalizacja zapytań do bazy danych (indexy, query planning)
  - Cache'owanie wyników wyszukiwania (Redis/Cloudflare KV - opcjonalnie)
  - Lazy loading i paginacja
- **Priorytet testowania**: Średni-Wysoki

### 7.2 Obszary średniego ryzyka

#### 7.2.1 Responsywność (Średni)
- **Ryzyko**: Aplikacja może być trudna w użyciu na urządzeniach mobilnych
- **Mitygacja**:
  - Testy responsywności (TC-RESP-001 do TC-RESP-003)
  - Mobile-first development approach
  - Regularne testowanie na prawdziwych urządzeniach
- **Priorytet testowania**: Średni

#### 7.2.2 Dostępność (Średni)
- **Ryzyko**: Użytkownicy z niepełnosprawnościami mogą mieć trudności w korzystaniu z aplikacji
- **Mitygacja**:
  - Testy dostępności (TC-ACCESS-001 do TC-ACCESS-003)
  - Audyty axe-core w pipeline CI/CD
  - Manualne testy ze screen readerami
- **Priorytet testowania**: Średni

#### 7.2.3 Migracje bazy danych (Średni)
- **Ryzyko**: Błędy w migracjach mogą prowadzić do utraty danych lub niespójności
- **Mitygacja**:
  - Code review migracji
  - Testowanie migracji w środowisku staging przed produkcją
  - Backup bazy danych przed każdą migracją
  - Rollback plan
- **Priorytet testowania**: Średni

### 7.3 Obszary niskiego ryzyka

#### 7.3.1 Przeglądanie ruchów pokemonów (Niski)
- **Ryzyko**: Funkcjonalność nice-to-have, błędy nie blokują kluczowych flow
- **Mitygacja**:
  - Podstawowe testy (TC-MOVES-001 do TC-MOVES-004)
  - Można przetestować później w cyklu rozwoju
- **Priorytet testowania**: Niski

#### 7.3.2 Estetyka UI (Niski)
- **Ryzyko**: Drobne problemy wizualne nie wpływają na funkcjonalność
- **Mitygacja**:
  - Manualne code review
- **Priorytet testowania**: Niski

## 8. Harmonogram testów i kamienie milowe

### 8.1 Faza 1: Setup środowiska testowego (Sprint 0 - 1 tydzień)
- **Zadania**:
  - Konfiguracja Vitest i React Testing Library
  - Konfiguracja Playwright (browsers, viewports)
  - Setup MSW dla mockowania API
  - Przygotowanie danych testowych (fixtures, seeds)
  - Konfiguracja CI/CD pipeline (GitHub Actions)
  - Setup Lighthouse CI
- **Dostarczane**:
  - `vitest.config.ts` i `vitest.setup.ts` skonfigurowane
  - `playwright.config.ts` skonfigurowany
  - Pipeline CI/CD uruchamia testy jednostkowe i E2E
  - Dokumentacja setup'u środowiska testowego
- **Kamień milowy**: Środowisko testowe gotowe do użycia

### 8.2 Faza 2: Testy jednostkowe - komponenty podstawowe (Sprint 1 - 2 tygodnie)
- **Zakres**:
  - Komponenty UI: Button, Badge, Input (shadcn/ui)
  - Komponenty Pokemon: PokemonCard, PokemonGrid, FilterSidePanel
  - Komponenty Auth: LoginForm, RegisterForm, FormStatusBanner
  - Utility functions: filters, transformers, mappers
- **Cel pokrycia kodu**: 70%
- **Dostarczane**:
  - Minimum 30 testów jednostkowych
  - Raporty pokrycia kodu (Vitest coverage)
- **Kamień milowy**: Podstawowe komponenty pokryte testami

### 8.3 Faza 3: Testy jednostkowe - hooki i store'y (Sprint 2 - 1 tydzień)
- **Zakres**:
  - Custom hooki: usePokemonListQuery, useAiChatSession, usePokemonFilterOptions
  - Zustand stores: usePokemonSearchStore, useSessionStore
  - Walidatory Zod: loginSchema, registerSchema, validation.ts
- **Cel pokrycia kodu**: 80%
- **Dostarczane**:
  - Minimum 20 testów jednostkowych
  - Raporty pokrycia kodu
- **Kamień milowy**: Hooki i logika biznesowa pokryte testami

### 8.4 Faza 4: Testy integracyjne - API i backend (Sprint 3 - 2 tygodnie)
- **Zakres**:
  - Endpointy autentykacji: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/reset-password`
  - Endpointy pokemonów: `/api/pokemon`, `/api/pokemon/summary`, `/api/pokemon/details`
  - Endpointy ulubionych: `/api/users/me/favorites`, `/api/users/me/favorites/[pokemonId]`
  - Endpoint AI: `/api/ai/identify`
  - Middleware: CSRF, authentication
- **Dostarczane**:
  - Minimum 25 testów API
  - Mockowanie Supabase i zewnętrznych API (MSW)
- **Kamień milowy**: API endpoints pokryte testami

### 8.5 Faza 5: Testy E2E - kluczowe user stories (Sprint 4 - 2 tygodnie)
- **Zakres**:
  - US-001: Wyszukiwanie pokemonów (TC-SEARCH-001 do TC-SEARCH-008)
  - US-002: Szczegóły pokemona (TC-DETAIL-001 do TC-DETAIL-006)
  - US-003: Ulubione pokemony (TC-FAV-001 do TC-FAV-006)
  - US-004: Czat AI (TC-AI-001 do TC-AI-007)
  - US-005: Autentykacja (TC-AUTH-001 do TC-AUTH-008)
- **Dostarczane**:
  - Minimum 40 testów E2E (Playwright)
  - Testy uruchamiane w CI/CD dla każdego PR
- **Kamień milowy**: Kluczowe user stories pokryte testami E2E

### 8.6 Faza 6: Testy niefunkcjonalne (Sprint 5 - 1 tydzień)
- **Zakres**:
  - Responsywność (TC-RESP-001 do TC-RESP-003)
  - Dostępność (TC-ACCESS-001 do TC-ACCESS-003)
  - Wydajność (TC-PERF-001 do TC-PERF-004)
  - Bezpieczeństwo (TC-SEC-001 do TC-SEC-005)
- **Dostarczane**:
  - Minimum 15 testów niefunkcjonalnych
  - Raporty Lighthouse CI
  - Raporty axe-core (dostępność)
- **Kamień milowy**: Wymagania niefunkcjonalne zweryfikowane

### 8.7 Faza 7: Regression testing i stabilizacja (Sprint 6 - 1 tydzień)
- **Zakres**:
  - Uruchomienie pełnej suity testów
  - Naprawa flaky tests
  - Regression testing po bugfixach
  - Weryfikacja w środowisku staging
- **Dostarczane**:
  - Stabilna suita testów (0 flaky tests)
  - Wszystkie testy przechodzą w CI/CD
  - Raport z testów regression
- **Kamień milowy**: Aplikacja gotowa do release MVP

### 8.8 Kamienie milowe kluczowe

| Kamień milowy | Termin (Sprint) | Kryteria akceptacji |
|---------------|-----------------|---------------------|
| **M1: Środowisko testowe gotowe** | Sprint 0 (tydzień 1) | CI/CD pipeline uruchamia testy, fixtures przygotowane |
| **M2: Komponenty pokryte testami jednostkowymi** | Sprint 1 (tydzień 3) | ≥70% pokrycia kodu komponentów |
| **M3: API endpoints pokryte testami** | Sprint 3 (tydzień 6) | Wszystkie endpointy `/api/*` przetestowane |
| **M4: Kluczowe user stories pokryte E2E** | Sprint 4 (tydzień 8) | US-001 do US-005 w pełni przetestowane |
| **M5: Wymagania niefunkcjonalne zweryfikowane** | Sprint 5 (tydzień 9) | Wydajność, dostępność, bezpieczeństwo zatwierdzone |
| **M6: Ready for MVP Release** | Sprint 6 (tydzień 10) | Wszystkie testy przechodzą, brak critical bugs |

### 8.9 Harmonogram równoległy z developmentem
- **Podejście**: Testy są pisane równolegle z implementacją funkcjonalności (TDD/BDD approach preferowany)
- **Code review**: Każdy PR wymaga testów (unit + integration + E2E jeśli dotyczy)
- **CI/CD**: Testy blokują merge do brancha develop jeśli nie przechodzą
- **Regression suite**: Uruchamiana nocnie (nightly builds) dla całej aplikacji

## 9. Kryteria wejścia i wyjścia

### 9.1 Kryteria wejścia (Entry Criteria) - Kiedy testowanie może się rozpocząć

#### 9.1.1 Dla testów jednostkowych
- ✅ Kod źródłowy komponentu/funkcji jest gotowy i zatwierdony w code review
- ✅ Vitest i React Testing Library są skonfigurowane
- ✅ Fixtures i mock data są przygotowane (jeśli wymagane)
- ✅ Dokumentacja komponentu/funkcji jest dostępna (TSDoc lub README)

#### 9.1.2 Dla testów integracyjnych
- ✅ Wszystkie moduły do integracji są gotowe i przetestowane jednostkowo
- ✅ MSW jest skonfigurowany z mock handlers dla zewnętrznych API
- ✅ Supabase local development działa poprawnie
- ✅ Zmienne środowiskowe są skonfigurowane (`.env`)

#### 9.1.3 Dla testów E2E
- ✅ Aplikacja jest deployowana w środowisku testowym (local/staging)
- ✅ Wszystkie kluczowe funkcjonalności są zaimplementowane i działają
- ✅ Playwright jest skonfigurowany z browsers
- ✅ Dane testowe (seed) są załadowane do bazy danych
- ✅ User stories są zdefiniowane z jasnymi kryteriami akceptacji

#### 9.1.4 Dla testów wydajności
- ✅ Aplikacja jest deployowana w środowisku staging/produkcyjnym
- ✅ Wszystkie optymalizacje kodu są zaimplementowane
- ✅ Lighthouse CI jest skonfigurowany
- ✅ Baseline metrics są ustalone (jeśli to nie pierwszy audyt)

#### 9.1.5 Dla testów bezpieczeństwa
- ✅ Wszystkie funkcjonalności autentykacji/autoryzacji są zaimplementowane
- ✅ Walidacja danych wejściowych (Zod) jest gotowa
- ✅ CSRF protection jest zaimplementowana
- ✅ Lista scenariuszy bezpieczeństwa jest zatwierdzona

### 9.2 Kryteria wyjścia (Exit Criteria) - Kiedy testowanie jest zakończone

#### 9.2.1 Dla testów jednostkowych
- ✅ Wszystkie testy jednostkowe przechodzą (0 failures)
- ✅ Pokrycie kodu ≥ 70% (optymalnie 85%)
- ✅ Brak flaky tests (testy są deterministyczne)
- ✅ Wszystkie critical i high priority komponenty są przetestowane
- ✅ Code review testów jest zakończone i zatwierdzone

#### 9.2.2 Dla testów integracyjnych
- ✅ Wszystkie testy integracyjne przechodzą (0 failures)
- ✅ Wszystkie endpointy API są przetestowane
- ✅ Integracje z Supabase działają poprawnie
- ✅ Mockowanie API jest kompletne i realistyczne
- ✅ Obsługa błędów (error handling) jest przetestowana

#### 9.2.3 Dla testów E2E
- ✅ Wszystkie kluczowe user stories (US-001 do US-006) są przetestowane i przechodzą
- ✅ Minimum 40 testów E2E przechodzi
- ✅ Testy działają w trzech przeglądarkach (Chromium, Firefox, WebKit)
- ✅ Testy są stabilne i nie wymagają retry (max 2% flaky rate)
- ✅ Screenshots i traces są dostępne dla failed tests
- ✅ Wszystkie critical i high priority scenariusze są pokryte

#### 9.2.4 Dla testów wydajności
- ✅ Czas ładowania strony głównej < 2s (spełnione)
- ✅ Czas odpowiedzi wyszukiwania < 1s (spełnione)
- ✅ Lighthouse Performance score ≥ 85
- ✅ Core Web Vitals są w zakresie "good" (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- ✅ Brak błędów konsoli (critical/high severity)

#### 9.2.5 Dla testów bezpieczeństwa
- ✅ Wszystkie testy bezpieczeństwa (TC-SEC-001 do TC-SEC-005) przechodzą
- ✅ Brak critical security vulnerabilities (XSS, SQL Injection, CSRF)
- ✅ Hasła są haszowane w bazie danych (zweryfikowane)
- ✅ Tokeny JWT są prawidłowo weryfikowane
- ✅ Walidacja danych wejściowych działa poprawnie (Zod)

#### 9.2.6 Dla testów dostępności
- ✅ Wszystkie testy dostępności (TC-ACCESS-001 do TC-ACCESS-003) przechodzą
- ✅ Lighthouse Accessibility score ≥ 90
- ✅ Brak critical axe-core violations
- ✅ Manualne testy ze screen readerem są zakończone (min. 1 screen reader)
- ✅ Nawigacja klawiaturą działa poprawnie na kluczowych stronach

#### 9.2.7 Dla testów responsywności
- ✅ Wszystkie testy responsywności (TC-RESP-001 do TC-RESP-003) przechodzą
- ✅ Aplikacja działa poprawnie na desktop, tablet, mobile
- ✅ Brak horizontal scroll na żadnym urządzeniu
- ✅ Touch targets są ≥ 44x44px na mobile

### 9.3 Kryteria akceptacji dla release MVP
- ✅ **Wszystkie testy przechodzą**: Unit (100%), Integration (100%), E2E (100%), Performance, Security, Accessibility
- ✅ **Pokrycie kodu**: ≥ 70% (optymalnie 85%)
- ✅ **Brak critical bugs**: 0 critical, 0 high (medium i low mogą być w backlog)
- ✅ **Kluczowe user stories**: US-001 do US-006 są w pełni przetestowane i działają
- ✅ **Wymagania niefunkcjonalne**: Wydajność, bezpieczeństwo, dostępność spełniają kryteria
- ✅ **CI/CD pipeline**: Wszystkie checks (linting, testing, build) przechodzą w CI/CD
- ✅ **Dokumentacja**: Plan testów, raporty z testów, known issues są udokumentowane
- ✅ **Smoke tests na produkcji**: Podstawowe testy E2E przechodzą po deployment
- ✅ **Sign-off**: Product Owner i Tech Lead zatwierdzają release

### 9.4 Proces wstrzymania testów (Suspension Criteria)
Testowanie może zostać wstrzymane w następujących sytuacjach:
- 🛑 **Critical bug blokujący testy**: Np. aplikacja się nie uruchamia, baza danych jest niedostępna
- 🛑 **Środowisko testowe jest niestabilne**: Problemy z CI/CD, Supabase local development nie działa
- 🛑 **Brak kluczowej funkcjonalności**: User story nie jest zaimplementowana, testy nie mogą być wykonane
- 🛑 **Zbyt wiele high priority bugs**: > 10 high bugs uniemożliwia dalsze testowanie (priorytet: bugfix)

**Akcje**: Zgłoszenie do Tech Lead, naprawa blokerów, wznowienie testów po rozwiązaniu problemu

### 9.5 Proces wznowienia testów (Resumption Criteria)
Testowanie może zostać wznowione gdy:
- ✅ Critical bugs są naprawione i zweryfikowane
- ✅ Środowisko testowe jest stabilne i gotowe
- ✅ Kluczowa funkcjonalność jest zaimplementowana i gotowa do testowania
- ✅ High priority bugs są naprawione do akceptowalnego poziomu (< 5)

---

## 10. Metryki i raportowanie

### 10.1 Kluczowe metryki testów
- **Test pass rate**: (Passed tests / Total tests) × 100% - Cel: ≥ 95%
- **Code coverage**: % pokrycia kodu testami - Cel: ≥ 70% (optymalnie 85%)
- **Flaky test rate**: (Flaky tests / Total tests) × 100% - Cel: ≤ 2%
- **Test execution time**: Czas wykonania pełnej suity testów - Cel: < 15 min w CI/CD
- **Bug detection rate**: Liczba bugów znalezionych przez testy vs. manualne QA
- **Mean time to detect (MTTD)**: Średni czas wykrycia buga po wprowadzeniu
- **Mean time to repair (MTTR)**: Średni czas naprawy buga

### 10.2 Raportowanie
- **Częstotliwość**:
  - Raport dzienny (daily standup): Status testów, blockers
  - Raport tygodniowy (sprint review): Podsumowanie testów, metryki, postęp
  - Raport końcowy (po każdym milestonie): Pełny raport z testów, zalecenia

- **Narzędzia**:
  - GitHub Actions artifacts: Raporty HTML z Vitest i Playwright
  - Vitest Coverage Report: Pokrycie kodu w formacie lcov/HTML
  - Playwright HTML Report: Szczegółowe wyniki testów E2E z screenshots
  - Lighthouse CI: Raporty wydajności i dostępności

- **Dystrybucja**:
  - Slack/Email notifications dla failed tests w CI/CD
  - GitHub PR comments z wynikami testów

---

## 11. Role i odpowiedzialności

### 11.1 Test Lead / QA Lead
- Koordynacja działań testowych
- Przegląd i akceptacja planu testów
- Raportowanie postępów i ryzyka
- Utrzymanie jakości testów

### 11.2 Frontend Developers
- Pisanie testów jednostkowych dla komponentów React/Astro
- Pisanie testów integracyjnych dla hooków i store'ów
- Code review testów
- Naprawa bugów znalezionych w testach

### 11.3 Backend Developers
- Pisanie testów API
- Testowanie integracji z Supabase
- Testowanie middleware i autentykacji
- Code review testów

### 11.4 DevOps / CI/CD Engineer
- Konfiguracja pipeline CI/CD (GitHub Actions)
- Utrzymanie środowisk testowych
- Setup Lighthouse CI
- Monitoring testów w CI/CD

### 11.5 Product Owner
- Przegląd i akceptacja user stories
- Walidacja kryteriów akceptacji
- Priorytetyzacja bugów
- Sign-off dla release MVP

---

**Data utworzenia planu testów**: 2025-10-14
**Wersja**: 1.0
**Autor**: Claude Code (AI Assistant)
**Status**: Draft - Do przeglądu i zatwierdzenia przez zespół
