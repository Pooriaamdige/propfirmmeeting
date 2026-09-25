import { getMarketChart } from "@/lib/services/marketService";
import { isSymbol } from "@/lib/symbols";
import { fail, ok } from "@/lib/api";
import type { Timeframe } from "@/lib/types";

export const dynamic = "force-dynamic";
const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const symbol = sp.get("symbol");
  const tf = (sp.get("tf") ?? "15m") as Timeframe;
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 240, 20), 500);
  if (!isSymbol(symbol) || !TIMEFRAMES.includes(tf)) return Response.json({ error: "bad_request", message: "پارامتر نامعتبر است." }, { status: 400 });
  try {
    return ok(await getMarketChart(symbol, tf, limit), tf === "1m" ? 15 : 30);
  } catch (err) {
    return fail(err, "دریافت نمودار با مشکل مواجه شد.");
  }
}
