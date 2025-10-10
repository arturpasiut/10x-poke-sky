import { z } from "zod";

import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { runtimeConfig } from "@/lib/env";
import type { AiIdentifyCommand } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Use an open-source model available on the OpenRouter free tier for initial integration.
const DEFAULT_MODEL = "deepseek/deepseek-r1-0528-qwen3-8b:free";

const IdentifyPayloadSchema = z
  .object({
    success: z.boolean().optional(),
    suggestions: z
      .array(
        z.object({
          pokemon_id: z.number().int().positive(),
          name: z.string().min(2),
          confidence: z.number().min(0).max(1).optional(),
          rationale: z.string().nullable().optional(),
        })
      )
      .default([]),
    warnings: z.array(z.string()).optional(),
  })
  .transform((payload) => ({
    success: payload.success ?? payload.suggestions.length > 0,
    suggestions: payload.suggestions.map((suggestion) => ({
      pokemonId: suggestion.pokemon_id,
      name: suggestion.name,
      confidence: suggestion.confidence ?? (payload.success ? 0.6 : 0.4),
      rationale: suggestion.rationale ?? null,
    })),
    warnings: payload.warnings ?? [],
  }));

export type ParsedIdentifyPayload = z.infer<typeof IdentifyPayloadSchema>;

interface ExtractedContent {
  text: string;
  raw: unknown;
}

interface OpenRouterIdentifySuccess {
  ok: true;
  payload: ParsedIdentifyPayload;
  rawResponse: unknown;
  rawText: string;
  durationMs: number;
}

interface OpenRouterIdentifyError {
  ok: false;
  status: number;
  message: string;
  durationMs: number;
  body?: unknown;
  retryAfter?: number;
}

export type OpenRouterIdentifyResult = OpenRouterIdentifySuccess | OpenRouterIdentifyError;

const asArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

const extractContent = (response: unknown): ExtractedContent | null => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const choices = (response as Record<string, unknown>).choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const firstChoice = choices[0];

  if (!firstChoice || typeof firstChoice !== "object") {
    return null;
  }

  const message = (firstChoice as Record<string, unknown>).message;

  if (!message || typeof message !== "object") {
    return null;
  }

  const content = (message as Record<string, unknown>).content ?? "";

  if (typeof content === "string") {
    return {
      text: content,
      raw: content,
    };
  }

  if (Array.isArray(content)) {
    const merged = content
      .flatMap((piece) => {
        if (!piece) {
          return [];
        }

        if (typeof piece === "string") {
          return [piece];
        }

        if (typeof piece === "object" && "text" in piece && typeof piece.text === "string") {
          return [piece.text];
        }

        return [];
      })
      .join("\n")
      .trim();

    return {
      text: merged,
      raw: content,
    };
  }

  return null;
};

const safeParseJson = (input: string) => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

const extractErrorMessage = (body: unknown, fallback: string): string => {
  if (!body) {
    return fallback;
  }

  if (typeof body === "string") {
    return body;
  }

  if (typeof body === "object") {
    if ("error" in body) {
      const errorObject = (body as Record<string, unknown>).error;
      if (typeof errorObject === "string") {
        return errorObject;
      }

      if (errorObject && typeof errorObject === "object") {
        if ("message" in errorObject && typeof (errorObject as Record<string, unknown>).message === "string") {
          return (errorObject as Record<string, unknown>).message as string;
        }

        if ("code" in errorObject && typeof (errorObject as Record<string, unknown>).code === "string") {
          return `OpenRouter error: ${(errorObject as Record<string, unknown>).code}`;
        }
      }
    }

    if ("message" in body && typeof (body as Record<string, unknown>).message === "string") {
      return (body as Record<string, unknown>).message as string;
    }
  }

  return fallback;
};

const extractRetryAfter = (headers: Headers): number | undefined => {
  const retryAfterHeader = headers.get("retry-after");
  if (!retryAfterHeader) {
    return undefined;
  }

  const seconds = Number.parseFloat(retryAfterHeader);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const timestamp = Date.parse(retryAfterHeader);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  const delta = timestamp - Date.now();
  return delta > 0 ? delta : undefined;
};

export const callOpenRouterIdentify = async (
  command: AiIdentifyCommand,
  options: { signal?: AbortSignal } = {}
): Promise<OpenRouterIdentifyResult> => {
  const apiKey = runtimeConfig.openRouterApiKey;

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      message: "OpenRouter API key is missing. Set OPENROUTER_API_KEY to enable AI suggestions.",
      durationMs: 0,
    };
  }

  const controller = new AbortController();
  const { signal } = options;

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  const startedAt = Date.now();
  const systemPrompt = buildSystemPrompt();
  const preferredGeneration =
    typeof command.context === "object" && command.context && "preferredGeneration" in command.context
      ? String(command.context.preferredGeneration)
      : undefined;

  const userPrompt = buildUserPrompt({
    prompt: command.prompt,
    preferredGeneration,
  });

  const payload = {
    model: DEFAULT_MODEL,
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...asArray(userPrompt).map((content) => ({
        role: "user" as const,
        content,
      })),
    ],
    response_format: {
      type: "json_object",
    },
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://10x-poke-sky.app",
        "X-Title": "10x Poke Sky",
      },
      body: JSON.stringify(payload),
    });

    const durationMs = Date.now() - startedAt;
    const retryAfter = extractRetryAfter(response.headers);
    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: extractErrorMessage(body, "OpenRouter rejected the identify request."),
        durationMs,
        body,
        retryAfter,
      };
    }

    const content = extractContent(body);

    if (!content) {
      return {
        ok: false,
        status: 502,
        message: "OpenRouter returned an unexpected payload without content.",
        durationMs,
        body,
      };
    }

    const parsedJson = safeParseJson(content.text);

    if (!parsedJson) {
      return {
        ok: true,
        payload: IdentifyPayloadSchema.parse({
          success: false,
          suggestions: [],
          warnings: ["Model returned a non-JSON response. Try rephrasing the description."],
        }),
        rawResponse: body,
        rawText: content.text,
        durationMs,
      };
    }

    const parsedPayload = IdentifyPayloadSchema.parse(parsedJson);

    return {
      ok: true,
      payload: parsedPayload,
      rawResponse: body,
      rawText: content.text,
      durationMs,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        status: 499,
        message: "The identify request was aborted.",
        durationMs: Date.now() - startedAt,
      };
    }

    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Unknown error during OpenRouter call.",
      durationMs: Date.now() - startedAt,
    };
  }
};
