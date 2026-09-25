import type { Currency, EconomicEvent, Impact } from "@/lib/types";
import type { CalendarProvider } from "./provider";

/** DEVELOPMENT ONLY — realistic weekly calendar template anchored to the current week. */
const TEMPLATE: { day: number; utc: string; currency: Currency; impact: Impact; title: string; forecast: string | null; previous: string | null }[] = [
  { day: 0, utc: "23:50", currency: "JPY", impact: "low", title: "Monetary Policy Meeting Minutes", forecast: null, previous: null },
  { day: 1, utc: "01:30", currency: "AUD", impact: "medium", title: "Retail Sales m/m", forecast: "0.4%", previous: "0.6%" },
  { day: 1, utc: "07:00", currency: "EUR", impact: "medium", title: "German Ifo Business Climate", forecast: "88.9", previous: "89.0" },
  { day: 1, utc: "08:30", currency: "GBP", impact: "high", title: "Flash Manufacturing PMI", forecast: "47.1", previous: "47.0" },
  { day: 1, utc: "13:45", currency: "USD", impact: "high", title: "Flash Services PMI", forecast: "54.0", previous: "54.5" },
  { day: 1, utc: "14:00", currency: "USD", impact: "medium", title: "CB Consumer Confidence", forecast: "96.1", previous: "97.4" },
  { day: 2, utc: "01:30", currency: "AUD", impact: "high", title: "CPI y/y", forecast: "2.9%", previous: "2.8%" },
  { day: 2, utc: "08:00", currency: "CHF", impact: "low", title: "ZEW Economic Expectations", forecast: null, previous: "-9.2" },
  { day: 2, utc: "12:30", currency: "CAD", impact: "high", title: "GDP m/m", forecast: "0.1%", previous: "-0.1%" },
  { day: 2, utc: "14:30", currency: "USD", impact: "medium", title: "Crude Oil Inventories", forecast: "-1.2M", previous: "-9.3M" },
  { day: 2, utc: "18:00", currency: "USD", impact: "high", title: "FOMC Member Speaks", forecast: null, previous: null },
  { day: 3, utc: "07:30", currency: "CHF", impact: "high", title: "SNB Monetary Policy Assessment", forecast: null, previous: null },
  { day: 3, utc: "07:30", currency: "CHF", impact: "high", title: "SNB Policy Rate", forecast: "0.00%", previous: "0.00%" },
  { day: 3, utc: "12:30", currency: "USD", impact: "high", title: "Final GDP q/q", forecast: "3.3%", previous: "3.3%" },
  { day: 3, utc: "12:30", currency: "USD", impact: "high", title: "Unemployment Claims", forecast: "233K", previous: "231K" },
  { day: 3, utc: "12:30", currency: "USD", impact: "medium", title: "Durable Goods Orders m/m", forecast: "-0.3%", previous: "-2.8%" },
  { day: 3, utc: "14:00", currency: "USD", impact: "medium", title: "Existing Home Sales", forecast: "3.96M", previous: "4.01M" },
  { day: 4, utc: "06:00", currency: "GBP", impact: "medium", title: "Retail Sales m/m", forecast: "0.3%", previous: "0.6%" },
  { day: 4, utc: "09:00", currency: "EUR", impact: "low", title: "M3 Money Supply y/y", forecast: "3.0%", previous: "3.4%" },
  { day: 4, utc: "12:30", currency: "USD", impact: "high", title: "Core PCE Price Index m/m", forecast: "0.2%", previous: "0.3%" },
  { day: 4, utc: "14:00", currency: "USD", impact: "medium", title: "Revised UoM Consumer Sentiment", forecast: "55.4", previous: "55.4" },
  { day: 4, utc: "22:45", currency: "NZD", impact: "low", title: "Building Consents m/m", forecast: null, previous: "-0.7%" },
];

function mondayOf(date: Date, weekOffset: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow + weekOffset * 7);
  return d;
}

export const mockCalendarProvider: CalendarProvider = {
  name: "Mock (development)",
  isMock: true,
  async getEvents(week) {
    const now = new Date();
    const monday = mondayOf(now, week === "this" ? 0 : 1);
    return TEMPLATE.map((t, idx): EconomicEvent => {
      const [h, m] = t.utc.split(":").map(Number);
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + t.day);
      d.setUTCHours(h, m, 0, 0);
      const released = d.getTime() < now.getTime();
      const actual = released && t.forecast ? t.forecast.replace(/(\d)(?=[^\d]*$)/, (x) => String((Number(x) + 1) % 10)) : null;
      return { id: `mock-${week}-${idx}`, datetime: d.toISOString(), allDay: false, currency: t.currency, impact: t.impact, title: t.title, actual, forecast: t.forecast, previous: t.previous };
    });
  },
};
