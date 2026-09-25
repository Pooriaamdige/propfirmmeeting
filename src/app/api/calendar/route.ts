import { getEconomicCalendar } from "@/lib/services/economicCalendarService";
import { fail, ok, parseTimeZone } from "@/lib/api";
import type { CalendarRange } from "@/lib/types";

export const dynamic = "force-dynamic";
const RANGES: CalendarRange[] = ["today", "tomorrow", "this-week", "next-week"];

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const range = (sp.get("range") ?? "today") as CalendarRange;
  if (!RANGES.includes(range)) return Response.json({ error: "bad_request", message: "بازه نامعتبر است." }, { status: 400 });
  try {
    return ok(await getEconomicCalendar(range, parseTimeZone(sp.get("tz"))), 120);
  } catch (err) {
    return fail(err, "دریافت تقویم اقتصادی با مشکل مواجه شد.");
  }
}
