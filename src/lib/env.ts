/* eslint-disable no-console -- Logging helps diagnose invalid or missing configuration during setup */
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z
    .string()
    .url("SUPABASE_URL must be a valid URL")
    .describe("Supabase project URL used by the server adapter"),
  SUPABASE_KEY: z
    .string()
    .min(1, "SUPABASE_KEY is required")
    .describe("Supabase anon key (keep fake credentials during early phases)"),
  POKEAPI_BASE_URL: z
    .string()
    .url("POKEAPI_BASE_URL must be a valid URL")
    .default("https://pokeapi.co/api/v2")
    .describe("Base URL for the public PokeAPI"),
  OPENROUTER_API_KEY: z
    .string()
    .min(1, "OPENROUTER_API_KEY cannot be empty")
    .optional()
    .describe("API key for OpenRouter (optional until AI features go live)"),
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY cannot be empty")
    .optional()
    .describe("Direct Gemini key (optional fallback when not using OpenRouter)"),
});

const rawEnv = {
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.SUPABASE_KEY,
  POKEAPI_BASE_URL: import.meta.env.POKEAPI_BASE_URL,
  OPENROUTER_API_KEY: import.meta.env.OPENROUTER_API_KEY,
  GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check your .env configuration.");
}

const env = parsed.data;

const missingOptional = [
  !env.OPENROUTER_API_KEY && "OPENROUTER_API_KEY",
  !env.GEMINI_API_KEY && "GEMINI_API_KEY",
].filter(Boolean) as string[];

if (missingOptional.length > 0) {
  console.warn(
    `[env] Optional API keys not set: ${missingOptional.join(", ")}. AI features will remain mocked until configured.`
  );
}

export const runtimeConfig = {
  supabaseUrl: env.SUPABASE_URL,
  supabaseKey: env.SUPABASE_KEY,
  pokeApiBaseUrl: env.POKEAPI_BASE_URL,
  openRouterApiKey: env.OPENROUTER_API_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
} as const;

export const pokeApiEndpoints = {
  pokemon: `${runtimeConfig.pokeApiBaseUrl}/pokemon`,
  pokemonSpecies: `${runtimeConfig.pokeApiBaseUrl}/pokemon-species`,
  moves: `${runtimeConfig.pokeApiBaseUrl}/move`,
  types: `${runtimeConfig.pokeApiBaseUrl}/type`,
  regions: `${runtimeConfig.pokeApiBaseUrl}/region`,
  evolutionChains: `${runtimeConfig.pokeApiBaseUrl}/evolution-chain`,
} as const;

export type RuntimeConfig = typeof runtimeConfig;
