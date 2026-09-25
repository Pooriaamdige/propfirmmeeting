export class ServiceUnavailableError extends Error {
  constructor(
    public readonly service: string,
    message: string,
  ) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 8000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
