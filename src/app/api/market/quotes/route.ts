import { getMarketQuotes } from "@/lib/services/marketService";
import { ALL_SYMBOLS, isSymbol } from "@/lib/symbols";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("symbols");
  const symbols = param ? param.split(",").filter(isSymbol) : ALL_SYMBOLS;
  if (symbols.length === 0) return Response.json({ error: "bad_request", message: "نماد نامعتبر است." }, { status: 400 });
  try {
    return ok(await getMarketQuotes([...new Set(symbols)]), 5);
  } catch (err) {
    return fail(err, "اطلاعات لحظه‌ای موقتاً در دسترس نیست.");
  }
}
