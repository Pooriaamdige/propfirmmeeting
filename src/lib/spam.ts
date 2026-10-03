import "server-only";
import { createHash } from "node:crypto";

const MIN_FILL_MS = 2500;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT ?? "pfm")).digest("hex");
}

/** Simple per-instance sliding window. Use a shared store (Redis/Upstash) when running multiple instances. */
export function rateLimited(key: string): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(key, list);
  return list.length > MAX_PER_WINDOW;
}

export function looksAutomated(honeypot: string, startedAt: number): boolean {
  return honeypot.length > 0 || Date.now() - startedAt < MIN_FILL_MS;
}

/** Verifies a Cloudflare Turnstile token when TURNSTILE_SECRET_KEY is configured. */
export async function verifyCaptcha(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const json = (await res.json()) as { success: boolean };
    return json.success;
  } catch {
    return false;
  }
}

/* Login brute-force protection: only failed attempts count; success clears the counter. */
const failures = new Map<string, number[]>();
const FAIL_WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;

export function tooManyFailures(key: string): boolean {
  const now = Date.now();
  const list = (failures.get(key) ?? []).filter((t) => now - t < FAIL_WINDOW_MS);
  failures.set(key, list);
  return list.length >= MAX_FAILURES;
}

export function recordFailure(key: string) {
  failures.set(key, [...(failures.get(key) ?? []), Date.now()]);
}

export function clearFailures(key: string) {
  failures.delete(key);
}
