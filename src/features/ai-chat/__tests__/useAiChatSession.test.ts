import { describe, expect, it } from "vitest";

import {
  aiChatSessionReducer,
  buildIdentifyCommand,
  createAssistantMessage,
  createUserMessage,
  resolveAssistantText,
  resolveErrorState,
} from "../useAiChatSession";
import {
  createEmptySessionState,
  resolveConfidenceTier,
  type AiChatSuggestionViewModel,
  type SuggestionSummaryLookup,
} from "../types";
import { mapResponseToSuggestions } from "../mappers";

const baseResponse = {
  queryId: "test-query",
  success: true,
  latencyMs: 1500,
  suggestions: [
    {
      pokemonId: 25,
      name: "Pikachu",
      confidence: 0.84,
      rationale: "Żółty elektryczny Pokémon.",
    },
  ],
  rawResponse: {
    message: "Pikachu to najbardziej znany elektryczny Pokémon.",
  },
  createdAt: new Date().toISOString(),
} as const;

describe("useAiChatSession internals", () => {
  it("buildIdentifyCommand attaches generation hint when provided", () => {
    const command = buildIdentifyCommand("Opis Pokémona", "generation-ii");

    expect(command.prompt).toBe("Opis Pokémona");
    expect(command.context).toEqual({ preferredGeneration: "generation-ii" });
  });

  it("resolveErrorState maps HTTP status codes to domain errors", () => {
    const rateLimitError = resolveErrorState(429, { message: "Too many requests" }, 2000);
    expect(rateLimitError.kind).toBe("rate-limit");
    expect(rateLimitError.retryAfterSeconds).toBe(2);

    const unauthorized = resolveErrorState(401, {}, null);
    expect(unauthorized.kind).toBe("unauthorized");

    const serverError = resolveErrorState(500, { message: "Boom" }, null);
    expect(serverError.kind).toBe("server");
  });

  it("creates assistant messages with fallback text when raw response missing", () => {
    const suggestions: AiChatSuggestionViewModel[] = baseResponse.suggestions.map((suggestion) => ({
      id: `${baseResponse.queryId}-${suggestion.pokemonId}`,
      pokemonId: suggestion.pokemonId,
      name: suggestion.name,
      confidence: suggestion.confidence,
      confidenceTier: resolveConfidenceTier(suggestion.confidence),
      rationale: suggestion.rationale ?? null,
      spriteUrl: null,
      detailHref: "/pokemon/pikachu",
      favorite: { status: "idle" },
    }));

    const assistantMessage = createAssistantMessage(
      {
        ...baseResponse,
        rawResponse: null,
      },
      suggestions
    );

    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.content).toContain("Pikachu");
  });

  it("reduces submit flow actions to update state correctly", () => {
    const initialState = createEmptySessionState({ status: "ready" });
    const userMessage = createUserMessage("Kto to jest żółty elektryk?");
    const command = buildIdentifyCommand(userMessage.content);

    const submittingState = aiChatSessionReducer(initialState, {
      type: "SUBMIT_START",
      payload: { command, userMessage },
    });

    expect(submittingState.isSubmitting).toBe(true);
    expect(submittingState.messages).toHaveLength(1);
    expect(submittingState.pendingCommand).toEqual(command);

    const suggestions = mapResponseToSuggestions(baseResponse, {});
    const assistantMessage = createAssistantMessage(baseResponse, suggestions);

    const successState = aiChatSessionReducer(submittingState, {
      type: "SUBMIT_SUCCESS",
      payload: {
        response: baseResponse,
        assistantMessage,
        suggestions,
        userMessageId: userMessage.id,
      },
    });

    expect(successState.isSubmitting).toBe(false);
    expect(successState.messages).toHaveLength(2);
    expect(successState.suggestions).toHaveLength(1);
    expect(successState.latestResponse?.queryId).toBe(baseResponse.queryId);
  });

  it("handles submit errors and stores rate limit reset timestamp", () => {
    const initialState = createEmptySessionState({ status: "ready" });
    const userMessage = createUserMessage("Limit test");
    const command = buildIdentifyCommand(userMessage.content);

    const submittingState = aiChatSessionReducer(initialState, {
      type: "SUBMIT_START",
      payload: { command, userMessage },
    });

    const errorState = aiChatSessionReducer(submittingState, {
      type: "SUBMIT_ERROR",
      payload: {
        error: resolveErrorState(429, { message: "Limit" }, 2000),
        userMessageId: userMessage.id,
        rateLimitResetAt: Date.now() + 2000,
      },
    });

    expect(errorState.isSubmitting).toBe(false);
    expect(errorState.activeError?.kind).toBe("rate-limit");
    expect(errorState.rateLimitResetAt).not.toBeNull();
  });

  it("resolves assistant text from structured raw response", () => {
    const assistantText = resolveAssistantText(baseResponse, []);
    expect(assistantText).toContain("Pikachu");
  });

  it("filters out suggestions that lack a matching Pokémon summary", () => {
    const extendedResponse = {
      ...baseResponse,
      suggestions: [
        baseResponse.suggestions[0],
        {
          pokemonId: 9999,
          name: "Halucynacja",
          confidence: 0.3,
          rationale: null,
        },
      ],
    };

    const lookup: SuggestionSummaryLookup = {
      25: {
        pokemonId: 25,
        name: "Pikachu",
        types: ["electric"],
        generation: "generation-i",
        region: "kanto",
        spriteUrl: "https://example.com/pikachu.png",
        highlights: [],
      },
    };

    const suggestions = mapResponseToSuggestions(extendedResponse, lookup);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.pokemonId).toBe(25);
  });

  it("prefers canonical summary data over model text when available", () => {
    const mismatchedResponse = {
      ...baseResponse,
      suggestions: [
        {
          pokemonId: 550,
          name: "Electric Carp",
          confidence: 0.62,
          rationale: "Model pomylił nazwę.",
        },
      ],
    };

    const lookup: SuggestionSummaryLookup = {
      550: {
        pokemonId: 550,
        name: "basculin",
        types: ["water"],
        generation: "generation-v",
        region: "unova",
        spriteUrl: null,
        highlights: [],
      },
    };

    const [suggestion] = mapResponseToSuggestions(mismatchedResponse, lookup);
    expect(suggestion?.name).toBe("Basculin");
    expect(suggestion?.detailHref).toBe("/pokemon/basculin");
  });

  it("builds detail href slug from suggestion name when summary is missing", () => {
    const response = {
      ...baseResponse,
      suggestions: [
        {
          pokemonId: 100,
          name: "Mr. Mime",
          confidence: 0.55,
          rationale: "Classic mimik.",
        },
      ],
    };

    const [suggestion] = mapResponseToSuggestions(response, {});
    expect(suggestion?.detailHref).toBe("/pokemon/mr-mime");
  });
});
