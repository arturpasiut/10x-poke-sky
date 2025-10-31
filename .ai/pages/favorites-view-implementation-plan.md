# API Endpoint Implementation Plan: /api/users/me/favorites

## 1. Przegląd punktu końcowego

- Endpoint obsługuje odczyt, dodawanie i usuwanie ulubionych Pokemonów zalogowanego użytkownika w jednym zasobie REST.
- Wykorzystuje Astro API routes i Supabase (tabela `favorites` z RLS) poprzez klienta dostępnego w `locals.supabase`.
- Dane Pokemonów wzbogacane są snapshotami z tabeli `pokemon_cache`, dzięki czemu nie wykonujemy dodatkowych zewnętrznych wywołań w czasie obsługi żądań.
- Implementacja musi być idempotentna dla dodawania, wspierać paginację z sortowaniem oraz propagować błędy i limity zgodnie ze specyfikacją.

## 2. Szczegóły żądania

- `GET /api/users/me/favorites`: wymaga ważnego JWT w cookies; obsługuje query `page` (int >= 1, domyślnie 1), `pageSize` (int 1-50, domyślnie 20), `sort` z wartościami `createdAt` lub `name` (domyślnie `createdAt`), `order` z wartościami `asc` lub `desc` (domyślnie `desc`); brak ciała.
- `POST /api/users/me/favorites`: wymaga JWT; treść JSON zgodna z `AddFavoriteCommand` (`pokemonId` całkowity 1-1025); brak parametrów query.
- `DELETE /api/users/me/favorites/{pokemonId}`: wymaga JWT; `pokemonId` w ścieżce (całkowity 1-1025); brak treści i parametrów query.

## 3. Szczegóły odpowiedzi

- `GET`: zwraca 200 z `FavoritesListResponseDto`; elementy `items` mają typ `FavoriteListItemDto` z `pokemon` jako `PokemonFavoriteSnapshot` (pola `name`, `types`, `spriteUrl`), a `hasNext` wyliczany jest na podstawie `total` i `pageSize`; nagłówek `Content-Type: application/json; charset=utf-8`.
- `POST`: zwraca `FavoriteMutationResultDto` z `pokemonId` i `addedAt`; status 201 przy nowym wpisie, 200 gdy rekord istniał wcześniej (na podstawie zwróconej flagi/rowCount z Supabase); warto ustawić `Location` na URL zasobu `/api/users/me/favorites/{pokemonId}`.
- `DELETE`: zwraca 204 bez treści po skutecznym usunięciu; brak ciała w odpowiedzi.
- Błędy: format JSON `{"message": string, "details"?: unknown}` stosowany we wszystkich handlerach; mapuj 400/401/403/404/422/429/500 zgodnie ze specyfikacją i przekazuj `Retry-After` przy 429.

## 4. Przepływ danych

- Wszystkie handlery pobierają klienta Supabase z `locals.supabase`, wywołują `auth.getUser()` i w razie braku sesji zwracają 401 (logika ujęta w helperze `requireUser` w serwisie).
- GET: waliduj parametry Zod, oblicz offset/limit, wykonaj `supabase.from("favorites")` z `eq("user_id", user.id)` i `order` według `created_at` lub `pokemon_id` (dla sortowania po nazwie dane posortuj po dociągnięciu snapshotów), wykorzystaj `range` oraz `select` z `count: "exact"`; pobierz zestaw `pokemon_id`, wykonaj `in` na `pokemon_cache` aby pozyskać nazwę, typy i `payload`, oblicz `spriteUrl` helperem i zmapuj do DTO wraz z `total` i `hasNext`.
- POST: odczytaj JSON, waliduj Zod, w serwisie wywołaj `upsertFavorite` (Supabase `upsert` z `onConflict: "user_id,pokemon_id"` i `select("pokemon_id, created_at")`), na podstawie metadanych lub nagłówków oceniaj czy rekord nowy; obsłuż błędy zakresowe i zwróć DTO.
- DELETE: odczytaj `pokemonId` ze ścieżki, waliduj Zod, w serwisie wykonaj `supabase.from("favorites").delete().match({ user_id: user.id, pokemon_id })` z `select("pokemon_id")` aby uzyskać count; przy count 0 zwróć 404, w przeciwnym razie kończ 204.
- Serwis `src/lib/favorites/service.ts` udostępni wspólne helpery (`requireUser`, `parseSpriteUrlFromPayload`, `toFavoriteListItem`, `fetchFavorites`) redukując duplikację w handlerach.

## 5. Względy bezpieczeństwa

- Autentykacja: wykorzystaj `locals.supabase.auth.getUser()`; brak usera => 401; błędy Supabase loguj i maskuj w odpowiedzi.
- Autoryzacja: każde zapytanie zawężone `eq("user_id", user.id)` oraz objęte RLS w tabeli `favorites`; brak tokena lub RLS denial => 403.
- Walidacja: Zod we wszystkich handlerach odrzuca niepoprawne typy i zakresy, uniemożliwiając wstrzyknięcia lub masowe akcje.
- Limitowanie: integruj z istniejącym mechanizmem throttlingu (middleware/edge) i propaguj nagłówek `Retry-After`; opcjonalnie loguj ostrzeżenie przy częstych 429.
- Prywatność: ustaw `Cache-Control: private, max-age=0, must-revalidate`; w logach nie utrwalaj szczegółów żądania poza anonimowym kontekstem (np. `pokemonId`).

## 6. Obsługa błędów

- 400: niepoprawny JSON, brak `pokemonId` w body, nieprawidłowe formaty query/path; komunikat przyjazny użytkownikowi.
- 401: brak sesji Supabase; 403: RLS odrzuca zapytanie lub brak wymaganych nagłówków JWT.
- 404: próba usunięcia ulubionego, którego użytkownik nie ma; GET pusty wynik pozostaje 200 z pustą listą.
- 409: w przypadku błędu unikalności (kod `23505`) potraktuj odpowiedź jak istniejący rekord i zwróć 200 z aktualnym `addedAt`.
- 422: `pokemonId` poza zakresem 1-1025 (kod `23514`) lub inne naruszenia ograniczeń danych; komunikat jasno wskazuje problem.
- 429: propaguj z middleware, ustaw `Retry-After` w sekundach oraz komunikat o limitach.
- 500: nieoczekiwane błędy Supabase/intern, loguj `console.error("[favorites] ...", { userId, context })`; brak dedykowanej tabeli błędów oznacza reliance na monitoring runtime.

## 7. Rozważania dotyczące wydajności

- Wymuś limit `pageSize` 50 i korzystaj z `range` aby wykorzystywać indeksy `favorites_user_idx` oraz `favorites_created_at_idx`.
- Użyj `select({ head: true, count: "exact" })` dla totalu tylko raz na żądanie, unikając zbędnych odczytów danych.
- Pobieraj dane `pokemon_cache` zbiorczo (`in('pokemon_id', ids)`) i buduj mapę w pamięci, redukując liczbę round-tripów.
- Helper `parseSpriteUrlFromPayload` powinien obsługiwać najczęstsze pola (`official-artwork`, `home`, `front_default`) oraz unikać wielokrotnego `JSON.parse` przez użycie przechowywanego `payload`.
- Sortowanie po nazwie wykonuj po stronie aplikacji na już pobranych rekordach (maksymalnie `pageSize` elementów) lub rozważ przyszłe RPC w bazie jeśli liczba ulubionych zacznie rosnąć.

## 8. Etapy wdrożenia

1. Dodaj `src/lib/favorites/service.ts` z helperami `requireUser`, `fetchFavorites`, `loadPokemonSnapshots`, `upsertFavorite`, `deleteFavorite`, `parseSpriteUrlFromPayload`.
2. Utwórz `src/lib/favorites/validation.ts` z Zod schemas `FavoritesQuerySchema`, `AddFavoriteSchema`, `PokemonIdParamSchema` oraz funkcją dostarczającą wartości domyślne.
3. Zaimplementuj mappery DTO i helper budujący odpowiedź paginowaną (`toFavoritesListResponse`) w serwisie lub dedykowanym module.
4. Stwórz endpoint `src/pages/api/users/me/favorites.ts` z handlerami GET/POST wykorzystującymi serwis i spójny helper `jsonResponse`.
5. Dodaj dynamiczny endpoint `src/pages/api/users/me/favorites/[pokemonId].ts` obsługujący DELETE z walidacją i serwisem.
6. (Opcjonalnie) wprowadź moduł `src/lib/http/responses.ts` zapewniający jednolity format odpowiedzi sukcesu i błędu oraz ustawianie nagłówków.
7. Napisz testy Vitest dla serwisu (mock Supabase) pokrywające paginację, sortowanie, idempotencję i usuwanie.
8. Dodaj testy integracyjne/contract dla endpointów (MSW lub supertest na mockowanym Supabase) aby zweryfikować kody statusów i format JSON.
9. Uruchom `pnpm lint`, `pnpm typecheck` i `pnpm test`, a następnie ręcznie sprawdź logi i nagłówki (`Retry-After`, `Cache-Control`) przed wdrożeniem.
