import "@testing-library/jest-dom/vitest";

// Minimal polyfill for Astro's import.meta.env in test context.
if (!import.meta.env) {
  Object.defineProperty(import.meta, "env", {
    value: {},
    writable: false,
  });
}
