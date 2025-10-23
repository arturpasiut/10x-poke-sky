import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  AI_CHAT_PROMPT_LIMITS,
  createEmptySessionState,
  mapResponseToSuggestions,
  type AiChatErrorState,
  type AiChatMessage,
  type AiChatMessageStatus,
  type AiChatSessionState,
  type AiChatSuggestionViewModel,
  type SuggestionChip,
  type SuggestionSummaryLookup,
} from "./index";
import type { AiIdentifyCommand, AiIdentifyResponseDto } from "@/types";
import type { AiModelOption } from "@/lib/ai/models";

interface UseAiChatSessionOptions {
  /**
   * Initial suggestions passed from the page load (e.g. server-provided hints).
   */
  initialSuggestions?: AiChatSuggestionViewModel[];
  /**
   * Initial suggestion chips (defaults to `DEFAULT_SUGGESTION_CHIPS` inside `createEmptySessionState`).
   */
  initialSuggestedPrompts?: SuggestionChip[];
  /**
   * Allows injecting custom fetch logic (e.g. for tests).
   */
  fetcher?: typeof fetch;
  /**
   * API endpoint handling AI identify requests (defaults to `/api/ai/identify`).
   */
  identifyEndpoint?: string;
  /**
   * Optional callback providing extra summary data for Pokémon cards.
   */
  loadSuggestionSummaries?: (pokemonIds: number[]) => Promise<SuggestionSummaryLookup>;
  /**
   * Preferred generation forwarded to the AI context envelope.
   */
  preferredGeneration?: string;
  /**
   * List of selectable AI models presented in the UI.
   */
  availableModels?: AiModelOption[];
  /**
   * Default model selected on load (falls back to the first supported option).
   */
  defaultModelId?: string;
}

type SubmitResult =
  | {
      ok: true;
      response: AiIdentifyResponseDto;
      suggestions: AiChatSuggestionViewModel[];
      assistantMessage: AiChatMessage;
    }
  | {
      ok: false;
      error: AiChatErrorState;
      rateLimitResetAt?: number | null;
    };

type AiChatSessionAction =
  | { type: "INIT"; payload: { suggestions: AiChatSuggestionViewModel[]; suggestedPrompts?: SuggestionChip[] } }
  | { type: "SET_PROMPT"; payload: { value: string } }
  | { type: "SET_MODEL"; payload: { modelId: string } }
  | {
      type: "SUBMIT_START";
      payload: {
        command: AiIdentifyCommand;
        userMessage: AiChatMessage;
      };
    }
  | {
      type: "SUBMIT_SUCCESS";
      payload: {
        response: AiIdentifyResponseDto;
        assistantMessage: AiChatMessage;
        suggestions: AiChatSuggestionViewModel[];
        userMessageId: string;
      };
    }
  | {
      type: "SUBMIT_ERROR";
      payload: {
        error: AiChatErrorState;
        userMessageId: string;
        rateLimitResetAt?: number | null;
      };
    }
  | { type: "DISMISS_ERROR" }
  | { type: "APPLY_SUGGESTION"; payload: { prompt: string } }
  | { type: "RESET"; payload: { suggestions: AiChatSuggestionViewModel[]; suggestedPrompts?: SuggestionChip[] } }
  | { type: "CANCEL_PENDING" };

interface UseAiChatSessionReturn {
  state: AiChatSessionState;
  actions: {
    setPromptValue: (value: string) => void;
    setModelId: (modelId: string) => void;
    submitPrompt: (promptOverride?: string) => Promise<void>;
    selectSuggestion: (prompt: string) => void;
    dismissError: () => void;
    resetSession: () => void;
    cancelPending: () => void;
    retryLastPrompt: () => Promise<void>;
  };
}

const IDENTIFY_ENDPOINT = "/api/ai/identify";

const defaultFetcher: typeof fetch | undefined = typeof fetch === "function" ? fetch.bind(globalThis) : undefined;

const createMessageId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `msg_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
};

export const createUserMessage = (content: string): AiChatMessage => ({
  id: createMessageId(),
  role: "user",
  content,
  createdAt: new Date().toISOString(),
  status: "pending",
});

export const createAssistantMessage = (
  response: AiIdentifyResponseDto,
  suggestions: AiChatSuggestionViewModel[]
): AiChatMessage => {
  const resolvedText = resolveAssistantText(response, suggestions);

  return {
    id: createMessageId(),
    role: "assistant",
    content: resolvedText,
    createdAt: new Date().toISOString(),
    status: "delivered",
  };
};

export const resolveAssistantText = (
  response: AiIdentifyResponseDto,
  suggestions: AiChatSuggestionViewModel[]
): string => {
  const raw = response.rawResponse;

  const extracted = extractTextFromRawResponse(raw);

  if (extracted) {
    return extracted;
  }

  if (!suggestions.length) {
    return "Nie znalazłem żadnych dopasowań. Spróbuj opisać Pokémona dokładniej albo podaj dodatkowe szczegóły.";
  }

  const lines = suggestions.map((suggestion, index) => {
    const position = index + 1;
    const confidencePercent = Math.round(suggestion.confidence * 100);

    return `${position}. ${suggestion.name} – pewność ${confidencePercent}%`;
  });

  return ["Oto propozycje Pokémonów, które najlepiej pasują do opisu:", ...lines].join("\n");
};

const extractTextFromRawResponse = (raw: unknown): string | undefined => {
  if (!raw) {
    return undefined;
  }

  if (typeof raw === "string") {
    return raw;
  }

  if (typeof raw !== "object") {
    return undefined;
  }

  if (raw && "message" in raw && typeof (raw as Record<string, unknown>).message === "string") {
    return (raw as Record<string, unknown>).message;
  }

  if (raw && "content" in raw) {
    const content = (raw as Record<string, unknown>).content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      const flattened = content
        .flatMap((item) => {
          if (!item) {
            return [];
          }

          if (typeof item === "string") {
            return [item];
          }

          if (typeof item === "object" && "text" in item && typeof item.text === "string") {
            return [item.text];
          }

          return [];
        })
        .filter(Boolean);

      if (flattened.length > 0) {
        return flattened.join("\n");
      }
    }
  }

  if (raw && "choices" in raw && Array.isArray((raw as Record<string, unknown>).choices)) {
    const { choices } = raw as Record<string, unknown>;
    const text = choices
      .flatMap((choice) => {
        if (!choice || typeof choice !== "object") {
          return [];
        }

        if ("message" in choice && choice.message && typeof choice.message === "object") {
          const message = choice.message as Record<string, unknown>;

          if (typeof message.content === "string") {
            return [message.content];
          }

          if (Array.isArray(message.content)) {
            return message.content
              .filter(
                (entry) => entry && typeof entry === "object" && "text" in entry && typeof entry.text === "string"
              )
              .map((entry) => (entry as { text: string }).text);
          }
        }

        if ("text" in choice && typeof choice.text === "string") {
          return [choice.text];
        }

        return [];
      })
      .filter(Boolean);

    if (text.length > 0) {
      return text.join("\n");
    }
  }

  return undefined;
};

export const aiChatSessionReducer = (state: AiChatSessionState, action: AiChatSessionAction): AiChatSessionState => {
  switch (action.type) {
    case "INIT": {
      return {
        ...state,
        status: "ready",
        suggestions: [...action.payload.suggestions],
        suggestedPrompts: action.payload.suggestedPrompts ?? state.suggestedPrompts,
        activeError: null,
      };
    }

    case "SET_PROMPT": {
      return {
        ...state,
        promptValue: action.payload.value,
      };
    }
    case "SET_MODEL": {
      if (state.modelId === action.payload.modelId) {
        return state;
      }

      return {
        ...state,
        modelId: action.payload.modelId,
      };
    }

    case "SUBMIT_START": {
      return {
        ...state,
        status: "awaiting-response",
        isSubmitting: true,
        promptValue: "",
        activeError: null,
        pendingCommand: action.payload.command,
        messages: [...state.messages, action.payload.userMessage],
      };
    }

    case "SUBMIT_SUCCESS": {
      return {
        ...state,
        status: "ready",
        isSubmitting: false,
        pendingCommand: null,
        latestResponse: action.payload.response,
        rateLimitResetAt: null,
        suggestions: action.payload.suggestions,
        messages: state.messages
          .map((message) =>
            message.id === action.payload.userMessageId
              ? {
                  ...message,
                  status: "delivered" as AiChatMessageStatus,
                }
              : message
          )
          .concat(action.payload.assistantMessage),
      };
    }

    case "SUBMIT_ERROR": {
      const retryAt = action.payload.rateLimitResetAt ?? state.rateLimitResetAt;
      const previousCommand = state.pendingCommand;

      return {
        ...state,
        status: "error",
        isSubmitting: false,
        pendingCommand: null,
        activeError: action.payload.error,
        rateLimitResetAt: retryAt ?? null,
        promptValue: previousCommand?.prompt ?? state.promptValue,
        messages: state.messages.map((message) =>
          message.id === action.payload.userMessageId
            ? {
                ...message,
                status: "error",
              }
            : message
        ),
      };
    }

    case "DISMISS_ERROR": {
      return {
        ...state,
        activeError: null,
      };
    }

    case "APPLY_SUGGESTION": {
      return {
        ...state,
        promptValue: action.payload.prompt,
        activeError: null,
      };
    }

    case "RESET": {
      return createEmptySessionState({
        status: "ready",
        suggestions: [...action.payload.suggestions],
        suggestedPrompts: action.payload.suggestedPrompts ?? state.suggestedPrompts,
        modelId: state.modelId,
      });
    }

    case "CANCEL_PENDING": {
      return {
        ...state,
        status: state.isSubmitting ? "ready" : state.status,
        isSubmitting: false,
        pendingCommand: null,
      };
    }

    default: {
      return state;
    }
  }
};

const toErrorMessage = (candidate: unknown, fallback: string): string => {
  if (!candidate) {
    return fallback;
  }

  if (typeof candidate === "string") {
    return candidate;
  }

  if (typeof candidate === "object") {
    if ("message" in candidate && typeof (candidate as Record<string, unknown>).message === "string") {
      return (candidate as Record<string, unknown>).message;
    }

    if ("error" in candidate && candidate.error && typeof candidate.error === "object") {
      const errorObject = candidate.error as Record<string, unknown>;

      if (typeof errorObject.message === "string") {
        return errorObject.message;
      }
    }

    if ("detail" in candidate && typeof (candidate as Record<string, unknown>).detail === "string") {
      return (candidate as Record<string, unknown>).detail;
    }
  }

  return fallback;
};

const resolveRetryAfter = (headerValue: string | null): number | null => {
  if (!headerValue) {
    return null;
  }

  const seconds = Number.parseFloat(headerValue);

  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.round(seconds * 1000);
  }

  const retryDate = Date.parse(headerValue);

  if (Number.isNaN(retryDate)) {
    return null;
  }

  const delta = retryDate - Date.now();

  return delta > 0 ? delta : null;
};

export const resolveErrorState = (status: number, payload: unknown, retryAfter: number | null): AiChatErrorState => {
  if (status === 400 || status === 422) {
    return {
      kind: "validation",
      message: toErrorMessage(payload, "Opis musi zawierać 10–500 znaków i dotyczyć Pokémonów."),
    };
  }

  if (status === 401) {
    return {
      kind: "unauthorized",
      message: toErrorMessage(payload, "Zaloguj się, aby kontynuować rozmowę z asystentem."),
      requiresAuthentication: true,
    };
  }

  if (status === 429) {
    const retrySeconds = retryAfter !== null ? Math.round(retryAfter / 1000) : undefined;

    return {
      kind: "rate-limit",
      message: toErrorMessage(payload, "Osiągnąłeś limit zapytań. Spróbuj ponownie za chwilę."),
      retryAfterSeconds: retrySeconds,
    };
  }

  if (status >= 500) {
    return {
      kind: "server",
      message: toErrorMessage(payload, "Serwer ma kłopoty. Spróbuj ponownie później."),
    };
  }

  return {
    kind: "unknown",
    message: toErrorMessage(payload, "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."),
  };
};

const tryParseJson = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return await response.json();
  } catch (error) {
    console.warn("[ai] Failed to parse JSON from response", error);
    return undefined;
  }
};

const isAbortError = (error: unknown): boolean => {
  return !!(
    error &&
    typeof error === "object" &&
    ("name" in error ? (error as { name?: string }).name === "AbortError" : false)
  );
};

interface BuildIdentifyCommandOptions {
  preferredGeneration?: string;
  modelId?: string;
}

export const buildIdentifyCommand = (
  prompt: string,
  { preferredGeneration, modelId }: BuildIdentifyCommandOptions = {}
): AiIdentifyCommand => {
  const trimmedPrompt = prompt.trim();
  const context: Record<string, string> = {};

  if (preferredGeneration && preferredGeneration.trim().length > 0) {
    context.preferredGeneration = preferredGeneration.trim();
  }

  if (modelId && modelId.trim().length > 0) {
    context.modelId = modelId.trim();
  }

  return {
    prompt: trimmedPrompt,
    ...(Object.keys(context).length > 0
      ? {
          context,
        }
      : {}),
  };
};

export const useAiChatSession = (options: UseAiChatSessionOptions = {}): UseAiChatSessionReturn => {
  const {
    fetcher = defaultFetcher,
    identifyEndpoint = IDENTIFY_ENDPOINT,
    initialSuggestions = [],
    initialSuggestedPrompts,
    loadSuggestionSummaries,
    preferredGeneration,
    availableModels = [],
    defaultModelId,
  } = options;

  const allowedModelIds = useMemo(() => availableModels.map((model) => model.id), [availableModels]);

  const fallbackModelId = useMemo(() => {
    if (allowedModelIds.length === 0) {
      return "";
    }

    if (defaultModelId && allowedModelIds.includes(defaultModelId)) {
      return defaultModelId;
    }

    return allowedModelIds[0];
  }, [allowedModelIds, defaultModelId]);

  const [state, dispatch] = useReducer(
    aiChatSessionReducer,
    createEmptySessionState({
      suggestions: [...initialSuggestions],
      suggestedPrompts: initialSuggestedPrompts,
      modelId: fallbackModelId,
    })
  );

  const stateRef = useRef(state);
  const controllerRef = useRef<AbortController | null>(null);
  const lastCommandRef = useRef<AiIdentifyCommand | null>(null);
  const latestRequestIdRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (allowedModelIds.length === 0) {
      return;
    }

    if (!allowedModelIds.includes(state.modelId) && fallbackModelId && state.modelId !== fallbackModelId) {
      dispatch({
        type: "SET_MODEL",
        payload: { modelId: fallbackModelId },
      });
    }
  }, [allowedModelIds, fallbackModelId, state.modelId]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    dispatch({
      type: "INIT",
      payload: {
        suggestions: [...initialSuggestions],
        suggestedPrompts: initialSuggestedPrompts,
      },
    });
  }, [initialSuggestedPrompts, initialSuggestions]);

  const setModelId = useCallback(
    (modelId: string) => {
      const sanitized = allowedModelIds.includes(modelId) ? modelId : fallbackModelId;
      if (!sanitized) {
        return;
      }

      if (stateRef.current.modelId === sanitized) {
        return;
      }

      dispatch({
        type: "SET_MODEL",
        payload: { modelId: sanitized },
      });
    },
    [allowedModelIds, fallbackModelId]
  );

  const cancelPending = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch({ type: "CANCEL_PENDING" });
  }, []);

  const applySubmitResult = useCallback((result: SubmitResult, userMessageId: string) => {
    if (!mountedRef.current) {
      return;
    }

    if (result.ok) {
      dispatch({
        type: "SUBMIT_SUCCESS",
        payload: {
          response: result.response,
          assistantMessage: result.assistantMessage,
          suggestions: result.suggestions,
          userMessageId,
        },
      });
      return;
    }

    dispatch({
      type: "SUBMIT_ERROR",
      payload: {
        error: result.error,
        userMessageId,
        rateLimitResetAt: result.rateLimitResetAt,
      },
    });
  }, []);

  const performRequest = useCallback(
    async (command: AiIdentifyCommand): Promise<SubmitResult> => {
      if (!fetcher) {
        return {
          ok: false,
          error: {
            kind: "network",
            message: "Środowisko nie obsługuje fetch(). Spróbuj w nowoczesnej przeglądarce.",
          },
        };
      }

      const controller = new AbortController();

      controllerRef.current?.abort();
      controllerRef.current = controller;

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      try {
        const response = await fetcher(identifyEndpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!mountedRef.current || requestId !== latestRequestIdRef.current) {
          return {
            ok: false,
            error: {
              kind: "unknown",
              message: "Żądanie zostało zastąpione przez nowsze zapytanie.",
            },
          };
        }

        if (controller.signal.aborted) {
          return {
            ok: false,
            error: {
              kind: "network",
              message: "Żądanie zostało anulowane.",
            },
          };
        }

        if (response.status === 202) {
          const payload = await tryParseJson(response);
          const message = toErrorMessage(payload, "Analiza wciąż trwa. Spróbuj ponownie za kilka sekund.");

          return {
            ok: false,
            error: {
              kind: "server",
              message,
            },
          };
        }

        if (!response.ok) {
          const payload = await tryParseJson(response);
          const retryAfterMs = resolveRetryAfter(response.headers.get("Retry-After"));

          return {
            ok: false,
            error: resolveErrorState(response.status, payload, retryAfterMs),
            rateLimitResetAt: retryAfterMs !== null ? Date.now() + retryAfterMs : null,
          };
        }

        const payload = (await response.json()) as AiIdentifyResponseDto;

        let summaries: SuggestionSummaryLookup = {};

        if (loadSuggestionSummaries && payload.suggestions.length > 0) {
          try {
            const ids = payload.suggestions.map((item) => item.pokemonId);
            summaries = await loadSuggestionSummaries(ids);
          } catch (error) {
            console.warn("[ai] Failed to enrich suggestions with Pokémon summaries", error);
          }
        }

        const suggestions = mapResponseToSuggestions(payload, summaries);
        const assistantMessage = createAssistantMessage(payload, suggestions);

        return {
          ok: true,
          response: payload,
          suggestions,
          assistantMessage,
        };
      } catch (error: unknown) {
        if (isAbortError(error)) {
          return {
            ok: false,
            error: {
              kind: "network",
              message: "Żądanie zostało anulowane.",
            },
          };
        }

        console.error("[ai] Network error while calling identify endpoint", error);

        return {
          ok: false,
          error: {
            kind: "network",
            message: "Nie udało się połączyć z serwerem. Sprawdź sieć i spróbuj ponownie.",
          },
        };
      }
    },
    [fetcher, identifyEndpoint, loadSuggestionSummaries]
  );

  const submitPrompt = useCallback(
    async (promptOverride?: string) => {
      const currentState = stateRef.current;

      if (currentState.isSubmitting) {
        return;
      }

      const promptSource = (typeof promptOverride === "string" ? promptOverride : currentState.promptValue).trim();

      if (promptSource.length < AI_CHAT_PROMPT_LIMITS.min || promptSource.length > AI_CHAT_PROMPT_LIMITS.max) {
        const validationError: AiChatErrorState = {
          kind: "validation",
          message: "Opis musi zawierać 10–500 znaków i dotyczyć Pokémonów.",
        };

        dispatch({
          type: "SUBMIT_ERROR",
          payload: {
            error: validationError,
            userMessageId: "",
            rateLimitResetAt: currentState.rateLimitResetAt,
          },
        });
        return;
      }

      const command = buildIdentifyCommand(promptSource, {
        preferredGeneration,
        modelId: currentState.modelId,
      });
      const userMessage = createUserMessage(promptSource);

      lastCommandRef.current = command;
      dispatch({
        type: "SUBMIT_START",
        payload: {
          command,
          userMessage,
        },
      });

      const result = await performRequest(command);
      applySubmitResult(result, userMessage.id);
    },
    [applySubmitResult, performRequest, preferredGeneration]
  );

  const retryLastPrompt = useCallback(async () => {
    const lastCommand = lastCommandRef.current;

    if (!lastCommand) {
      return;
    }

    await submitPrompt(lastCommand.prompt);
  }, [submitPrompt]);

  const setPromptValue = useCallback((value: string) => {
    dispatch({
      type: "SET_PROMPT",
      payload: { value },
    });
  }, []);

  const selectSuggestion = useCallback((prompt: string) => {
    dispatch({
      type: "APPLY_SUGGESTION",
      payload: {
        prompt,
      },
    });
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: "DISMISS_ERROR" });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({
      type: "RESET",
      payload: {
        suggestions: [...initialSuggestions],
        suggestedPrompts: initialSuggestedPrompts,
      },
    });
    lastCommandRef.current = null;
  }, [initialSuggestions, initialSuggestedPrompts]);

  const value = useMemo<UseAiChatSessionReturn>(() => {
    return {
      state,
      actions: {
        setPromptValue,
        setModelId,
        submitPrompt,
        selectSuggestion,
        dismissError,
        resetSession,
        cancelPending,
        retryLastPrompt,
      },
    };
  }, [
    cancelPending,
    dismissError,
    resetSession,
    retryLastPrompt,
    selectSuggestion,
    setModelId,
    setPromptValue,
    state,
    submitPrompt,
  ]);

  return value;
};
