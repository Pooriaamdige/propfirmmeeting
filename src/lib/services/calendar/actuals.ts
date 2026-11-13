import type { EconomicEvent } from "@/lib/types";

/**
 * Forex Factory's free weekly feed has forecast/previous but never the actual figure.
 * Actuals for released events are filled in from an optional second source:
 *
 *   JBLANKED_API_KEY  Forex Factory calendar mirror with actuals (free key at jblanked.com)
 *   FMP_API_KEY       Financial Modeling Prep economic calendar
 *
 * The pure matching/formatting helpers live here so they can be unit tested.
 */
export interface ActualRow {
  title: string;
  currency: string;
  /** Epoch ms; may be off by a timezone for some sources, so matching tolerates it. */
  time: number;
  actual: string | number | null;
}

const SYN: Record<string, string> = { "m/m": "mom", "y/y": "yoy", "q/q": "qoq", "3m/3m": "3m3m" };

function tokens(title: string): string[] {
  let t = title.toLowerCase();
  for (const [k, v] of Object.entries(SYN)) t = t.split(k).join(` ${v} `);
  return t.replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

const norm = (title: string) => tokens(title).join(" ");

function similarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const x of A) if (B.has(x)) both++;
  return both / (A.size + B.size - both);
}

const decimalsOf = (s: string) => (s.match(/\.(\d+)/)?.[1].length ?? 0);
const numOf = (s: string | null) => {
  if (!s) return NaN;
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

/** Format a source value like the event's forecast/previous ("0.3%", "227K", "1.25B"). */
export function formatActual(value: string | number | null, like: EconomicEvent): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && /[^\d.,\s+-]/.test(value)) return value.trim(); // already has a unit
  let n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const ref = like.previous ?? like.forecast ?? "";
  const suffix = ref.match(/[%KMBT]$/i)?.[0] ?? "";
  const refNum = numOf(ref);
  // Some sources send 256000 where Forex Factory shows "256K".
  for (let i = 0; i < 3 && /[KMBT]/i.test(suffix) && Number.isFinite(refNum) && refNum !== 0 && Math.abs(n / refNum) > 300; i++) n /= 1000;
  return `${n.toFixed(decimalsOf(ref))}${suffix}`;
}

/**
 * Fill `actual` on released events that lack one. A row matches when the currency agrees and
 * either the normalised title is identical within ±36h, or the time is within 2 minutes and the
 * title is the clearly best match among rows released at that minute.
 */
export function mergeActuals(events: EconomicEvent[], rows: ActualRow[], now = Date.now()): EconomicEvent[] {
  if (!rows.length) return events;
  const byCurrency = new Map<string, ActualRow[]>();
  for (const r of rows) {
    if (r.actual === null || r.actual === "") continue;
    const list = byCurrency.get(r.currency.toUpperCase()) ?? [];
    list.push(r);
    byCurrency.set(r.currency.toUpperCase(), list);
  }
  return events.map((e) => {
    const t = Date.parse(e.datetime);
    if (e.actual || e.allDay || t > now) return e;
    const list = byCurrency.get(e.currency) ?? [];
    const title = norm(e.title);
    const exact = list.filter((r) => norm(r.title) === title && Math.abs(r.time - t) < 36 * 3600_000).sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t))[0];
    let pick = exact;
    if (!pick) {
      const sameMinute = list.filter((r) => Math.abs(r.time - t) <= 2 * 60_000);
      const scored = sameMinute.map((r) => ({ r, s: similarity(e.title, r.title) })).sort((a, b) => b.s - a.s);
      if (scored.length === 1 && scored[0].s >= 0.15) pick = scored[0].r;
      else if (scored.length > 1 && scored[0].s >= 0.25 && scored[0].s > scored[1].s) pick = scored[0].r;
    }
    if (!pick) return e;
    const actual = formatActual(pick.actual, e);
    return actual ? { ...e, actual } : e;
  });
}
