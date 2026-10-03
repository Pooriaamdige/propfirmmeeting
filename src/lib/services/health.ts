import "server-only";

/** In-process health registry for external data providers (shown in the admin dashboard). */
export interface ProviderHealth {
  name: string;
  kind: "market" | "calendar";
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  calls: number;
}

const registry = new Map<string, ProviderHealth>();

function entry(name: string, kind: ProviderHealth["kind"]): ProviderHealth {
  let e = registry.get(name);
  if (!e) {
    e = { name, kind, lastSuccessAt: null, lastErrorAt: null, lastError: null, consecutiveFailures: 0, calls: 0 };
    registry.set(name, e);
  }
  return e;
}

export function reportSuccess(name: string, kind: ProviderHealth["kind"]) {
  const e = entry(name, kind);
  e.calls++;
  e.lastSuccessAt = new Date().toISOString();
  e.consecutiveFailures = 0;
}

export function reportFailure(name: string, kind: ProviderHealth["kind"], err: unknown) {
  const e = entry(name, kind);
  e.calls++;
  e.lastErrorAt = new Date().toISOString();
  e.lastError = err instanceof Error ? err.message : String(err);
  e.consecutiveFailures++;
}

/** Skip a provider for a while after repeated failures (simple circuit breaker). */
export function isTripped(name: string): boolean {
  const e = registry.get(name);
  if (!e || e.consecutiveFailures < 3 || !e.lastErrorAt) return false;
  const cooldown = Math.min(5 * 60_000, 15_000 * 2 ** (e.consecutiveFailures - 3));
  return Date.now() - Date.parse(e.lastErrorAt) < cooldown;
}

export function getHealth(): ProviderHealth[] {
  return [...registry.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function registerProvider(name: string, kind: ProviderHealth["kind"]) {
  entry(name, kind);
}
