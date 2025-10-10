import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ? Number(process.env.PLAYWRIGHT_PORT) : 4321;
const HOST = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ?? "http://localhost:54321",
      SUPABASE_KEY: process.env.SUPABASE_KEY ?? "supabase-anon-key",
      POKEAPI_BASE_URL: process.env.POKEAPI_BASE_URL ?? "https://pokeapi.co/api/v2",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "openrouter-placeholder-key",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "gemini-placeholder-key",
    },
  },
});
