import type { AiIdentifyCommand, AiIdentifyResponseDto, AiIdentifySuggestionDto, PokemonSummaryDto } from "@/types";

export const AI_CHAT_PROMPT_LIMITS = {
  min: 10,
  max: 500,
} as const;

export const AI_CHAT_CONFIDENCE_THRESHOLDS = {
  high: 0.75,
  medium: 0.45,
} as const;

export type AiChatMessageRole = "user" | "assistant";

export type AiChatMessageStatus = "pending" | "delivered" | "error";

export interface AiChatMessage {
  id: string;
  role: AiChatMessageRole;
  content: string;
  createdAt: string;
  status: AiChatMessageStatus;
  caution?: "off-domain";
}

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  tone?: "neutral" | "info" | "alert";
}

export type AiChatSuggestionConfidenceTier = "low" | "medium" | "high";

export interface AiChatSuggestionViewModel {
  id: string;
  pokemonId: number;
  name: string;
  confidence: number;
  confidenceTier: AiChatSuggestionConfidenceTier;
  rationale: string | null;
  spriteUrl: string | null;
  summary?: string;
  highlights?: string[];
  detailHref: string;
  favorite: {
    status: "idle" | "saving" | "saved" | "error";
    errorMessage?: string;
  };
}

export type AiChatErrorKind = "rate-limit" | "validation" | "unauthorized" | "network" | "server" | "unknown";

export interface AiChatErrorState {
  kind: AiChatErrorKind;
  message: string;
  title?: string;
  retryAfterSeconds?: number;
  details?: string;
  requiresAuthentication?: boolean;
}

export type AiChatSessionStatus = "idle" | "initializing" | "ready" | "awaiting-response" | "error";

export interface AiChatSessionState {
  status: AiChatSessionStatus;
  isSubmitting: boolean;
  promptValue: string;
  messages: AiChatMessage[];
  suggestions: AiChatSuggestionViewModel[];
  suggestedPrompts: SuggestionChip[];
  activeError: AiChatErrorState | null;
  pendingCommand: AiIdentifyCommand | null;
  latestResponse: AiIdentifyResponseDto | null;
  rateLimitResetAt: number | null;
  modelId: string;
}

export const DEFAULT_SUGGESTION_CHIPS: SuggestionChip[] = [
  {
    id: "water-mystery",
    label: "Niebieski Pokémon z płetwami",
    prompt: "Który Pokémon wodny jest niebieski, ma płetwy i świeci się w nocy?",
    icon: "Droplet",
    tone: "info",
  },
  {
    id: "electric-mouse",
    label: "Mały żółty elektryk",
    prompt: "Zidentyfikuj żółtego Pokémona w kształcie myszki z elektrycznymi zdolnościami.",
    icon: "Zap",
    tone: "neutral",
  },
  {
    id: "legendary-bird",
    label: "Legendarny ptak lodu",
    prompt: "Szukam legendarnego ptaka z lodowymi skrzydłami z regionu Kanto.",
    icon: "Snowflake",
    tone: "info",
  },
  {
    id: "mystery-ghost",
    label: "Duch z świecącym płomieniem",
    prompt: "Który Pokémon jest duchem z fioletowym płomieniem i miesza ogień z psychiką?",
    icon: "Flame",
    tone: "alert",
  },
];

export const createEmptySessionState = (overrides: Partial<AiChatSessionState> = {}): AiChatSessionState => ({
  status: "initializing",
  isSubmitting: false,
  promptValue: "",
  messages: [],
  suggestions: [],
  suggestedPrompts: DEFAULT_SUGGESTION_CHIPS,
  activeError: null,
  pendingCommand: null,
  latestResponse: null,
  rateLimitResetAt: null,
  modelId: "",
  ...overrides,
});

export const resolveConfidenceTier = (confidence: number): AiChatSuggestionConfidenceTier => {
  if (confidence >= AI_CHAT_CONFIDENCE_THRESHOLDS.high) {
    return "high";
  }

  if (confidence >= AI_CHAT_CONFIDENCE_THRESHOLDS.medium) {
    return "medium";
  }

  return "low";
};

export type SuggestionSummaryLookup = Record<number, PokemonSummaryDto | undefined>;

export const createSuggestionId = (response: AiIdentifyResponseDto, suggestion: AiIdentifySuggestionDto): string =>
  `${response.queryId}-${suggestion.pokemonId}`;
