import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  testDir: "./tests",
  // Disable parallel execution - favorites tests share the same user/database
  // Running in parallel causes race conditions with favorites table
  fullyParallel: false,

  // Retry flaky tests automatically (standard for E2E)
  retries: process.env.CI ? 2 : 1,

  // Run tests serially (1 worker) to avoid database conflicts
  workers: 1,

  // Test timeouts
  timeout: 60000, // 60s per test
  expect: {
    timeout: 15000, // 15s per assertion
  },

  reporter: [["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",

    // Increase default timeouts for more stability
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project (runs before tests)
    // Currently empty but can be used for global setup in the future
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "teardown",
    },

    // Teardown project (runs after all tests complete)
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },

    // Main test project
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
