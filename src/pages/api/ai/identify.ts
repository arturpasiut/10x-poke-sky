import type { APIRoute } from "astro";
import { z } from "zod";

import { callOpenRouterIdentify } from "@/lib/ai/openrouter";
import type { AiIdentifyCommand, AiIdentifyResponseDto } from "@/types";

const RequestSchema = z.object({
  prompt: z
    .string({
      required_error: "Opis jest wymagany.",
      invalid_type_error: "Opis musi być tekstem.",
    })
    .trim()
    .min(10, "Opis musi mieć co najmniej 10 znaków.")
    .max(500, "Opis może mieć maksymalnie 500 znaków."),
  context: z
    .object({
      preferredGeneration: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

const toCommand = (payload: z.infer<typeof RequestSchema>): AiIdentifyCommand => ({
  prompt: payload.prompt,
  context: payload.context ?? null,
});

const buildResponseDto = (
  result: Awaited<ReturnType<typeof callOpenRouterIdentify>>,
  command: AiIdentifyCommand
): AiIdentifyResponseDto => {
  if (!result.ok) {
    throw new Error("Attempted to build response DTO from an error result.");
  }

  const { payload } = result;
  const suggestions = payload.suggestions.map((suggestion) => ({
    pokemonId: suggestion.pokemonId,
    name: suggestion.name,
    confidence: Math.min(1, Math.max(0, suggestion.confidence)),
    rationale: suggestion.rationale,
  }));

  return {
    queryId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "",
    success: payload.success && suggestions.length > 0,
    latencyMs: result.durationMs,
    suggestions,
    rawResponse: {
      warnings: payload.warnings,
      openrouter: result.rawResponse,
      rawText: result.rawText,
      command,
    },
    createdAt: new Date().toISOString(),
  };
};

const jsonResponse = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });

export const POST: APIRoute = async ({ request }) => {
  let command: AiIdentifyCommand;

  try {
    const payload = RequestSchema.parse(await request.json());
    command = toCommand(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? "Niepoprawne dane wejściowe.";
      return jsonResponse(
        {
          message,
          details: error.flatten(),
        },
        { status: 422 }
      );
    }

    return jsonResponse(
      {
        message: "Nie udało się odczytać danych żądania.",
      },
      { status: 400 }
    );
  }

  const result = await callOpenRouterIdentify(command);

  if (!result.ok) {
    const headers: HeadersInit = {};

    if (typeof result.retryAfter === "number") {
      headers["Retry-After"] = Math.max(1, Math.round(result.retryAfter / 1000)).toString();
    }

    return jsonResponse(
      {
        message: result.message,
        details: result.body ?? null,
      },
      {
        status: result.status,
        headers,
      }
    );
  }

  const responseDto = buildResponseDto(result, command);

  return jsonResponse(responseDto, {
    status: 200,
  });
};
