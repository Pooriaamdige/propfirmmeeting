import { getCurrentUser } from "@/lib/auth/user-session";
import { getAccount, getTrades } from "@/lib/journal/service";
import { toCsv } from "@/lib/journal/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: RouteContext<"/journal/accounts/[id]/export">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const account = await getAccount(user.id, Number(id));
  if (!account) return new Response("Not found", { status: 404 });

  const template = new URL(req.url).searchParams.get("template") === "1";
  const trades = template ? [] : await getTrades(user.id, account.id);
  const rows = template
    ? [{ symbol: "XAUUSD", side: "buy", opened_at: "2026-10-01 10:05", closed_at: "2026-10-01 12:40", entry_price: 2650.1, exit_price: 2661.4, lots: 0.5, stop_loss: 2644, take_profit: 2665, profit: 565, commission: 3.5, swap: 0, pips: "", risk_amount: "", setup: "Breakout", tags: "London|Trend", mistakes: "", emotion: "calm", rating: 4, notes: "" }]
    : trades.reverse().map((t) => ({
        symbol: t.symbol,
        side: t.side,
        opened_at: t.openedAt.toISOString(),
        closed_at: t.closedAt?.toISOString() ?? "",
        entry_price: t.entryPrice,
        exit_price: t.exitPrice ?? "",
        lots: t.lots,
        stop_loss: t.stopLoss ?? "",
        take_profit: t.takeProfit ?? "",
        profit: t.profit ?? "",
        commission: t.commission,
        swap: t.swap,
        pips: t.pips ?? "",
        risk_amount: t.riskAmount ?? "",
        setup: t.setup,
        tags: t.tags.join("|"),
        mistakes: t.mistakes.join("|"),
        emotion: t.emotion,
        rating: t.rating ?? "",
        notes: t.notes,
      }));
  const name = template ? "journal-template" : `journal-${account.id}-${new Date().toISOString().slice(0, 10)}`;
  return new Response("﻿" + toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" } });
}
