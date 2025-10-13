<authentication_analysis>
1. Przepływy autentykacji: logowanie istniejącego użytkownika (formularz → Astro API → Supabase → ustanowienie sesji), rejestracja (formularz → API → Supabase → mail potwierdzający → autologowanie), reset hasła (żądanie linku → mail → ustawienie nowego hasła), ponowna weryfikacja sesji przy SSR (middleware `createServerClient`), odświeżanie tokenu przez Supabase cookies, wylogowanie (API → Supabase → usunięcie cookies).
2. Aktorzy: Przeglądarka (formulare React + stan AuthProvider), Middleware Astro (ustawia `Astro.locals.supabase` przez cookies), Astro API (`/api/auth/*`, `/api/favorites`), Supabase Auth (usługa zewnętrzna zarządzająca użytkownikami, sesją, mailami).
3. Weryfikacja i odświeżanie tokenów: Middleware odczytuje cookies i tworzy klienta; Supabase SDK automatycznie odnawia access token przy ważnym refresh tokenie; w razie błędu API reaguje 401 i wymusza redirect. Supabase wysyła maile weryfikacyjne i link resetu; potwierdzenie ustawia aktywną sesję. Wylogowanie usuwa refresh i access tokeny (cookies).
4. Kroki autentykacji: (a) użytkownik przesyła formularz; (b) API waliduje dane (`zod`), inicjuje żądanie do Supabase; (c) Supabase zwraca sukces/błąd oraz ustawia/weryfikuje sesję; (d) API przekazuje wynik do przeglądarki i ustawia cookies; (e) po sukcesie AuthProvider synchronizuje stan i przekierowuje użytkownika; (f) przy kolejnych SSR middleware weryfikuje cookies i udostępnia aktualną sesję; (g) przy wygaśnięciu tokenu Supabase próbuje odświeżyć, w razie niepowodzenia API zwraca 401 i frontend prosi o ponowne logowanie.
</authentication_analysis>

<mermaid_diagram>
```mermaid
sequenceDiagram
  autonumber
  participant Browser as Przeglądarka
  participant Middleware as Middleware Astro
  participant API as Astro API
  participant Supabase as Supabase Auth

  Note over Browser: Użytkownik otwiera stronę chronioną
  Browser->>Middleware: Żądanie strony z cookies sesji
  activate Middleware
  Middleware->>Supabase: createServerClient<br/>weryfikacja refresh tokenu
  activate Supabase
  Supabase-->>Middleware: Sesja OK lub 401
  deactivate Supabase
  alt Sesja ważna
    Middleware-->>Browser: Render SSR z danymi użytkownika
  else Sesja wygasła
    Middleware-->>Browser: Redirect do /auth/login
  end
  deactivate Middleware

  Note over Browser: Użytkownik wysyła formularz logowania
  Browser->>API: POST /api/auth/login (email, hasło)
  activate API
  API->>API: Walidacja danych (zod)
  API->>Supabase: auth.signInWithPassword
  activate Supabase
  Supabase-->>API: Sesja / błąd
  deactivate Supabase
  alt Logowanie poprawne
    API->>Browser: 200 OK + komunikat sukcesu
    API->>Browser: Set-Cookie (access, refresh)
    Browser->>Browser: AuthProvider.syncSession
    Browser->>Middleware: Następne żądanie SSR
  else Dane błędne
    API-->>Browser: 401 + komunikat
  end
  deactivate API

  Note over Browser: Rejestracja nowego konta
  Browser->>API: POST /api/auth/register
  activate API
  API->>API: Walidacja danych
  API->>Supabase: auth.signUp + emailRedirectTo
  activate Supabase
  Supabase-->>API: Link aktywacyjny wysłany
  deactivate Supabase
  API-->>Browser: 201 + instrukcja potwierdzenia
  deactivate API
  Browser-->>Supabase: Klik linku w mailu (poza aplikacją)
  Supabase-->>Browser: Potwierdzenie + redirect do /auth/reset

  Note over Browser: Zmiana hasła po linku
  Browser->>API: POST /api/auth/reset (token, nowe hasło)
  activate API
  API->>Supabase: auth.exchangeCodeForSession
  activate Supabase
  Supabase-->>API: Sesja po zmianie hasła
  deactivate Supabase
  API->>Browser: 200 + Set-Cookie
  deactivate API
  Browser->>Browser: AuthProvider.syncSession

  Note over Browser: Obsługa wylogowania
  Browser->>API: POST /api/auth/logout
  activate API
  API->>Supabase: auth.signOut
  activate Supabase
  Supabase-->>API: Potwierdzenie
  deactivate Supabase
  API->>Browser: 204 + usunięcie cookies
  deactivate API
  Browser->>Browser: AuthProvider.clearState

  Note over Browser,Supabase: Supabase SDK odświeża access token w tle<br/>przez ważny refresh token z cookies
  par Token ważny
    Browser->>Supabase: refresh session (automatycznie)
    Supabase-->>Browser: nowy access token
  and Token wygasł
    Browser->>Supabase: próba refresh
    Supabase-->>Browser: 401
    Browser-->>API: Kolejne żądanie -> 401
    API-->>Browser: Wymuszenie ponownego logowania
  end
```
</mermaid_diagram>
