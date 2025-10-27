export interface AiModelOption {
  id: string;
  label: string;
  provider: string;
  description: string;
  tier: "free" | "paid";
}

export const AI_MODEL_OPTIONS: AiModelOption[] = [
  {
    id: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash (exp)",
    provider: "Google",
    description: "Szybki model eksperymentalny z rodziny Gemini 2.0, dobry do krótkich opisów.",
    tier: "free",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Nowsza odsłona Gemini Flash – lepsza dokładność przy zachowaniu niskiej latencji.",
    tier: "paid",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B Instruct",
    provider: "Meta",
    description: "Największy darmowy model Llamy – wysoka jakość wnioskowania kosztem nieco większej latencji.",
    tier: "free",
  },
  {
    id: "qwen/qwen3-235b-a22b:free",
    label: "Qwen3 235B A22B",
    provider: "Alibaba Qwen",
    description: "Bardzo duży model Qwen, trafny przy złożonych opisach i szukaniu niuansów.",
    tier: "free",
  },
  {
    id: "z-ai/glm-4.5-air:free",
    label: "GLM 4.5 Air",
    provider: "Zhipu AI",
    description: "Zbalansowany model GLM – dobry kompromis między jakością, a szybkością.",
    tier: "free",
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT OSS 20B",
    provider: "OpenAI",
    description: "Otwarty model OpenAI o średniej wielkości, stabilny w zadaniach klasyfikacyjnych.",
    tier: "free",
  },
  {
    id: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    label: "DeepSeek R1 Qwen 8B",
    provider: "DeepSeek",
    description: "Dotychczasowy model w aplikacji – szybki, lecz mniej precyzyjny przy trudnych opisach.",
    tier: "free",
  },
] as const;

export const DEFAULT_AI_MODEL_ID = AI_MODEL_OPTIONS[0]?.id ?? "deepseek/deepseek-r1-0528-qwen3-8b:free";

const AI_MODEL_ID_SET = new Set(AI_MODEL_OPTIONS.map((option) => option.id));

export const isSupportedAiModel = (modelId: string | null | undefined): modelId is string => {
  if (!modelId) {
    return false;
  }

  return AI_MODEL_ID_SET.has(modelId);
};

export const resolveSupportedModelId = (
  candidate: string | null | undefined,
  fallback: string = DEFAULT_AI_MODEL_ID
): string => {
  if (candidate && AI_MODEL_ID_SET.has(candidate)) {
    return candidate;
  }

  if (AI_MODEL_ID_SET.has(fallback)) {
    return fallback;
  }

  return Array.from(AI_MODEL_ID_SET)[0] ?? fallback;
};
