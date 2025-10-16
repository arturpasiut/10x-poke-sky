# Specyfikacja modułu autentykacji 10x Poke Sky

## 1. Architektura interfejsu użytkownika

### 1.1 Layout i nawigacja

- `src/layouts/MainLayout.astro` pozostaje głównym szkieletem stron aplikacji, ale zyskuje górny pasek typu app-shell renderowany przed obecnym slotem `header`. Pasek renderuje się server-side (Astro) z danymi użytkownika pobranymi z `Astro.locals.supabase.auth.getUser()` i przekazanymi jako prop. Dzięki temu SSR zachowuje świadomość sesji, a dolna nawigacja „dock” nie ulega regresji.
- Nowy komponent `AppTopBar.astro` (server component) odpowiada za:
  - renderowanie logo/skrótów (z zachowaniem obecnego tonu UI),
  - wyróżnione linki do `/ai`, `/moves`, `/favorites` (podobny układ jak na dole),
  - wstawienie slotu `user-actions`, który hydruje się Reactem.
- `AuthLayout.astro` pozostaje kontenerem formularzy auth; dodajemy opcjonalny slot na komponent powiadomień (toast) obsługiwany przez React, aby komunikaty o błędach/sukcesie były spójne dla rejestracji, logowania i resetu hasła.

### 1.2 Strony Astro w trybie auth

- `src/pages/auth/login.astro`, `register.astro`, `forgot.astro` zachowują dotychczasowy markup formularzy (zgodnie z gotowym UI), ale:
  - importują odpowiadające komponenty React (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`) z `client:load`; komponent przechwytuje submit i zarządza stanem, a fallbackowym mechanizmem pozostaje natywne przesłanie formularza.
  - odczytują parametry `redirectTo` i `message` z query stringa (Astro side) i przekazują do Reacta, aby móc komunikować powrót do docelowej ścieżki (US-003) oraz wiadomości po resetach.
- Dodajemy stronę `src/pages/auth/reset.astro` (SSR) obsługującą powrót z maila Supabase (`access_token`, `type=recovery`). Strona zawiera formularz ustawienia nowego hasła + powtórzenie, i hydruje `ResetPasswordForm`.
- Strony wymagające logowania (`/favorites`, w przyszłości `/settings`) wykonują check w astro frontmatterze:
  - jeśli brak aktywnej sesji, następuje redirect 302 do `/auth/login?redirectTo=<ścieżka>` przy zachowaniu dotychczasowego placeholdera jako fallback dla środowisk lokalnych bez Supabase.
  - gdy użytkownik jest zalogowany, `favorites.astro` pobiera SSR listę ulubionych poprzez `Astro.locals.supabase.from("favorites").select("pokemon_id, created_at")` (z joinem do cache w kolejnych etapach) i przekazuje dane do komponentu React `FavoritesList`.

### 1.3 Komponenty React i stan klienta

- Folder `src/components/auth/`:
  - `AuthProvider.tsx`: React context bazujący na `@supabase/supabase-js` (browser client z `src/db/supabase.client.ts`) i `useEffect`, subskrybuje `onAuthStateChange`, utrzymuje `user` oraz status inicjalizacji (`loading/signed-in/signed-out`). Provider używany w `AppTopBar`, `FavoritesList` i formularzach do natychmiastowego odświeżenia UI po zmianie sesji.
  - `AuthSessionHydrator.tsx`: otrzymuje dane usera z SSR (props) i wstępnie ustawia stan w `AuthProvider`, aby uniknąć efektu „blink” przy pierwszym renderze.
  - `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`: komponenty sterujące formularzami; wykorzystują `zod` do walidacji pól; wywołują dedykowane endpointy (`/api/auth/*`), zarządzają loading state, renderują błędy inline pod polami (`aria-invalid`, `aria-describedby`).
  - `UserMenu.tsx`: przycisk w top-barze pokazujący awatar (inicjał z emaila lub z `profiles.avatar_url`), rozwija menu (`Zobacz profil`, `Ulubione`, `Wyloguj`). Dla stanu niezalogowanego renderuje `Zaloguj się` oraz link do rejestracji.
  - `AuthToaster.tsx`: wykorzystuje istniejącą warstwę UI (`Button`, `Alert`) do prezentacji toastów sukcesu (np. „Link resetujący wysłany”).
  - `FavoritesList.tsx`: renderuje kartę ulubionych na podstawie danych SSR; udostępnia akcję „Usuń z ulubionych” wywołującą `removeFavorite` oraz (docelowo) linki do szczegółów pokemona. Obsługuje stan pustej listy oraz błąd ładowania.
- Stan globalny:
  - Reużywamy Zustand (`src/stores/useAuthStore.ts` – nowy plik) jako cienką warstwę trzymającą `<AuthState>` (user metadata, loading, preferencje) i metody `syncWithSession`, `clear`.
  - `AuthProvider` opakowuje store i synchronizuje go, dzięki czemu `AIChatPanel` oraz inne Reactowe komponenty (np. przyszłe listy ulubionych) konsumują te same dane zamiast wywoływać `supabase.auth.getUser()` ad hoc.

### 1.4 Walidacja i komunikaty błędów

- Walidacja client-side: `zod` schematy współdzielone w `src/lib/auth/validation.ts`. Dla formularzy:
  - Logowanie: `email` (`email()`), `password` (`min(8)`), `rememberMe` (boolean).
  - Rejestracja: `email`, `password` (`min(12)`, reguły siły), `confirmPassword` (refine equality), zgoda na regulamin (opcjonalna flaga bool, jeśli dojdzie).
  - Reset/forgot: `email`; przy `ResetPasswordForm` pola `newPassword`, `confirmPassword`.
- Walidacja server-side reużywa te same schematy (import w API routes). Błędy mapowane na:
  - 422 dla błędów walidacji; odpowiedź JSON zawiera `fieldErrors` (klucz -> komunikat) oraz `formError`.
  - 401 dla błędnych danych logowania, 409 dla próby rejestracji istniejącego konta, 429 dla throttlingu `resetPasswordForEmail`.
  - Komunikaty UI (PL) zgodnie z tone-of-voice aplikacji („Niepoprawne dane logowania”, „Sprawdź skrzynkę – wysłaliśmy link resetujący”).

### 1.5 Obsługa scenariuszy użytkownika

- **Logowanie z redirectem**: formularz rozpoznaje `redirectTo`; po sukcesie `AuthProvider` aktualizuje stan, a komponent przekierowuje (`window.location.replace`) na docelową podstronę (fallback `/favorites` jeśli redirect do strefy wymagającej auth).
- **Logowanie błędne**: UI podświetla oba pola + wyświetla baner błędu na górze formularza; checkbox „Zapamiętaj mnie” zachowuje wartość (persist w Zustand).
- **Rejestracja**: po sukcesie pokazuje toast „Sprawdź maila, aby potwierdzić rejestrację” (Supabase wymaga potwierdzenia mailowego jeśli włączone). Automatycznie loguje i przekierowuje, jeśli auto-confirm włączony.
- **Reset hasła**:
  - `ForgotPasswordForm` po udanym wywołaniu endpointu blokuje przycisk (cooldown) i informuje, że mail został wysłany.
  - `ResetPasswordForm` po przetworzeniu tokenu przekierowuje do `/auth/login?message=reset-success` i pokazuje komunikat na stronie logowania.
- **Wylogowanie**: kliknięcie w `UserMenu` wywołuje `supabase.auth.signOut()` przez `/api/auth/logout`, czyści Zustand oraz czyści cookies (SSR); bottom navigation automatycznie reaguje (np. `Ulubione` może przełączyć się w tryb CTA do logowania).
- **Uprawnienia do ulubionych**: `AIChatPanel` korzysta z `AuthProvider` zamiast parametru `isAuthenticated` i obsługuje brak zalogowania przez otwarcie modala CTA lub redirect.

## 2. Logika backendowa

### 2.1 Struktura endpointów API (Astro server routes)

- `POST /api/auth/login`: body `{ email, password, rememberMe }`.
  - Używa `createServerClient` (szczegóły w sekcji 3) z cookie store requestu.
  - Po sukcesie zwraca 200 z `user` (wybrane pola: `id`, `email`, `user_metadata`) i `session` (`expires_at`, `access_token` – token nie trafia do klienta, tylko informacja o czasie) oraz ustawia cookie sesyjne przez Supabase helper.
- `POST /api/auth/register`: body `{ email, password }`; po `auth.signUp` realizuje insert do `public.profiles` (gdy `id` obecny) oraz zwraca 201/202 (zależnie od email_confirm). Obsługuje konwencję `redirectTo` (przekazujemy w Supabase `emailRedirectTo` → `/auth/reset`).
- `POST /api/auth/logout`: czyści sesję (`auth.signOut`), usuwa cookies, zwraca 204.
- `POST /api/auth/forgot`: używa `auth.resetPasswordForEmail`, throttle (max 5/min na IP – logika po stronie Supabase + prosty limiter w pamięci podczas MVP), zwraca 202.
- `POST /api/auth/reset`: oczekuje `accessToken` + nowe hasło; wykorzystuje `auth.exchangeCodeForSession` (jeśli `refresh_token` w query) lub `auth.updateUser({ password })`. Po sukcesie generuje ślad w logach audytowych (console warn/w AI).
- `GET /api/auth/session`: zwraca bieżący stan sesji i profil (cache-control: `private, max-age=0`) – używane przez klienta do rehydratacji po odświeżeniu.
- `GET /api/favorites`: zwraca listę ulubionych pokémonów bieżącego użytkownika (join do `pokemon_cache` w celu dostarczenia nazw/typów). Wymaga aktywnej sesji; przy braku → 401. Wynik służy do rehydratacji klienta (`FavoritesList`) przy dynamicznych przejściach.
- `DELETE /api/favorites/:pokemonId`: alternatywny (obok istniejącego klienta Supabase) mechanizm usuwania. Wersja MVP może pozostać przy bezpośrednim wywołaniu supabase z klienta, lecz endpoint ułatwi przyszłe uszczelnienie logiki i limitowanie (np. audyt).

### 2.2 Walidacja danych wejściowych

- Każdy endpoint importuje `zod` schematy z `src/lib/auth/validation.ts`.
- Błędy walidacji -> `return new Response(JSON.stringify({ fieldErrors, formError }), { status: 422 })`.
- Dodatkowe sanity checks:
  - `rememberMe` mapowany na `session.persistSession` poprzez opcję `options: { rememberMe }`.
  - `redirectTo` oczyszczane funkcją `sanitizeRedirectPath` (dozwolone tylko ścieżki względne w obrębie domeny).
  - Rejestracja sprawdza, czy hasło nie zawiera emaila (`refine`).

### 2.3 Obsługa wyjątków i logowanie zdarzeń

- Przy błędach Supabase (`error.status`, `error.message`) mapujemy:
  - `AuthApiError` z kodem `invalid_credentials` → 401.
  - `AuthApiError` z kodem `user_already_exists` → 409.
  - W pozostałych przypadkach 502 (problem po stronie usług zewnętrznych).
- Logi backendowe: `console.error("[auth/login] ...", { email, code })` z sanitacją (nie logujemy hasła). W trybie produkcyjnym integracja z istniejącą warstwą logów (Cloudflare wrzuca do logs).
- Wysyłka maila resetującego → po sukcesie `console.info("[auth/forgot] reset link requested", { userId/emailHash })` dla audytu.

### 2.4 Renderowanie server-side

- `src/middleware/index.ts` przestaje wstrzykiwać globalny klient; zamiast tego:
  ```ts
  import { createServerClient } from "@supabase/ssr";
  export const onRequest = defineMiddleware((context, next) => {
    const supabase = createServerClient<Database>(runtimeConfig.supabaseUrl, runtimeConfig.supabaseKey, {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => context.cookies.set(key, value, { ...options, path: "/" }),
        remove: (key, options) => context.cookies.delete(key, { ...options, path: "/" }),
      },
    });
    context.locals.supabase = supabase;
    return next();
  });
  ```
- Każda strona wymagająca danych użytkownika (np. `ai.astro`, `favorites.astro`, `settings.astro`) pobiera `const { data } = await Astro.locals.supabase.auth.getUser();` i przekazuje dalej. Dzięki temu SSR widzi sesję (cookie-based), a React hydrator tylko potwierdza stan.
- `astro.config.mjs` pozostaje bez zmian (już `output: "server"` i adapter node). W konfiguracji produkcyjnej Cloudflare Pages -> Worker: zapewnić propagację nagłówków `Set-Cookie`.

### 2.5 Wpływ na istniejącą logikę domenową

- `src/lib/favorites/client.ts`:
  - zastępujemy obecne `supabaseClient` (browser) sprawdzaniem stanu z `useAuthStore`; w przypadku braku klienta – fallback do dotychczasowego błędu o konfiguracji env.
  - `requireAuthenticatedUser` w pierwszej kolejności próbuje odczytać `useAuthStore.getState().user`; dopiero gdy `null`, odwołuje się do `supabaseClient.auth.getUser()` (utrzymanie kompatybilności).
  - dodajemy metodę `listFavorites` korzystającą z `GET /api/favorites` (lub bezpośrednio z Supabase, jeśli SSR przekazało dane) w celu synchronizacji stanu klienta po działaniach w `AIChatPanel`.
- `AIChatPanel` usuwa param `isAuthenticated` (obecnie przekazywany z SSR). Zamiast tego subskrybuje `AuthProvider`. Serwer nadal może przekazywać preferencje (`preferredGeneration`) poprzez metadane usera.
- Strona główna `/` oraz inne publiczne widoki działają bez zmian; top-bar w stanie niezalogowanym pokazuje CTA do logowania, ale nie zmienia istniejącej struktury hero/ dashboardu.
- `favorites.astro` w trybie zalogowanym wczytuje SSR listę ulubionych i przekazuje ją do `FavoritesList`. W trybie niezalogowanym następuje redirect, więc placeholder pozostaje jedynie dla środowisk developerskich bez Supabase.

## 3. System autentykacji z Supabase

### 3.1 Konfiguracja Supabase

- W środowisku `.env` nadal wymagane `SUPABASE_URL`, `SUPABASE_KEY`; `runtimeConfig` (`src/lib/env.ts`) eksportuje wartości do middleware i klienta.
- Dodajemy zależność `@supabase/ssr` (pozwala obsłużyć cookie-based auth). `package.json` → dependencies.
- Na projekcie Supabase:
  - Włączamy email/password auth, opcjonalnie wymuszamy potwierdzenie email (zgodnie z polityką produktu).
  - Ustawiamy `Site URL` na domenę aplikacji (aby Supabase generował poprawne linki resetu).
  - Konfigurujemy `Redirect URLs` → `https://<domain>/auth/reset`.

### 3.2 Przepływy autoryzacji

- **Rejestracja** (`signUp`):
  - Input: email, hasło, optional metadata (`preferredGeneration` w przyszłości).
  - Po `signUp` (jeśli `session` zwrócony) – natychmiastowe logowanie, `AuthProvider` aktualizuje store.
  - Tworzymy wpis w `public.profiles` (zachowanie spójności z migracją `20251007082312_init.sql`).
- **Logowanie** (`signInWithPassword`):
  - `rememberMe` → `options: { refreshToken: rememberMe ? 'persistent' : 'session' }` (Supabase v2). W przyszłości można dodać „device name”.
  - Po sukcesie – cookies `sb-access-token`, `sb-refresh-token` ustawiane przez helper; store rehydrated.
- **Wylogowanie** (`signOut`):
  - Supabase kasuje cookies (helper). Dodatkowo czyścimy preferencje w localStorage (np. redirect).
- **Odzyskiwanie hasła**:
  - `resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })`.
  - `ResetPasswordForm` używa `auth.exchangeCodeForSession` jeśli query zawiera `code`. Po ustawieniu hasła natychmiast loguje użytkownika i przekierowuje na `/settings?event=password-reset`.
- **Zarządzanie sesją**:
  - Klient (`AuthProvider`) ustawia `supabase.auth.setSession` na podstawie response `session`.
  - Middleware SSR zapewnia, że każda prośba ma odczytane cookies i tym samym `Astro.locals.supabase` reprezentuje aktualnego użytkownika.

### 3.3 Integracja z istniejącymi modułami

- `US-003` (Ulubione):
  - `favorites.astro` wymaga sesji → w razie braku redirect + fallback message.
  - `addFavorite`, `removeFavorite` korzystają z aktualnego tokenu użytkownika; brak zmian w RLS (już ogranicza do `auth.uid()`).
  - `FavoritesList.tsx` otrzymuje dane SSR (`pokemon_id`, `created_at`, zjoinowane metadane) i renderuje listę wraz z akcjami toggle; brak danych → komunikat CTA dodawania kolejnych ulubionych.
- `US-005`:
  - Górny pasek z przyciskiem logowania, link „Zapomniałem hasła” w loginie, „Wróć do logowania” w reset.
  - `AIChatPanel` – jeśli `AuthenticationRequiredError`, odczytuje redirectTo i prowadzi do `/auth/login?redirectTo=/ai`.
- `Settings` strona docelowo wypełni się danymi z `profiles` (wyświetlenie email, możliwość zmiany preferencji). Spec uwzględnia to, aby layout miał już slot na sekcję konta.

### 3.4 Bezpieczeństwo i zgodność

- Supabase przechowuje hasła w Bcrypt (zgodnie z wymaganiami PRD); aplikacja nie dotyka surowych haseł poza przesłaniem do Supabase.
- Wszystkie endpointy API weryfikują CSRF poprzez nagłówek `Origin`/`Referer` (proste sprawdzenie względem `runtimeConfig.supabaseUrl` + dozwolone hosty). Formy auth działają w tym samym pochodzeniu, więc check przechodzi.
- RLS pozostaje włączone dla `favorites`, `profiles`. BACKEND nie używa service role ani nie generuje tokenów manualnie.
- Rate limiting: prosta ochrona `POST /api/auth/*` (np. `src/lib/rate-limit.ts` – limiter w pamięci + w przyszłości KV storage). Klucz = IP + endpoint; limity: logowanie 5/min, reset 3/min.

### 3.5 Testy i monitoring

- Testy jednostkowe (Vitest):
  - `AuthProvider` – symulacja eventów `onAuthStateChange`.
  - Funkcje walidujące (`validation.ts`) – sprawdzenie edge cases.
- Testy e2e (Playwright):
  - Scenariusz rejestracji + logowania z mockowanym Supabase (MSW intercept), weryfikacja redirectów.
  - Reset hasła – symulacja kliknięcia linku z tokenem query.
- Monitoring: Logowanie zdarzeń auth do konsoli (Cloudflare -> log stream). W razie potrzeby dodać Sentry integrację w kolejnych etapach.
