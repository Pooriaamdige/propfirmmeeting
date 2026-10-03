import "server-only";

/**
 * Short-lived in-process cache for database-backed content. Admin mutations call
 * `invalidateContent()` so edits show up on the next request.
 */
const store = new Map<string, { value: unknown; at: number }>();
const TTL = 60_000;

export async function remember<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await fn();
  store.set(key, { value, at: Date.now() });
  return value;
}

export function invalidateContent(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
