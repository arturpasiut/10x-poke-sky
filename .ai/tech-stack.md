# 10xRules - Tech Stack

### Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 z nastawieniem na routing server-side
- React 18.3 dla interaktywnych komponentów
- TypeScript 5 dla lepszej jakości kodu i wsparcia IDE
- Tailwind CSS 4 dla szybkiego stylowania
- Zustand dla zarządzania stanem aplikacji
- Lucide React (ikony aplikacji)

### Backend - Astro z Supabase jako kompleksowe rozwiązanie backendowe:

- Wbudowana autentykacja użytkowników oparta o JWT i Supabase Auth
- Baza danych PostgreSQL w oparciu o Supabase

### AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta

### CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- Cloudflare Pages do hostingu - workflow `master.yml`

### Testing:

- Testy jednostkowe i integracyjne - Vitest 3.2.4 z React Testing Library:

  - Vitest jako nowoczesny i szybki runner testów zoptymalizowany dla Vite/Astro
  - React Testing Library 16.3.0 do testowania interaktywnych komponentów React
  - @testing-library/dom do testowania statycznych komponentów Astro
  - @testing-library/jest-dom 6.9.1 - dodatkowe matchery dla asercji
  - @testing-library/user-event 14.6.1 - symulacja interakcji użytkownika
  - jsdom 22.1.0 - środowisko DOM dla testów
  - MSW (Mock Service Worker) do mockowania API w testach (PokeAPI, OpenRouter.ai)
  - Vitest Coverage (v8) - generowanie raportów pokrycia kodu (cel: ≥70%, optymalnie 85%)

- Testy end-to-end - Playwright 1.56.0:

  - Symulacja pełnych ścieżek użytkownika z wieloprzeglądarkowością (Chromium, Firefox, WebKit)
  - Testowanie kluczowych user stories: wyszukiwanie pokemonów, szczegóły, ulubione, czat AI, autentykacja
  - Playwright Accessibility Testing - audyty dostępności (axe-core integration)
  - Testowanie responsywności na różnych urządzeniach (desktop, tablet, mobile)
  - Automatyczne uruchamianie testów w ramach pipeline CI/CD GitHub Actions

- Formatowanie i lintowanie kodu

  - ESLint dla lintowania kodu
  - Prettier dla formatowania kodu

- Zależności: `package.json`
