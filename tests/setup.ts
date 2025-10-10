import { vi } from "vitest";

/**
 * jsdom < 20 exposes localStorage but not per-test clearing. Ensure we stub it.
 */
const storage = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
  },
});

beforeEach(() => {
  storage.clear();
  window.localStorage.clear.mockClear();
  window.localStorage.getItem.mockClear();
  window.localStorage.setItem.mockClear();
  window.localStorage.removeItem.mockClear();
});
