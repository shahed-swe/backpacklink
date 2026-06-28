// Simple in-memory TTL cache. Good enough for dev and the catalog read path.
// Replace with Redis in production (same getOrSet signature).
type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

export async function getOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;
  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidate(prefix?: string) {
  if (!prefix) return store.clear();
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}

// Common TTLs
export const TTL = {
  countries: 6 * 60 * 60 * 1000, // 6h — changes rarely
  packages: 30 * 60 * 1000, // 30m
  detail: 60 * 60 * 1000, // 1h
};
