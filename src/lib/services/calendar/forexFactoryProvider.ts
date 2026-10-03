import type { Currency, EconomicEvent, Impact } from "@/lib/types";
import { getJson } from "@/lib/services/http";
import type { CalendarProvider } from "./provider";

/**
 * Forex Factory public weekly calendar export (faireconomy.media mirror).
 * The feed is rate-limited, so responses are cached for 30 minutes by the service.
 */
interface FfEvent {
  title: string;
  country: string;
  date: string; // ISO with offset
  impact: "High" | "Medium" | "Low" | "Holiday" | "Non-Economic";
  forecast: string;
  previous: string;
  actual?: string;
}

const BASE = (process.env.FOREX_FACTORY_FEED_BASE ?? "https://nfs.faireconomy.media").replace(/\/$/, "");
const URLS = {
  this: `${BASE}/ff_calendar_thisweek.json`,
  next: `${BASE}/ff_calendar_nextweek.json`,
};

const CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "CNY"]);

function mapImpact(i: FfEvent["impact"]): Impact {
  return i === "High" ? "high" : i === "Medium" ? "medium" : i === "Low" ? "low" : "holiday";
}

export const forexFactoryProvider: CalendarProvider = {
  name: "Forex Factory",
  isMock: false,
  async getEvents(week) {
    let raw: FfEvent[];
    try {
      raw = await getJson<FfEvent[]>(URLS[week]);
    } catch (err) {
      // The next-week file is only published late in the week; until then it 404s.
      if (week === "next" && /HTTP 404/.test(String((err as Error).message))) return [];
      throw err;
    }
    return raw
      .filter((e) => CURRENCIES.has(e.country) && e.impact !== "Non-Economic")
      .map((e, idx): EconomicEvent => {
        const d = new Date(e.date);
        const allDay = e.impact === "Holiday";
        return {
          id: `ff-${d.getTime()}-${e.country}-${idx}`,
          datetime: d.toISOString(),
          allDay,
          currency: e.country as Currency,
          impact: mapImpact(e.impact),
          title: e.title,
          actual: e.actual || null,
          forecast: e.forecast || null,
          previous: e.previous || null,
        };
      });
  },
};
