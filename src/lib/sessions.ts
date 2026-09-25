/** Forex trading sessions defined in local exchange time, so DST is handled by Intl. */
export const SESSIONS = [
  { id: "sydney", name: "Sydney", faName: "سیدنی", tz: "Australia/Sydney", open: 7, close: 16 },
  { id: "tokyo", name: "Tokyo", faName: "توکیو", tz: "Asia/Tokyo", open: 9, close: 18 },
  { id: "london", name: "London", faName: "لندن", tz: "Europe/London", open: 8, close: 17 },
  { id: "newyork", name: "New York", faName: "نیویورک", tz: "America/New_York", open: 8, close: 17 },
] as const;

export type SessionId = (typeof SESSIONS)[number]["id"];

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "numeric", weekday: "short", hour12: false }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")) % 24, minute: Number(get("minute")), weekday: get("weekday") };
}

/** Forex is closed from Friday 17:00 to Sunday 17:00 New York time. */
export function isForexWeekend(date: Date): boolean {
  const { hour, weekday } = localParts(date, "America/New_York");
  return weekday === "Sat" || (weekday === "Fri" && hour >= 17) || (weekday === "Sun" && hour < 17);
}

export function sessionStatus(date: Date, session: (typeof SESSIONS)[number]) {
  const { hour, minute } = localParts(date, session.tz);
  const mins = hour * 60 + minute;
  const openM = session.open * 60;
  const closeM = session.close * 60;
  const open = !isForexWeekend(date) && mins >= openM && mins < closeM;
  const progress = open ? (mins - openM) / (closeM - openM) : 0;
  const minutesToChange = open ? closeM - mins : mins < openM ? openM - mins : 24 * 60 - mins + openM;
  return { open, progress, minutesToChange };
}

export function activeSessions(date: Date) {
  return SESSIONS.filter((s) => sessionStatus(date, s).open);
}
