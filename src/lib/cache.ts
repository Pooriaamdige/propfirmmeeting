/**
 * Tiny in-process TTL cache used by the service layer so that provider APIs are
 * hit at most once per TTL per server instance. On refresh failure, a stale value
 * younger than `maxStaleMs` is returned (its original timestamp is preserved in the
 * envelope, so the UI never presents stale data as fresh).
 */
type Entry<T> = { value: T; storedAt: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>, maxStaleMs = 5 * 60_000): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && now - hit.storedAt < ttlMs) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async () => {
    try {
      const value = await fn();
      store.set(key, { value, storedAt: Date.now() });
      return value;
    } catch (err) {
      if (hit && now - hit.storedAt < maxStaleMs) return hit.value;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}
