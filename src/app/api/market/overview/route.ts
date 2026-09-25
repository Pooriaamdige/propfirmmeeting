import { getMarketOverview } from "@/lib/services/marketService";
import { OVERVIEW_SYMBOLS, isSymbol } from "@/lib/symbols";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("symbols");
  const symbols = param ? param.split(",").filter(isSymbol) : OVERVIEW_SYMBOLS;
  try {
    return ok(await getMarketOverview([...new Set(symbols)].slice(0, 10)), 10);
  } catch (err) {
    return fail(err, "دریافت اطلاعات بازار با مشکل مواجه شد.");
  }
}
