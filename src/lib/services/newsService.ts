import "server-only";
import type { DataEnvelope, EconomicEvent } from "@/lib/types";
import { getEconomicCalendar } from "./economicCalendarService";

/**
 * "Market news" feed: the most relevant medium/high impact releases around now —
 * recently released first-tier data plus the next upcoming events.
 */
export async function getForexNews(timeZone: string, limit = 12): Promise<DataEnvelope<EconomicEvent[]>> {
  const week = await getEconomicCalendar("this-week", timeZone);
  let next: EconomicEvent[] = [];
  try {
    next = (await getEconomicCalendar("next-week", timeZone)).data;
  } catch {
    /* next week is optional */
  }
  const now = Date.now();
  const relevant = [...week.data, ...next].filter((e) => e.impact === "high" || e.impact === "medium");
  const recent = relevant.filter((e) => Date.parse(e.datetime) <= now && now - Date.parse(e.datetime) < 24 * 3600_000).slice(-4);
  const upcoming = relevant.filter((e) => Date.parse(e.datetime) > now).slice(0, Math.max(0, limit - recent.length));
  return { ...week, data: [...recent, ...upcoming] };
}
