import type { SymbolCode } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";

export const TEHRAN_TZ = "Asia/Tehran";

const faDigitsMap = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert Latin digits in a string to Persian digits. */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => faDigitsMap[Number(d)]);
}

export function formatPrice(symbol: SymbolCode, value: number): string {
  const digits = SYMBOLS[symbol].digits;
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatNumber(value: number, maxFractionDigits = 2): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

export function formatPercent(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatMoney(value: number, currency: "USD" | "EUR" = "USD", maxFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: maxFractionDigits }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

/** e.g. ۲۵ شهریور ۱۴۰۵ */
export function formatJalaliDate(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric", timeZone: TEHRAN_TZ }).format(new Date(iso));
}

/** e.g. 16:42:13 (Latin digits, used for data timestamps) */
export function formatClock(iso: string | Date, timeZone: string = TEHRAN_TZ, seconds = true): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: seconds ? "2-digit" : undefined, hour12: false, timeZone }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

export function formatWeekday(iso: string, timeZone: string = TEHRAN_TZ): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(iso));
}

/** Calendar day key (YYYY-MM-DD) of an instant in a given timezone. */
export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(date);
}
