const JSON_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/gi;
const PARSE_FAILURE = Symbol("PARSE_FAILURE");

const tryParseCandidate = (candidate: string) => {
  if (!candidate) {
    return PARSE_FAILURE;
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return PARSE_FAILURE;
  }
};

export const safeParseJson = (input: string): unknown | null => {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const candidates = new Set<string>([trimmed]);
  let fenceMatch: RegExpExecArray | null;

  while ((fenceMatch = JSON_FENCE_PATTERN.exec(trimmed)) !== null) {
    const fenced = fenceMatch[1]?.trim();

    if (fenced) {
      candidates.add(fenced);
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.add(trimmed.slice(firstBrace, lastBrace + 1).trim());
  }

  for (const candidate of candidates) {
    const parsed = tryParseCandidate(candidate);

    if (parsed !== PARSE_FAILURE) {
      return parsed;
    }
  }

  return null;
};
