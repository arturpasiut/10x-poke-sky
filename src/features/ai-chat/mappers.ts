import { formatPokemonDisplayName } from "@/lib/pokemon/transformers";
import type { AiIdentifyResponseDto, AiIdentifySuggestionDto, PokemonSummaryDto } from "@/types";

import {
  createSuggestionId,
  resolveConfidenceTier,
  type AiChatSuggestionViewModel,
  type SuggestionSummaryLookup,
} from "./types";

interface MapSuggestionParams {
  response: AiIdentifyResponseDto;
  suggestion: AiIdentifySuggestionDto;
  summary?: PokemonSummaryDto;
}

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
  pokemonId: summary?.pokemonId ?? suggestion.pokemonId,
  name: resolveSuggestionName(summary, suggestion),
  confidence: suggestion.confidence,
  confidenceTier: resolveConfidenceTier(suggestion.confidence),
  rationale: suggestion.rationale,
  spriteUrl: summary?.spriteUrl ?? null,
  summary: formatSummary(summary),
  highlights: summary?.highlights ?? [],
  detailHref: buildDetailHref(summary, suggestion),
  favorite: {
    status: "idle",
  },
});

export const mapResponseToSuggestions = (
  response: AiIdentifyResponseDto,
  lookup: SuggestionSummaryLookup = {}
): AiChatSuggestionViewModel[] => {
  const hasLookupData = Object.keys(lookup).length > 0;

  return response.suggestions.flatMap((suggestion) => {
    const summary = lookup[suggestion.pokemonId];

    if (hasLookupData && !summary) {
      console.warn(
        "[ai] Skipping suggestion without matching Pokémon summary",
        suggestion.pokemonId,
        suggestion.name
      );
      return [];
    }

    return [
      mapSuggestionToViewModel({
        response,
        suggestion,
        summary,
      }),
    ];
  });
};

const buildDetailHref = (summary: PokemonSummaryDto | undefined, suggestion: AiIdentifySuggestionDto): string => {
  const summaryIdentifier = summary?.name?.trim();

  if (summaryIdentifier) {
    return `/pokemon/${summaryIdentifier}`;
  }

  const fallbackIdentifier = toIdentifierSlug(suggestion.name);

  if (fallbackIdentifier) {
    return `/pokemon/${fallbackIdentifier}`;
  }

  return `/pokemon/${suggestion.pokemonId}`;
};

const resolveSuggestionName = (
  summary: PokemonSummaryDto | undefined,
  suggestion: AiIdentifySuggestionDto
): string => {
  const source = summary?.name ?? suggestion.name;
  if (!source) {
    return suggestion.name;
  }

  return formatPokemonDisplayName(source);
};

const toIdentifierSlug = (name: string | null | undefined): string | null => {
  if (!name) {
    return null;
  }

  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
};
