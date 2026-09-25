import "server-only";
import { NextResponse } from "next/server";
import { ServiceUnavailableError } from "@/lib/services/errors";

const VALID_TZ = new Set(["Asia/Tehran", "UTC", "America/New_York", "Europe/London"]);

export function parseTimeZone(value: string | null): string {
  return value && VALID_TZ.has(value) ? value : "Asia/Tehran";
}

export function ok<T>(body: T, sMaxAge: number) {
  return NextResponse.json(body, { headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 4}` } });
}

export function fail(err: unknown, fallbackMessage: string) {
  if (!(err instanceof ServiceUnavailableError)) console.error(err);
  else console.warn(`[${err.service}] ${err.message}`);
  return NextResponse.json({ error: "unavailable", message: fallbackMessage }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
