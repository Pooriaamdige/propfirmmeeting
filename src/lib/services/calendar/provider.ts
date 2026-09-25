import type { EconomicEvent } from "@/lib/types";

export interface CalendarProvider {
  name: string;
  isMock: boolean;
  /** All events for the current and the next week (UTC ISO datetimes). */
  getEvents(week: "this" | "next"): Promise<EconomicEvent[]>;
}
