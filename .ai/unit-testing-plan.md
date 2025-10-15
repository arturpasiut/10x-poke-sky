# Plan Testów Jednostkowych - 10x-poke-sky

**Data utworzenia**: 2025-10-15
**Wersja**: 1.0
**Status**: Do implementacji

## Wprowadzenie

Ten dokument zawiera szczegółową listę komponentów, hooków i funkcji utility do przetestowania w ramach testów jednostkowych (Unit Tests) zgodnie z planem testów (punkt 2.1).

**Narzędzia**: Vitest 3.2.4 + React Testing Library 16.3.0 + @testing-library/jest-dom 6.9.1

**Cel pokrycia kodu**: Minimum 70%, optymalnie 85%

---

## 📋 Komponenty do Testowania

### **1. Komponenty UI (shadcn/ui)**

**Priorytet**: Wysoki (podstawowe building blocks)

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| Button | `src/components/ui/button.tsx` | ❌ Brak | Wysoki |
| Badge | `src/components/ui/badge.tsx` | ❌ Brak | Wysoki |
| Input | `src/components/ui/input.tsx` | ⚠️ Do weryfikacji | Wysoki |

**Zakres testów**:
- Props (variants, sizes, disabled state)
- Events (onClick, onChange)
- Accessibility (aria-labels, keyboard navigation)
- Class composition (cn utility)

**Status**: 2-3 komponenty | 0 testów istniejących | 2-3 testy do napisania

---

### **2. Komponenty Autentykacji (Auth)**

**Priorytet**: Krytyczny (bezpieczeństwo)

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| LoginForm | `src/components/auth/LoginForm.tsx` | ❌ Brak | Krytyczny |
| RegisterForm | `src/components/auth/RegisterForm.tsx` | ❌ Brak | Krytyczny |
| ForgotPasswordForm | `src/components/auth/ForgotPasswordForm.tsx` | ❌ Brak | Wysoki |
| FormStatusBanner | `src/components/auth/FormStatusBanner.tsx` | ❌ Brak | Średni |

**Zakres testów**:
- Renderowanie formularzy
- Walidacja pól (email, hasło, potwierdzenie hasła)
- Wyświetlanie błędów walidacji
- Komunikaty sukcesu/błędu (FormStatusBanner)
- Disabled state podczas submitu
- Integration z walidatorami Zod

**Status**: 4 komponenty | 0 testów istniejących | 4 testy do napisania

---

### **3. Komponenty Pokemon**

**Priorytet**: Wysoki (główna funkcjonalność)

#### **3.1 Lista i Wyszukiwanie**

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| PokemonGrid | `src/components/pokemon/PokemonGrid.tsx` | ✅ Istnieje | Wysoki |
| PokemonCard | `src/components/pokemon/PokemonCard.tsx` | ❌ Brak | Wysoki |
| SearchHeader | `src/components/pokemon/SearchHeader.tsx` | ✅ Istnieje | Wysoki |
| FilterSidePanel | `src/components/pokemon/FilterSidePanel.tsx` | ✅ Istnieje | Wysoki |
| MobileFilterDrawer | `src/components/pokemon/MobileFilterDrawer.tsx` | ❌ Brak | Średni |
| FilterChips | `src/components/pokemon/FilterChips.tsx` | ❌ Brak | Średni |
| SortBar | `src/components/pokemon/SortBar.tsx` | ❌ Brak | Średni |
| PaginationControls | `src/components/pokemon/PaginationControls.tsx` | ❌ Brak | Wysoki |

**Zakres testów**:
- Renderowanie danych pokemonów
- Interakcje użytkownika (kliknięcia, hover)
- Filtrowanie i sortowanie
- Paginacja (next/prev, page numbers)
- Responsywność (mobile vs desktop components)
- Empty states

#### **3.2 Szczegóły i Stany**

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| PokemonStatsPanel | `src/components/pokemon/PokemonStatsPanel.tsx` | ❌ Brak | Średni |
| PokemonEvolutionTimeline | `src/components/pokemon/evolution/PokemonEvolutionTimeline.tsx` | ❌ Brak | Średni |
| PokemonMovesGrid | `src/components/pokemon/moves/PokemonMovesGrid.tsx` | ❌ Brak | Niski |
| PokemonFavoriteAction | `src/components/pokemon/PokemonFavoriteAction.tsx` | ❌ Brak | Wysoki |
| EmptyStateWithAI | `src/components/pokemon/EmptyStateWithAI.tsx` | ❌ Brak | Średni |
| ErrorCallout | `src/components/pokemon/ErrorCallout.tsx` | ❌ Brak | Średni |
| StatusBanner | `src/components/pokemon/StatusBanner.tsx` | ❌ Brak | Średni |
| ListSkeleton | `src/components/pokemon/ListSkeleton.tsx` | ❌ Brak | Niski |

**Zakres testów**:
- Wyświetlanie statystyk i danych
- Timeline ewolucji (renderowanie łańcucha)
- Akcje ulubione (toggle state)
- Error states i komunikaty
- Loading states (skeletons)

#### **3.3 Główne widoki**

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| PokemonListingView | `src/components/pokemon/PokemonListingView.tsx` | ❌ Brak | Wysoki |

**Zakres testów**:
- Integration komponentów
- Flow wyszukiwania + filtrowania
- Zarządzanie stanem (Zustand store)

**Status**: 17 komponentów | 3 testy istniejące | 14 testów do napisania

---

### **4. Komponenty Czat AI**

**Priorytet**: Wysoki (kluczowa funkcjonalność AI)

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| AIChatPanel | `src/components/ai-chat/AIChatPanel.tsx` | ❌ Brak | Wysoki |
| ChatTranscript | `src/components/ai-chat/ChatTranscript.tsx` | ✅ Istnieje | Wysoki |
| PromptInput | `src/components/ai-chat/PromptInput.tsx` | ✅ Istnieje | Wysoki |
| SuggestionCards | `src/components/ai-chat/SuggestionCards.tsx` | ❌ Brak | Średni |
| SuggestionCard | `src/components/ai-chat/SuggestionCard.tsx` | ❌ Brak | Średni |
| SuggestionChips | `src/components/ai-chat/SuggestionChips.tsx` | ❌ Brak | Średni |
| RateLimitAlert | `src/components/ai-chat/RateLimitAlert.tsx` | ❌ Brak | Wysoki |
| FavoritePromptCTA | `src/components/ai-chat/FavoritePromptCTA.tsx` | ❌ Brak | Niski |
| ChatSkeleton | `src/components/ai-chat/ChatSkeleton.tsx` | ❌ Brak | Niski |

**Zakres testów**:
- Wysyłanie promptów
- Wyświetlanie transkryptu rozmowy
- Karty sugestii pokemonów
- Rate limit alerts
- Loading states
- Integration z useAiChatSession hook

**Status**: 9 komponentów | 2 testy istniejące | 7 testów do napisania

---

### **5. Komponenty Ulubionych (Favorites)**

**Priorytet**: Średni

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| FavoritesView | `src/components/favorites/FavoritesView.tsx` | ❌ Brak | Średni |

**Zakres testów**:
- Lista ulubionych pokemonów
- Empty state (brak ulubionych)
- Usuwanie z ulubionych
- Integration z Supabase

**Status**: 1 komponent | 0 testów istniejących | 1 test do napisania

---

### **6. Komponenty Providers**

**Priorytet**: Wysoki (zarządzanie stanem)

| Komponent | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| SessionProvider | `src/components/providers/SessionProvider.tsx` | ❌ Brak | Wysoki |

**Zakres testów**:
- Inicjalizacja sesji
- Context propagation
- Session updates

**Status**: 1 komponent | 0 testów istniejących | 1 test do napisania

---

### **7. Custom Hooki (Hooks)**

**Priorytet**: Krytyczny (logika biznesowa)

| Hook | Ścieżka | Status testów | Priorytet |
|------|---------|---------------|-----------|
| usePokemonListQuery | `src/hooks/usePokemonListQuery.ts` | ✅ Istnieje | Krytyczny |
| usePokemonFilterOptions | `src/hooks/usePokemonFilterOptions.ts` | ❌ Brak | Wysoki |
| useAiChatSession | `src/features/ai-chat/useAiChatSession.ts` | ✅ Istnieje | Krytyczny |

**Zakres testów**:
- Data fetching (success, loading, error states)
- Query parameters
- Cache behavior
- Integration z API endpoints
- State management

**Status**: 3 hooki | 2 testy istniejące | 1 test do napisania

---

### **8. Zustand Store'y**

**Priorytet**: Wysoki (zarządzanie stanem globalnym)

| Store | Ścieżka | Status testów | Priorytet |
|-------|---------|---------------|-----------|
| usePokemonSearchStore | `src/stores/usePokemonSearchStore.ts` | ❌ Brak | Wysoki |
| useSessionStore | `src/lib/stores/use-session-store.ts` | ❌ Brak | Wysoki |

**Zakres testów**:
- Initial state
- Actions (setters, resetters)
- Computed values (selectors)
- State persistence (jeśli zaimplementowane)

**Status**: 2 store'y | 0 testów istniejących | 2 testy do napisania

---

### **9. Funkcje Pomocnicze i Utility**

**Priorytet**: Wysoki (transformacje, filtrowanie)

#### **9.1 Pokemon Utilities**

| Utility | Ścieżka | Status testów | Priorytet |
|---------|---------|---------------|-----------|
| filters | `src/lib/pokemon/filters.ts` | ❌ Brak | Wysoki |
| transformers | `src/lib/pokemon/transformers.ts` | ❌ Brak | Wysoki |
| query | `src/lib/pokemon/query.ts` | ❌ Brak | Średni |

**Zakres testów**:
- Funkcje filtrowania (po typie, generacji, nazwie)
- Transformery danych z PokeAPI
- Query builders

#### **9.2 Favorites Utilities**

| Utility | Ścieżka | Status testów | Priorytet |
|---------|---------|---------------|-----------|
| transformers | `src/lib/favorites/transformers.ts` | ❌ Brak | Średni |
| client | `src/lib/favorites/client.ts` | ❌ Brak | Średni |
| service | `src/lib/favorites/service.ts` | ❌ Brak | Średni |

**Zakres testów**:
- Transformacja danych ulubionych
- API client functions
- Service layer logic

#### **9.3 AI Utilities**

| Utility | Ścieżka | Status testów | Priorytet |
|---------|---------|---------------|-----------|
| mappers | `src/features/ai-chat/mappers.ts` | ❌ Brak | Średni |
| prompts | `src/lib/ai/prompts.ts` | ❌ Brak | Niski |

**Zakres testów**:
- Mapowanie odpowiedzi AI
- Prompt templates

#### **9.4 Ogólne Utilities**

| Utility | Ścieżka | Status testów | Priorytet |
|---------|---------|---------------|-----------|
| utils | `src/lib/utils.ts` | ❌ Brak | Wysoki |
| responses | `src/lib/http/responses.ts` | ❌ Brak | Średni |

**Zakres testów**:
- cn() function (classnames merging)
- HTTP response helpers

**Status**: 10 plików utility | 0 testów istniejących | 10 testów do napisania

---

### **10. Walidatory (Zod Schemas)**

**Priorytet**: Krytyczny (bezpieczeństwo danych)

| Walidator | Ścieżka | Status testów | Priorytet |
|-----------|---------|---------------|-----------|
| auth/validation | `src/lib/auth/validation.ts` | ❌ Brak | Krytyczny |
| favorites/validation | `src/lib/favorites/validation.ts` | ❌ Brak | Wysoki |

**Zakres testów**:
- loginSchema (email, password validation)
- registerSchema (email, password, confirmPassword)
- resetPasswordSchema
- Favorites schemas
- Edge cases (empty strings, SQL injection attempts, XSS)

**Status**: 2 pliki walidacji | 0 testów istniejących | 2 testy do napisania

---

## 📊 Podsumowanie Statystyk

| Kategoria | Liczba elementów | Testy istniejące | Brakujące testy | % Pokrycia |
|-----------|------------------|------------------|-----------------|------------|
| **Komponenty UI** | 2-3 | 0 | 2-3 | 0% |
| **Komponenty Auth** | 4 | 0 | 4 | 0% |
| **Komponenty Pokemon** | 17 | 3 | 14 | 18% |
| **Komponenty AI Chat** | 9 | 2 | 7 | 22% |
| **Komponenty Favorites** | 1 | 0 | 1 | 0% |
| **Providers** | 1 | 0 | 1 | 0% |
| **Custom Hooki** | 3 | 2 | 1 | 67% |
| **Zustand Store'y** | 2 | 0 | 2 | 0% |
| **Funkcje Utility** | 10 | 0 | 10 | 0% |
| **Walidatory** | 2 | 0 | 2 | 0% |
| **RAZEM** | **51** | **7** | **44** | **14%** |

**Aktualny stan**: 7 testów istniejących / 51 elementów do przetestowania = **14% pokrycia**

**Cel**: 70% pokrycia (minimum), 85% pokrycia (optymalnie)

**Do zrobienia**: 44 testy jednostkowe

---

## 🎯 Priorytetyzacja i Harmonogram

### **Sprint 1: Fundamenty i Komponenty Krytyczne** (2 tygodnie)

**Cel**: Pokrycie podstawowych komponentów i krytycznej logiki biznesowej

**Priorytet 1 - Bezpieczeństwo i Walidacja** (Tydzień 1, Dni 1-3)
- [ ] `src/lib/auth/validation.ts` - Schematy Zod dla auth
- [ ] `src/lib/favorites/validation.ts` - Schematy Zod dla favorites
- [ ] `src/components/auth/LoginForm.tsx`
- [ ] `src/components/auth/RegisterForm.tsx`
- [ ] `src/components/auth/ForgotPasswordForm.tsx`
- [ ] `src/components/auth/FormStatusBanner.tsx`

**Priorytet 2 - Komponenty UI Podstawowe** (Tydzień 1, Dni 4-5)
- [ ] `src/components/ui/button.tsx`
- [ ] `src/components/ui/badge.tsx`
- [ ] `src/lib/utils.ts` (cn function)

**Priorytet 3 - Pokemon Core Components** (Tydzień 2, Dni 1-3)
- [ ] `src/components/pokemon/PokemonCard.tsx` (kluczowy!)
- [ ] `src/components/pokemon/PaginationControls.tsx`
- [ ] `src/components/pokemon/PokemonFavoriteAction.tsx`
- [ ] `src/lib/pokemon/filters.ts`
- [ ] `src/lib/pokemon/transformers.ts`

**Priorytet 4 - Utility Functions** (Tydzień 2, Dni 4-5)
- [ ] `src/lib/favorites/transformers.ts`
- [ ] `src/lib/http/responses.ts`

**Deliverables Sprint 1**:
- Minimum 15 testów jednostkowych napisanych
- Pokrycie kodu: 40-50%
- Wszystkie komponenty auth pokryte testami
- Podstawowe komponenty Pokemon przetestowane

**Kamień milowy M1**: Krytyczne komponenty bezpieczeństwa pokryte testami ✅

---

### **Sprint 2: Hooki, Store'y i Logika Biznesowa** (1 tydzień)

**Priorytet 1 - Custom Hooki** (Dni 1-2)
- [ ] `src/hooks/usePokemonFilterOptions.ts` (brakujący)

**Priorytet 2 - Zustand Store'y** (Dni 3-4)
- [ ] `src/stores/usePokemonSearchStore.ts`
- [ ] `src/lib/stores/use-session-store.ts`

**Priorytet 3 - AI Chat Utilities** (Dni 5)
- [ ] `src/features/ai-chat/mappers.ts`
- [ ] `src/components/ai-chat/RateLimitAlert.tsx`

**Priorytet 4 - Providers** (Dni 5)
- [ ] `src/components/providers/SessionProvider.tsx`

**Deliverables Sprint 2**:
- +6-8 testów jednostkowych
- Pokrycie kodu: 60-70%
- Wszystkie hooki i store'y pokryte testami

**Kamień milowy M2**: Logika biznesowa i zarządzanie stanem pokryte testami ✅

---

### **Sprint 3: Pozostałe Komponenty Pokemon** (1 tydzień)

**Priorytet 1 - Lista i Filtrowanie** (Dni 1-3)
- [ ] `src/components/pokemon/PokemonListingView.tsx`
- [ ] `src/components/pokemon/MobileFilterDrawer.tsx`
- [ ] `src/components/pokemon/FilterChips.tsx`
- [ ] `src/components/pokemon/SortBar.tsx`

**Priorytet 2 - Szczegóły i Stany** (Dni 4-5)
- [ ] `src/components/pokemon/PokemonStatsPanel.tsx`
- [ ] `src/components/pokemon/PokemonEvolutionTimeline.tsx`
- [ ] `src/components/pokemon/EmptyStateWithAI.tsx`
- [ ] `src/components/pokemon/ErrorCallout.tsx`
- [ ] `src/components/pokemon/StatusBanner.tsx`
- [ ] `src/components/pokemon/ListSkeleton.tsx`

**Priorytet 3 - Nice-to-have** (Opcjonalnie)
- [ ] `src/components/pokemon/PokemonMovesGrid.tsx`

**Deliverables Sprint 3**:
- +10-11 testów jednostkowych
- Pokrycie kodu: 75-80%
- Wszystkie kluczowe komponenty Pokemon pokryte

**Kamień milowy M3**: Komponenty Pokemon w pełni przetestowane ✅

---

### **Sprint 4: Komponenty AI Chat i Finalizacja** (1 tydzień)

**Priorytet 1 - AI Chat Components** (Dni 1-4)
- [ ] `src/components/ai-chat/AIChatPanel.tsx`
- [ ] `src/components/ai-chat/SuggestionCards.tsx`
- [ ] `src/components/ai-chat/SuggestionCard.tsx`
- [ ] `src/components/ai-chat/SuggestionChips.tsx`
- [ ] `src/components/ai-chat/FavoritePromptCTA.tsx`
- [ ] `src/components/ai-chat/ChatSkeleton.tsx`

**Priorytet 2 - Favorites i Pozostałe** (Dni 5)
- [ ] `src/components/favorites/FavoritesView.tsx`
- [ ] `src/lib/favorites/client.ts`
- [ ] `src/lib/favorites/service.ts`

**Priorytet 3 - Pozostałe Utilities** (Opcjonalnie)
- [ ] `src/lib/pokemon/query.ts`
- [ ] `src/lib/ai/prompts.ts`

**Deliverables Sprint 4**:
- +9-12 testów jednostkowych
- Pokrycie kodu: 85%+ (cel optymalny)
- Wszystkie komponenty AI Chat pokryte
- Pełna suite testów jednostkowych

**Kamień milowy M4**: 85% pokrycia kodu testami jednostkowymi osiągnięte ✅

---

## 📝 Standardy i Best Practices

### **Struktura testów**

```typescript
// Przykład: src/components/pokemon/__tests__/PokemonCard.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PokemonCard } from '../PokemonCard';

describe('PokemonCard', () => {
  it('should render pokemon name and image', () => {
    const pokemon = {
      id: 25,
      name: 'Pikachu',
      sprite: 'https://example.com/pikachu.png',
      types: ['electric']
    };

    render(<PokemonCard pokemon={pokemon} />);

    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByAltText('Pikachu')).toHaveAttribute('src', pokemon.sprite);
  });

  it('should call onClick when card is clicked', async () => {
    const handleClick = vi.fn();
    const pokemon = { id: 25, name: 'Pikachu', sprite: '...', types: ['electric'] };

    const { user } = render(<PokemonCard pokemon={pokemon} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledWith(pokemon);
  });
});
```

### **Konwencje nazewnictwa**

- Pliki testów: `ComponentName.test.tsx` lub `functionName.test.ts`
- Lokalizacja: `__tests__` folder obok testowanych plików
- Describe blocks: nazwa komponentu/funkcji
- Test cases: `should [expected behavior] when [condition]`

### **Co testować**

✅ **TAK**:
- Rendering z różnymi props
- User interactions (clicks, inputs)
- Conditional rendering
- Error states i edge cases
- Accessibility (aria-labels, roles)
- Integration między komponentami (jeśli w ramach unit testów)

❌ **NIE**:
- Implementacja wewnętrzna (internal state)
- Zewnętrzne API calls (mockuj z MSW)
- Styling (sprawdź tylko obecność class names)
- Testy E2E (to osobna kategoria)

### **Mockowanie**

- **MSW**: Mockowanie API endpoints (PokeAPI, OpenRouter.ai)
- **vi.fn()**: Mockowanie callbacks i event handlers
- **vi.mock()**: Mockowanie modułów (Supabase, external libs)

---

## 🔧 Setup środowiska (przypomnienie)

### **Zainstalowane narzędzia**
- ✅ Vitest 3.2.4
- ✅ React Testing Library 16.3.0
- ✅ @testing-library/jest-dom 6.9.1
- ✅ @testing-library/user-event 14.6.1
- ✅ jsdom 22.1.0

### **Do zainstalowania**
- ⚠️ MSW (Mock Service Worker) - dla mockowania API

### **Konfiguracja**
- Plik: `vitest.config.ts` i `vitest.setup.ts`
- Environment: jsdom
- Coverage: v8 provider

---

## 📈 Metryki sukcesu

| Metryka | Cel Minimum | Cel Optymalny | Aktualny stan |
|---------|-------------|---------------|---------------|
| **Code Coverage** | 70% | 85% | 14% |
| **Liczba testów** | 35 | 51 | 7 |
| **Test pass rate** | 95% | 100% | 100% (7/7) |
| **Flaky test rate** | < 5% | 0% | 0% |

---

## 🚀 Następne kroki

1. **Zainstaluj MSW**: `npm install --save-dev msw`
2. **Skonfiguruj MSW handlers** dla PokeAPI i OpenRouter.ai
3. **Rozpocznij Sprint 1** od komponentów auth i walidatorów
4. **Code review** każdego napisanego testu
5. **Monitoruj pokrycie kodu** po każdym PR (Vitest coverage report)

---

**Pytania lub wątpliwości?**
- Sprawdź główny plan testów: `.ai/test-plan.md`
- Sprawdź istniejące testy jako przykłady:
  - `src/components/pokemon/__tests__/PokemonGrid.test.tsx`
  - `src/components/ai-chat/__tests__/ChatTranscript.test.tsx`
  - `src/hooks/__tests__/usePokemonListQuery.test.tsx`

---

**Data ostatniej aktualizacji**: 2025-10-15
