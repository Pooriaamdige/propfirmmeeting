import "server-only";
import type { CalendarRange, DataEnvelope, EconomicEvent } from "@/lib/types";
import { cached } from "@/lib/cache";
import { dayKey } from "@/lib/format";
import { ServiceUnavailableError } from "@/lib/services/errors";
import { reportFailure, reportSuccess } from "@/lib/services/health";
import type { CalendarProvider } from "./calendar/provider";
import { forexFactoryProvider } from "./calendar/forexFactoryProvider";
import { mockCalendarProvider } from "./calendar/mockProvider";
import { mergeActuals, type ActualRow } from "./calendar/actuals";
import { ACTUALS_SOURCES } from "./calendar/actualSources";

function provider(): CalendarProvider {
  const configured = process.env.CALENDAR_PROVIDER ?? "forexfactory";
  return configured === "mock" ? mockCalendarProvider : forexFactoryProvider;
}

async function weekEvents(p: CalendarProvider, week: "this" | "next"): Promise<{ events: EconomicEvent[]; fetchedAt: string }> {
  return cached(
    `calendar:${p.name}:${week}`,
    p.isMock ? 60_000 : 30 * 60_000,
    async () => {
      try {
        const events = await p.getEvents(week);
        reportSuccess(p.name, "calendar");
        return { events, fetchedAt: new Date().toISOString() };
      } catch (err) {
        reportFailure(p.name, "calendar", err);
        throw err;
      }
    },
    6 * 3600_000,
  );
}

/**
 * Actual figures for released events (the Forex Factory feed has none). Uses the first configured
 * source that answers; refreshed every 5 minutes. Failures leave the events as they are.
 */
async function withActuals(events: EconomicEvent[]): Promise<EconomicEvent[]> {
  const now = Date.now();
  if (!events.some((e) => !e.actual && !e.allDay && Date.parse(e.datetime) <= now)) return events;
  const sources = ACTUALS_SOURCES.filter((s) => s.enabled());
  if (!sources.length) return events;
  const times = events.map((e) => Date.parse(e.datetime));
  const from = new Date(Math.min(...times) - 86400_000).toISOString().slice(0, 10);
  const to = new Date(Math.min(Math.max(...times), now) + 86400_000).toISOString().slice(0, 10);
  let rows: ActualRow[] = [];
  for (const src of sources) {
    try {
      rows = await cached(
        `calendar:actuals:${src.name}:${from}:${to}`,
        5 * 60_000,
        async () => {
          try {
            const r = await src.fetch(from, to);
            reportSuccess(src.name, "calendar");
            return r;
          } catch (err) {
            reportFailure(src.name, "calendar", err);
            throw err;
          }
        },
        60 * 60_000,
      );
      break;
    } catch {
      /* try the next source */
    }
  }
  return mergeActuals(events, rows, now);
}

/** Add `days` calendar days to a YYYY-MM-DD key. */
function shiftDay(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days (YYYY-MM-DD, in `timeZone`) covered by a range. Weeks run Monday–Sunday. */
function daysForRange(range: CalendarRange, timeZone: string, now = new Date()): Set<string> {
  const today = dayKey(now, timeZone);
  if (range === "today") return new Set([today]);
  if (range === "tomorrow") return new Set([shiftDay(today, 1)]);
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = shiftDay(today, -dow + (range === "next-week" ? 7 : 0));
  return new Set(Array.from({ length: 7 }, (_, i) => shiftDay(start, i)));
}

export async function getEconomicCalendar(range: CalendarRange, timeZone: string): Promise<DataEnvelope<EconomicEvent[]>> {
  const p = provider();
  // Provider weeks follow the provider's own boundaries; fetch both and filter by local day.
  const [thisWeek, nextWeek] = await Promise.allSettled([weekEvents(p, "this"), weekEvents(p, "next")]);
  if (thisWeek.status === "rejected" && nextWeek.status === "rejected") {
    throw new ServiceUnavailableError("calendar", String(thisWeek.reason));
  }
  const parts = [thisWeek, nextWeek].flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const days = daysForRange(range, timeZone);
  const seen = new Set<string>();
  const events = parts
    .flatMap((x) => x.events)
    .filter((e) => days.has(dayKey(new Date(e.datetime), timeZone)))
    .filter((e) => {
      const k = `${e.datetime}|${e.currency}|${e.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime));

  return {
    data: p.isMock ? events : await withActuals(events),
    source: p.name,
    isMock: p.isMock,
    fetchedAt: parts.map((x) => x.fetchedAt).sort()[0],
  };
}
