import "server-only";
import { getJson } from "@/lib/services/http";
import type { ActualRow } from "./actuals";

export interface ActualsSource {
  name: string;
  enabled: () => boolean;
  /** Rows for the given UTC day range (inclusive). */
  fetch: (fromDay: string, toDay: string) => Promise<ActualRow[]>;
}

/** "2026.11.10 15:30:00", "2026-11-10 13:30:00", ISO … → epoch ms (UTC when no offset is given). */
function parseTime(s: string): number {
  const v = s.trim().replace(/^(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3");
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(v) ? v.replace(" ", "T") : `${v.replace(" ", "T")}Z`;
  return Date.parse(iso);
}

/** JBlanked's Forex Factory mirror (same titles as the weekly feed, with actuals). */
const jblanked: ActualsSource = {
  name: "JBlanked (Forex Factory)",
  enabled: () => !!process.env.JBLANKED_API_KEY,
  async fetch() {
    const base = (process.env.JBLANKED_API_BASE ?? "https://www.jblanked.com").replace(/\/$/, "");
    const rows = await getJson<{ Name?: string; Currency?: string; Date?: string; Actual?: string | number | null }[]>(`${base}/news/api/forex-factory/calendar/week/`, {
      headers: { Authorization: `Api-Key ${process.env.JBLANKED_API_KEY}` },
    });
    if (!Array.isArray(rows)) throw new Error("JBlanked: unexpected response");
    return rows.flatMap((r) => (r.Name && r.Currency && r.Date ? [{ title: r.Name, currency: r.Currency, time: parseTime(r.Date), actual: r.Actual ?? null }] : []));
  },
};

/** Financial Modeling Prep economic calendar (times in UTC). */
const fmp: ActualsSource = {
  name: "Financial Modeling Prep",
  enabled: () => !!process.env.FMP_API_KEY,
  async fetch(fromDay, toDay) {
    const base = (process.env.FMP_API_BASE ?? "https://financialmodelingprep.com").replace(/\/$/, "");
    const rows = await getJson<{ event?: string; currency?: string; date?: string; actual?: number | string | null }[]>(
      `${base}/stable/economic-calendar?from=${fromDay}&to=${toDay}&apikey=${process.env.FMP_API_KEY}`,
    );
    if (!Array.isArray(rows)) throw new Error("FMP: unexpected response");
    return rows.flatMap((r) => (r.event && r.currency && r.date ? [{ title: r.event, currency: r.currency, time: parseTime(r.date), actual: r.actual ?? null }] : []));
  },
};

export const ACTUALS_SOURCES = [jblanked, fmp];
