import type { AiIdentifyResponseDto, AiIdentifySuggestionDto, PokemonSummaryDto } from "@/types";

import {
  createSuggestionId,
  resolveConfidenceTier,
  type AiChatSuggestionViewModel,
  type SuggestionSummaryLookup,
} from "./types";

type MapSuggestionParams = {
  response: AiIdentifyResponseDto;
  suggestion: AiIdentifySuggestionDto;
  summary?: PokemonSummaryDto;
};

const formatSummary = (summary?: PokemonSummaryDto): string | undefined => {
  if (!summary) {
    return undefined;
  }

  const taxonomy: string[] = [];

  if (summary.region) {
    taxonomy.push(summary.region);
  }

  if (summary.generation) {
    taxonomy.push(`Gen ${summary.generation}`);
  }

  const typesLabel = summary.types?.length ? summary.types.join(" / ") : undefined;

  return [taxonomy.join(" • "), typesLabel].filter(Boolean).join(" — ") || undefined;
};

export const mapSuggestionToViewModel = ({
  response,
  suggestion,
  summary,
}: MapSuggestionParams): AiChatSuggestionViewModel => ({
  id: createSuggestionId(response, suggestion),
  pokemonId: suggestion.pokemonId,
  name: suggestion.name,
  confidence: suggestion.confidence,
  confidenceTier: resolveConfidenceTier(suggestion.confidence),
  rationale: suggestion.rationale,
  spriteUrl: summary?.spriteUrl ?? null,
  summary: formatSummary(summary),
  highlights: summary?.highlights ?? [],
  detailHref: `/pokemon/${suggestion.pokemonId}`,
  favorite: {
    status: "idle",
  },
});

export const mapResponseToSuggestions = (
  response: AiIdentifyResponseDto,
  lookup: SuggestionSummaryLookup = {}
): AiChatSuggestionViewModel[] =>
  response.suggestions.map((suggestion) =>
    mapSuggestionToViewModel({
      response,
      suggestion,
      summary: lookup[suggestion.pokemonId],
    })
  );
