import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
