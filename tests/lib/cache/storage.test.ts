import { describe, expect, it, vi, beforeEach } from "vitest";

import { invalidateCache, isEntryExpired, normalizeKey, readCache, writeCache } from "@/lib/cache/storage";

describe("storage helpers", () => {
  beforeEach(() => {
    vi.spyOn(window.localStorage, "getItem").mockReset();
    vi.spyOn(window.localStorage, "setItem").mockReset();
    vi.spyOn(window.localStorage, "removeItem").mockReset();
  });

  it("normalizes cache keys", () => {
    expect(normalizeKey(["pokemon", 10, 20])).toBe("pokemon:10:20");
    expect(normalizeKey([null, "foo", 1])).toBe("null:foo:1");
  });

  it("writes and reads cache entries", () => {
    const setItem = vi.spyOn(window.localStorage, "setItem");
    writeCache("test", { foo: "bar" });
    expect(setItem).toHaveBeenCalledOnce();

    const payload = { value: { foo: "bar" }, timestamp: Date.now() };
    vi.spyOn(window.localStorage, "getItem").mockReturnValue(JSON.stringify(payload));

    expect(readCache("test")).toEqual(payload);
  });

  it("invalidates cache entries", () => {
    const removeItem = vi.spyOn(window.localStorage, "removeItem");
    invalidateCache("test");
    expect(removeItem).toHaveBeenCalledWith("test");
  });

  it("detects expired entries", () => {
    const entry = { value: 42, timestamp: Date.now() - 1000 };
    expect(isEntryExpired(entry, 500)).toBe(true);
    expect(isEntryExpired(entry, 2000)).toBe(false);
  });
});
