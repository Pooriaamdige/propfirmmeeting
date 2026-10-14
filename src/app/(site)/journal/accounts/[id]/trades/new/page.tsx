import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user-session";
import { getAccount, getUserVocabulary } from "@/lib/journal/service";
import { TradeForm } from "@/components/journal/TradeForm";
import { Crumbs } from "@/components/journal/ui";

export const metadata: Metadata = { title: "ثبت معامله", robots: { index: false } };

export default async function NewTradePage({ params }: PageProps<"/journal/accounts/[id]/trades/new">) {
  const { id } = await params;
  const user = await requireUser(`/journal/accounts/${id}/trades/new/`);
  const a = await getAccount(user.id, Number(id));
  if (!a) notFound();
  const vocab = await getUserVocabulary(user.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Crumbs items={[{ href: "/journal/", label: "ژورنال" }, { href: `/journal/accounts/${a.id}/`, label: a.name }, { label: "ثبت معامله" }]} />
      <h1 className="mb-6 text-2xl font-black">ثبت معامله</h1>
      <TradeForm
        accountId={a.id}
        currency={a.currency}
        vocabulary={vocab}
        value={{ symbol: vocab.symbols[0] ?? "XAUUSD", side: "buy", openedAt: null, closedAt: null, entryPrice: null, exitPrice: null, lots: null, stopLoss: null, takeProfit: null, profit: null, commission: 0, swap: 0, pips: null, riskAmount: null, setup: "", tags: [], mistakes: [], emotion: "", rating: null, notes: "", screenshotUrl: null }}
      />
    </div>
  );
}
