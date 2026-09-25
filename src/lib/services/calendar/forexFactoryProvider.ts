import type { Currency, EconomicEvent, Impact } from "@/lib/types";
import { fetchJson } from "@/lib/services/errors";
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

const URLS = {
  this: "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  next: "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
};

const CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "CNY"]);

function mapImpact(i: FfEvent["impact"]): Impact {
  return i === "High" ? "high" : i === "Medium" ? "medium" : i === "Low" ? "low" : "holiday";
}

export const forexFactoryProvider: CalendarProvider = {
  name: "Forex Factory",
  isMock: false,
  async getEvents(week) {
    const raw = await fetchJson<FfEvent[]>(URLS[week], { headers: { "User-Agent": "Mozilla/5.0 (PropFirm Meeting calendar)" } });
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
