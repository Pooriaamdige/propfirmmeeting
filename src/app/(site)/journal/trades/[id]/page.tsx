import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user-session";
import { getAccount, getTrade, getUserVocabulary } from "@/lib/journal/service";
import { TradeForm } from "@/components/journal/TradeForm";
import { Crumbs } from "@/components/journal/ui";
import { ConfirmButton } from "@/components/admin/client";
import { Icon } from "@/components/ui/Icon";
import { deleteTradeAction } from "../../actions";

export const metadata: Metadata = { title: "ویرایش معامله", robots: { index: false } };

export default async function EditTradePage({ params }: PageProps<"/journal/trades/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/journal/trades/${id}/`);
  const t = await getTrade(user.id, Number(id));
  if (!t) notFound();
  const a = await getAccount(user.id, t.accountId);
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Crumbs items={[{ href: "/journal/", label: "ژورنال" }, { href: `/journal/accounts/${a.id}/?tab=trades`, label: a.name }, { label: `${t.symbol} #${t.id}` }]} />
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">ویرایش معامله</h1>
        <ConfirmButton action={deleteTradeAction} id={t.id} message="این معامله حذف شود؟">
          <Icon name="trash" size={14} /> حذف معامله
        </ConfirmButton>
      </div>
      <TradeForm
        accountId={a.id}
        currency={a.currency}
        vocabulary={await getUserVocabulary(user.id)}
        value={{ id: t.id, symbol: t.symbol, side: t.side === "sell" ? "sell" : "buy", openedAt: t.openedAt.toISOString(), closedAt: t.closedAt?.toISOString() ?? null, entryPrice: t.entryPrice, exitPrice: t.exitPrice, lots: t.lots, stopLoss: t.stopLoss, takeProfit: t.takeProfit, profit: t.profit, commission: t.commission, swap: t.swap, pips: t.pips, riskAmount: t.riskAmount, setup: t.setup, tags: t.tags, mistakes: t.mistakes, emotion: t.emotion, rating: t.rating, notes: t.notes, screenshotUrl: t.screenshotUrl }}
      />
    </div>
  );
}
