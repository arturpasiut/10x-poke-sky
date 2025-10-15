# Plan implementacji widoku Czat AI

## 1. Przegląd

- Widok czatu AI na ścieżce `/ai` pomaga użytkownikom zidentyfikować Pokémona na podstawie opisu w języku naturalnym, bez zapisywania historii sesji.
- Interfejs łączy transkrypcję sesji, formularz promptu z walidacją (10–500 znaków), sugestie szybkich zapytań oraz listę rekomendowanych Pokémonów z poziomem pewności.
- Widok przestrzega wymagań dostępności (aria-live), zapewnia messaging wyłącznie w domenie Pokemon oraz reaguje na limity i błędy API z odpowiednimi komunikatami.

## 2. Routing widoku

- Astro page `src/pages/ai.astro` (lub `src/pages/ai/index.astro` jeśli wymagane foldery), eksportująca Reactowy komponent `AIChatPanel`.
- Dodanie wpisu do istniejącej nawigacji/CTA zgodnie z PRD (przycisk/zakładka uruchamiająca czat AI).

## 3. Struktura komponentów

- Główne komponenty: `AIChatPage`, `AIChatPanel`, `ChatSkeleton`, `RateLimitAlert`, `SuggestionChips`, `ChatTranscript`, `SuggestionCards`, `SuggestionCard`, `PromptInput`, `FavoritePromptCTA`.
- Reużywalne helpery: hook `useAiChatSession`, funkcje mapujące DTO na view modele.
- Diagram drzewa:

```text
AIChatPage (.astro)
└─ AIChatPanel (React)
   ├─ RateLimitAlert
   ├─ SuggestionChips
   ├─ ChatTranscript
   │  └─ ChatMessageRow (opc.)
   ├─ SuggestionCards
   │  └─ SuggestionCard
   │     └─ FavoritePromptCTA (w zależności od auth)
   └─ PromptInput
```

## 4. Szczegóły komponentów

### AIChatPage

- Opis: Strona Astro odpowiedzialna za layout widoku, SEO (tytuł/meta), breadcrumbs i lazy-load Reactowego `AIChatPanel`.
- Główne elementy: wrapper layoutu, nagłówek z nazwą widoku, sekcja kontenera na panel czatu.
- Obsługiwane interakcje: brak (tylko przekierowania/nawigacja).
- Obsługiwana walidacja: brak.
- Typy: używa `PageProps` Astro oraz propsów przekazywanych do `AIChatPanel`.
- Propsy: przekazuje `initialSuggestions`, `isAuthenticated` (odczytane z Supabase session), opcjonalnie `preferredGeneration`.

### AIChatPanel

- Opis: Kontroluje logikę czatu (stan sesji, wywołania API, render warunkowy skeletonów, alertów i treści). Integruje hook `useAiChatSession`.
- Główne elementy: sekcja główna, nagłówek panelu, wrapper transkrypcji (aria-live), sekcja sugestii, formularz promptu.
- Obsługiwane interakcje: inicjalizacja sesji, wysyłanie promptu, anulowanie żądania, reset sesji, kliknięcie karty Pokémona, zapis do ulubionych (przez CTA).
- Obsługiwana walidacja: deleguje walidację promptu (min/max), blokuje submit gdy `isSubmitting` lub brak ważności, wymusza domenowe komunikaty („Pozostań przy świecie Pokémon”).
- Typy: korzysta z `AiChatSessionState`, `AiIdentifyCommand`, `AiIdentifyResponseDto`, `AiChatSuggestionViewModel`.
- Propsy: `initialSuggestions?: AiChatSuggestionViewModel[]`, `isAuthenticated: boolean`, `preferredGeneration?: string`.

### ChatSkeleton

- Opis: Placeholder podczas pierwszego ładowania lub oczekiwania na odpowiedź, wyświetlany zgodnie z PRD aby utrzymać percepcję szybkości.
- Główne elementy: shimmer bloków transkrypcji i kart sugestii, spójne z Tailwind/TW classes.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak specyficznych (prosty komponent funkcyjny).
- Propsy: `variant: "initial" | "response"` dla rozróżnienia faz.

### RateLimitAlert

- Opis: Wyświetla komunikaty o limitach i błędach (429/500/401). Pokazuje CTA do logowania, jeśli próba zapisu do ulubionych wymaga autoryzacji.
- Główne elementy: `Alert` z ikoną, tekstem, przyciskiem (np. „Zaloguj się”).
- Obsługiwane interakcje: kliknięcie CTA (nawigacja do logowania), zamknięcie alertu.
- Obsługiwana walidacja: sprawdza typ błędu i treść komunikatu fallback.
- Typy: `AiChatErrorState`.
- Propsy: `error: AiChatErrorState | null`, `onDismiss?: () => void`, `onLoginRedirect?: () => void`.

### SuggestionChips

- Opis: Zestaw podpowiedzi ułatwiających start rozmowy (np. „Niebieski Pokemon wodny”). Aktualizuje prompt po kliknięciu.
- Główne elementy: lista przycisków (chips), ikonki domenowe.
- Obsługiwane interakcje: klik chipu -> `onSelectSuggestion`.
- Obsługiwana walidacja: ban na szybkie powtórzenia (opcjonalne throttling), ogranicza do 500 znaków.
- Typy: `SuggestionChip`, `AiChatSessionState["suggestedPrompts"]`.
- Propsy: `items: SuggestionChip[]`, `onSelect: (value: string) => void`, `disabled?: boolean`.

### ChatTranscript

- Opis: Wyświetla bieżącą transkrypcję sesji (wiadomości użytkownika i AI). Zapewnia aria-live="polite" dla odpowiedzi.
- Główne elementy: lista `<ul>` lub `<div role="log">`, elementy wiadomości z rolami, znaczniki czasu.
- Obsługiwane interakcje: przewijanie do najnowszej wiadomości, kopiowanie wiadomości (opc.).
- Obsługiwana walidacja: filtruje odpowiedzi poza domeną (wyświetla ostrzeżenie, jeśli API zwróci niepożądane dane).
- Typy: `AiChatMessage`.
- Propsy: `messages: AiChatMessage[]`, `isLoading: boolean`, `onRetry?: () => void`.

### SuggestionCards

- Opis: Sekcja wyników z kartami Pokémona (miniaturka, opis, confidence, CTA).
- Główne elementy: siatka kart, nagłówek „Najbardziej pasujące Pokemony”.
- Obsługiwane interakcje: kliknięcie karty -> nawigacja do `/pokemon/[id]`; kliknięcie CTA ulubionych; rozwinięcie dodatkowych informacji.
- Obsługiwana walidacja: ukrywa sekcję, gdy brak sugestii lub API zwraca `success=false`.
- Typy: `AiChatSuggestionViewModel`.
- Propsy: `suggestions: AiChatSuggestionViewModel[]`, `onFavorite: (pokemonId: number) => void`, `isAuthenticated: boolean`.

### SuggestionCard

- Opis: Pojedyncza karta z danymi Pokémona (sprite, nazwa, opis, confidence, link).
- Główne elementy: obraz `<img>` z alt, badge z confidence, przycisk „Do szczegółów”, CTA do ulubionych (przekazuje do `FavoritePromptCTA`).
- Obsługiwane interakcje: `onClick` do szczegółów, `onFavorite`.
- Obsługiwana walidacja: sprawdza dostępność sprite, fallback alt.
- Typy: `AiChatSuggestionViewModel`.
- Propsy: `suggestion: AiChatSuggestionViewModel`, `onFavorite: (pokemonId: number) => void`, `isAuthenticated: boolean`.

### FavoritePromptCTA

- Opis: Mały komponent przycisku/CTA; jeśli użytkownik niezalogowany – pokazuje przycisk logowania; jeśli zalogowany – aktywuje dodanie do ulubionych (korzysta z istniejącego API/akcji).
- Główne elementy: przycisk, tooltip/tekst.
- Obsługiwane interakcje: klik -> `handleFavorite` lub `redirectToLogin`.
- Obsługiwana walidacja: blokuje ponowne dodanie, pokazuje stan postępu.
- Typy: reuse `FavoriteMutationResultDto` (jeśli call), `AiChatSuggestionViewModel`.
- Propsy: `pokemonId: number`, `isAuthenticated: boolean`, `onFavorite: (pokemonId: number) => Promise<void>`, `isLoading?: boolean`.

### PromptInput

- Opis: Formularz promptu z walidacją min 10 / max 500 znaków, wskaźnik liczby znaków, obsługa klawisza Enter (z `Shift+Enter` dla nowej linii).
- Główne elementy: `<form>`, `<textarea>`, licznik znaków, przycisk „Wyślij”.
- Obsługiwane interakcje: `onSubmit`, `onChange`, `onKeyDown` (blokuje wysyłkę pustych).
- Obsługiwana walidacja: min/max długość, brak tylko białych znaków, ostrzeżenie gdy zbliża się limit, informacja o wymaganiach domenowych.
- Typy: `AiChatFormData`, `PromptValidationState`.
- Propsy: `value: string`, `onChange: (value: string) => void`, `onSubmit: () => void`, `isSubmitting: boolean`, `validation: PromptValidationState`.

## 5. Typy

- `AiChatMessage`: `{ id: string; role: "user" | "assistant"; content: string; createdAt: string; status?: "pending" | "delivered" | "error"; }`.
- `AiChatSuggestionViewModel`: `{ pokemonId: number; name: string; spriteUrl: string | null; description: string; confidence: number; detailsHref: string; rationale?: string | null; favoriteStatus: "idle" | "loading" | "added"; }`.
- `SuggestionChip`: `{ id: string; label: string; value: string; generationHint?: string; }`.
- `AiChatFormData`: `{ prompt: string; context?: { preferredGeneration?: string }; }`.
- `PromptValidationState`: `{ isValid: boolean; reasons: ("tooShort" | "tooLong" | "empty" | "nonPokemonDomain")[]; remaining: number; }`.
- `AiChatErrorState`: `{ type: "rateLimit" | "server" | "validation" | "unauthorized" | "network"; message: string; retryAfterSeconds?: number; }`.
- `AiChatSessionState`: `{ messages: AiChatMessage[]; suggestions: AiChatSuggestionViewModel[]; suggestedPrompts: SuggestionChip[]; isSubmitting: boolean; lastQueryId?: string; error: AiChatErrorState | null; requestAbortController?: AbortController; }`.
- DTO reuse: `AiIdentifyCommand`, `AiIdentifyResponseDto`, `AiIdentifySuggestionDto`, `FavoriteMutationResultDto`.
- Mapper helper: `AiIdentifySuggestionDto -> AiChatSuggestionViewModel` (wymaga dodatkowych danych: sprite, opis; pochodzi z lokalnej cache lub dedykowanej funkcji `getPokemonSummary(pokemonId)`).

## 6. Zarządzanie stanem

- Utworzyć custom hook `useAiChatSession` oparty na Zustand lub `useReducer` (lokalny), przechowujący: `prompt`, `messages`, `suggestions`, `isSubmitting`, `error`, `suggestedPrompts`.
- Hook eksponuje akcje: `submitPrompt(prompt, context)`, `selectSuggestionChip(value)`, `resetSession()`, `acknowledgeError()`, `markFavorite(pokemonId)`.
- `AIChatPanel` korzysta z hooka, a `PromptInput`, `SuggestionChips`, `SuggestionCards` otrzymują tylko potrzebne fragmenty stanu (props drilling lub selectors stanu z Zustand).
- Stan ulubionych: reużywa istniejącej logiki (np. `useFavoritesMutation`), wynik (pending/success) zsynchronizowany z `AiChatSuggestionViewModel.favoriteStatus`.
- Integracja z globalnym stanem auth (np. `useAuthStore`) do sterowania CTA logowania.

## 7. Integracja API

- Wywołanie `POST /api/ai/identify` (sync mode domyślny). Payload: `{ prompt: string; context?: { preferredGeneration?: string } }` z walidacją długości przed wysłaniem. Ustaw nagłówki `Content-Type: application/json`.
- Obsługa odpowiedzi `200`: mapowanie `suggestions` na `AiChatSuggestionViewModel` (uzupełnienie sprite/description poprzez dodatkowe źródło: np. `await fetchPokemonSummary(id)` z lokalnego API/caches).
- Obsługa `202`: wyświetlić komunikat „Analiza trwa, spróbuj ponownie” lub włączyć polling według specyfikacji (opcjonalnie: plan zakłada fallback tekstowy bez polling, do potwierdzenia z BE).
- Obsługa błędów:
  - `400`/`422`: oznaczyć walidację, wyświetlić `RateLimitAlert` typu `validation`.
  - `401`: przekierowanie/CTA logowania.
  - `429`: pokazuje `RateLimitAlert` z `retryAfterSeconds` jeśli nagłówek `Retry-After`.
  - `500`: fallback copy informujące o błędzie wewnętrznym i zachęta do spróbowania później.
- Opcjonalne `GET /api/users/me/ai-queries` dla prefill chips (jeśli BE dostarczy) – w planie traktowane jako rozszerzenie (lazy fetch po zalogowaniu).

## 8. Interakcje użytkownika

- Wejście na `/ai`: widok ładuje początkowe sugerowane chipy, skeleton i focusuje prompt (z zachowaniem `prefers-reduced-motion`).
- Kliknięcie chipu sugerującego prompt: wpisuje treść do textarea, przewija do formularza.
- Wysłanie promptu (przycisk lub Enter): walidacja, wysyłka do API, dodanie wiadomości użytkownika do transkrypcji, pokazanie stanu ładowania i `ChatSkeleton`.
- Otrzymanie odpowiedzi AI: aktualizacja transkrypcji (wiadomość asystenta), render kart sugestii z confidence i linkiem do szczegółów (`/pokemon/[id]`).
- Kliknięcie karty Pokémona: nawigacja do widoku szczegółowego (zachowanie `target="_self"`).
- Kliknięcie CTA ulubionych zalogowanego użytkownika: wywołanie mutacji, aktualizacja `favoriteStatus`.
- Próba dodania do ulubionych bez logowania: `RateLimitAlert` lub `FavoritePromptCTA` kieruje do `/login`.
- Klik „Wyczyść czat”: reset transkrypcji i sugestii (jeśli funkcja dostępna).

## 9. Warunki i walidacja

- Prompt: minimum 10 znaków, maksimum 500, brak pustych znaków, zakaz wysyłania gdy `isSubmitting`.
- Domenowe odpowiedzi: jeśli AI zwróci tekst spoza domeny (np. brak dopasowań), na transkrypcji pojawia się komunikat ostrzegawczy i podsuwane są inne akcje (np. odwołanie się do wyszukiwarki nazwy).
- Rate-limit: sprawdzanie kodu 429 i nagłówka `Retry-After`; blokada kolejnych wysyłek na wskazany czas.
- Preferowana generacja: jeśli użytkownik ma ustawienie w profilu, dołączane w `context.preferredGeneration`.
- Dostępność: `aria-live="polite"` na kontenerze odpowiedzi, focus trap dla modali/alertów, rola log dla transkryptu.
- Responsywność: układ kart 1 kolumna na mobile, 2–3 na desktop; formularz w sticky footer na małych ekranach.

## 10. Obsługa błędów

- `400/422`: wyświetlić komunikat „Opis musi zawierać 10–500 znaków i dotyczyć Pokémonów” oraz podkreślić pole promptu na czerwono.
- `401`: CTA logowania z przekierowaniem po sukcesie z powrotem na `/ai`.
- `429`: `RateLimitAlert` z informacją o limicie i timerem; przycisk „Spróbuj ponownie” aktywny po upływie limitu (timery w stanie hooka).
- `500`: fallback “Serwer ma kłopoty, spróbuj ponownie później”, zachęta do użycia wyszukiwarki.
- Network timeout/Abort: pokazanie błędu `network`, opcja ponowienia jednego z poprzednich promptów.
- Brak sugestii (`success=false` lub pusta lista): zamiast kart wyświetlić informację „Brak dopasowań” i zaproponować inne zapytania/filtry.

## 11. Kroki implementacji

1. Dodać stronę Astro `src/pages/ai.astro` z layoutem i importem `AIChatPanel`.
2. Zdefiniować typy i helpery w `src/features/ai-chat/types.ts` (lub podobnej ścieżce) obejmujące `AiChatMessage`, `AiChatSuggestionViewModel`, `SuggestionChip`, `AiChatErrorState`.
3. Zaimplementować hook `useAiChatSession` (Zustand lub React hook) obsługujący stan, akcje i integrację z API.
4. Stworzyć komponent `AIChatPanel` integrujący hook, skeleton, alerty i warunkowe renderowanie sekcji.
5. Zaimplementować `PromptInput` z walidacją, licznik znaków i obsługę skrótów klawiaturowych.
6. Dodać `SuggestionChips` i statyczne/dynamiczne dane startowe (opcjonalnie lazy fetch).
7. Zaimplementować `ChatTranscript` z aria-live, stylami i logiką przewijania.
8. Stworzyć `SuggestionCards` + `SuggestionCard` z mapowaniem DTO, integracją ulubionych i linkiem do szczegółów.
9. Dodać `RateLimitAlert`, integrując obsługę błędów z hooka, CTA logowania i dismiss.
10. Przygotować funkcje do pobierania sprite/opisu Pokémona (np. `fetchPokemonSummary`) i dodać caching po stronie frontendu.
11. Dołączyć obsługę resetu sesji i ewentualny przycisk “Nowa próba”.
12. Napisać testy jednostkowe dla hooka (mock API), `PromptInput` (walidacja), `SuggestionCards` (render/CTA), oraz testy dostępności (aria-live, focus).
13. Zweryfikować widok na mobile/desktop (responsywność) oraz z `prefers-reduced-motion`.
