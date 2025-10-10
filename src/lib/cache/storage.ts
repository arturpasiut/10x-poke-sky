type Primitive = string | number | boolean | null;

export interface CacheEntry<TValue> {
  value: TValue;
  timestamp: number;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function getStorage(): Storage | typeof noopStorage {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  return typeof window.localStorage !== "undefined" ? window.localStorage : noopStorage;
}

export function readCache<TValue>(key: string): CacheEntry<TValue> | null {
  const storage = getStorage();
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEntry<TValue>;
    if (!parsed || typeof parsed !== "object" || !("value" in parsed && "timestamp" in parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeCache<TValue>(key: string, value: TValue) {
  const storage = getStorage();
  try {
    const payload: CacheEntry<TValue> = {
      value,
      timestamp: Date.now(),
    };
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore write errors (quota exceeded etc.)
  }
}

export function invalidateCache(key: string) {
  const storage = getStorage();
  try {
    storage.removeItem(key);
  } catch {
    // noop
  }
}

export function isEntryExpired(entry: CacheEntry<unknown> | null, ttlMs: number) {
  if (!entry) return true;
  return Date.now() - entry.timestamp > ttlMs;
}

export function normalizeKey(parts: Primitive[]) {
  return parts.map((part) => String(part ?? "null")).join(":");
}
