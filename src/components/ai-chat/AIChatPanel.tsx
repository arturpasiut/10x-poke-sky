import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import ChatSkeleton from "./ChatSkeleton";
import ChatTranscript from "./ChatTranscript";
import PromptInput, { type PromptInputHandle } from "./PromptInput";
import RateLimitAlert from "./RateLimitAlert";
import SuggestionCards from "./SuggestionCards";
import SuggestionChips from "./SuggestionChips";
import { Button } from "@/components/ui/button";
import {
  AI_CHAT_PROMPT_LIMITS,
  DEFAULT_SUGGESTION_CHIPS,
  useAiChatSession,
  type AiChatErrorState,
  type AiChatSuggestionViewModel,
} from "@/features/ai-chat";
import { addFavorite, AuthenticationRequiredError } from "@/lib/favorites/client";
import { AI_MODEL_OPTIONS, DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";
import { fetchPokemonSummaryLookup } from "@/lib/pokemon/client";

export interface AIChatPanelProps {
  initialSuggestions?: AiChatSuggestionViewModel[];
  isAuthenticated: boolean;
  preferredGeneration?: string;
}

interface FavoriteLocalState {
  status: AiChatSuggestionViewModel["favorite"]["status"];
  error?: string;
}

const AIChatPanel = ({ initialSuggestions, isAuthenticated, preferredGeneration }: AIChatPanelProps) => {
  const promptRef = useRef<PromptInputHandle | null>(null);
  const [rateLimitRemainingMs, setRateLimitRemainingMs] = useState(0);
  const [favoritesTracker, setFavoritesTracker] = useState<Record<string, FavoriteLocalState>>({});

  const {
    state,
    actions: {
      setPromptValue,
      setModelId,
      submitPrompt,
      selectSuggestion,
      dismissError,
      resetSession,
      retryLastPrompt,
    },
  } = useAiChatSession({
    initialSuggestions,
    initialSuggestedPrompts: DEFAULT_SUGGESTION_CHIPS,
    preferredGeneration,
    loadSuggestionSummaries: fetchPokemonSummaryLookup,
    availableModels: AI_MODEL_OPTIONS,
    defaultModelId: DEFAULT_AI_MODEL_ID,
  });

  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!state.rateLimitResetAt) {
      setRateLimitRemainingMs(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, state.rateLimitResetAt - Date.now());
      setRateLimitRemainingMs(remaining);
    };

    tick();
    const id = window.setInterval(tick, 500);

    return () => window.clearInterval(id);
  }, [state.rateLimitResetAt]);

  useEffect(() => {
    setFavoritesTracker({});
  }, [state.latestResponse?.queryId]);

  const isAwaitingResponse = state.status === "awaiting-response";
  const isInitializing = state.status === "initializing";
  const isRateLimited = rateLimitRemainingMs > 0;
  const rateLimitSeconds = Math.ceil(rateLimitRemainingMs / 1000);

  const validationError =
    state.activeError && state.activeError.kind === "validation" ? state.activeError.message : undefined;

  const panelError: AiChatErrorState | null =
    state.activeError && state.activeError.kind !== "validation" ? state.activeError : null;

  const selectedModel = useMemo(
    () => AI_MODEL_OPTIONS.find((option) => option.id === state.modelId) ?? AI_MODEL_OPTIONS[0],
    [state.modelId]
  );

  const suggestionItems = useMemo(() => {
    if (state.suggestions.length === 0) {
      return state.suggestions;
    }

    return state.suggestions.map((item) => {
      const override = favoritesTracker[item.id];

      if (!override) {
        return item;
      }

      return {
        ...item,
        favorite: {
          ...item.favorite,
          status: override.status as AiChatSuggestionViewModel["favorite"]["status"],
          errorMessage: override.error,
        },
      };
    });
  }, [favoritesTracker, state.suggestions]);

  const handlePromptChange = (value: string) => {
    setPromptValue(value);
  };

  const handlePromptSubmit = async () => {
    await submitPrompt();
  };

  const handleModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setModelId(event.target.value);
  };

  const handleChipSelect = (prompt: string) => {
    selectSuggestion(prompt);
    promptRef.current?.focus();
  };

  const handleClearSession = () => {
    resetSession();
    promptRef.current?.focus();
  };

  const handleLoginRedirect = () => {
    if (typeof window === "undefined") {
      return;
    }

    const redirect = encodeURIComponent("/ai");
    window.location.href = `/auth/login?redirectTo=${redirect}`;
  };

  const handleFavoriteToggle = async (item: AiChatSuggestionViewModel) => {
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }

    const currentState = favoritesTracker[item.id] ?? item.favorite;
    if (currentState.status === "saving" || currentState.status === "saved") {
      return;
    }

    setFavoritesTracker((prev) => ({
      ...prev,
      [item.id]: {
        status: "saving",
      },
    }));

    try {
      await addFavorite(item.pokemonId);
      setFavoritesTracker((prev) => ({
        ...prev,
        [item.id]: {
          status: "saved",
        },
      }));
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) {
        setFavoritesTracker((prev) => ({
          ...prev,
          [item.id]: {
            status: "error",
            error: "Zaloguj się, aby zapisać w ulubionych.",
          },
        }));
        handleLoginRedirect();
        return;
      }

      const message = error instanceof Error ? error.message : "Nie udało się zapisać w ulubionych.";

      setFavoritesTracker((prev) => ({
        ...prev,
        [item.id]: {
          status: "error",
          error: message,
        },
      }));
    }
  };

  return (
    <section className="grid gap-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Sesja bez zapisu historii</p>
          <h2 className="text-2xl font-semibold">Asystent Pokédex</h2>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleClearSession} className="gap-2">
          Wyczyść czat
        </Button>
      </div>

      {panelError ? (
        <RateLimitAlert
          error={panelError}
          onDismiss={dismissError}
          onLoginRedirect={panelError.requiresAuthentication ? handleLoginRedirect : undefined}
        />
      ) : null}

      <div className="rounded-2xl border border-border/40 bg-[color:color-mix(in_srgb,var(--color-surface)_85%,transparent)] px-4 py-3 text-xs text-muted-foreground shadow-sm">
        <strong className="font-semibold text-foreground">Uwaga:</strong> Asystent analizuje każdą wiadomość
        niezależnie. Przy kolejnych próbach powtórz pełny opis Pokémona zamiast odwoływać się do poprzednich odpowiedzi.
      </div>

      <div className="space-y-6 rounded-3xl border border-border/30 bg-[color:color-mix(in_srgb,var(--color-surface)_70%,transparent)] p-6 shadow-sm">
        <div className="space-y-2">
          <label
            htmlFor="ai-model-select"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            Model AI
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              id="ai-model-select"
              className="w-full rounded-2xl border border-border/40 bg-[color:color-mix(in_srgb,var(--color-surface)_85%,transparent)] px-3 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:max-w-xs"
              value={state.modelId}
              onChange={handleModelChange}
              disabled={isAwaitingResponse}
            >
              {AI_MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedModel ? (
              <p className="text-xs text-muted-foreground sm:max-w-sm">
                {selectedModel.provider} • {selectedModel.description}
              </p>
            ) : null}
          </div>
        </div>

        <SuggestionChips
          items={state.suggestedPrompts}
          disabled={isAwaitingResponse || isRateLimited}
          onSelect={handleChipSelect}
        />

        <div className="space-y-6">
          {isInitializing ? (
            <ChatSkeleton variant="initial" />
          ) : (
            <>
              <ChatTranscript messages={state.messages} isLoading={isAwaitingResponse} onRetry={retryLastPrompt} />
              {isAwaitingResponse ? <ChatSkeleton variant="response" /> : null}
            </>
          )}

          <SuggestionCards
            items={suggestionItems}
            isAuthenticated={isAuthenticated}
            isLoading={isAwaitingResponse}
            onFavoriteToggle={handleFavoriteToggle}
            onLoginRedirect={!isAuthenticated ? handleLoginRedirect : undefined}
          />
        </div>
      </div>

      <PromptInput
        ref={promptRef}
        value={state.promptValue}
        isSubmitting={state.isSubmitting}
        isRateLimited={isRateLimited}
        rateLimitSeconds={rateLimitSeconds}
        minLength={AI_CHAT_PROMPT_LIMITS.min}
        maxLength={AI_CHAT_PROMPT_LIMITS.max}
        onChange={handlePromptChange}
        onSubmit={handlePromptSubmit}
        onCancel={dismissError}
        validationMessage={validationError}
        disabled={isAwaitingResponse}
      />
    </section>
  );
};

export default AIChatPanel;
