"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/user-session";
import { getAccount } from "@/lib/journal/service";
import { accountSchema, tradeSchema, transactionSchema } from "@/lib/journal/schemas";
import { estimateProfit, estimateRisk, normalizeSymbol, pipsBetween } from "@/lib/journal/instruments";
import { mapRows, normalizeSide, parseCsv, parseDate } from "@/lib/journal/csv";

export type JournalState = { error?: string; fieldErrors?: Record<string, string[] | undefined>; ok?: boolean; message?: string; nonce?: number } | null;

const fail = (e: z.ZodError): JournalState => ({ error: "برخی فیلدها معتبر نیستند.", fieldErrors: z.flattenError(e).fieldErrors as Record<string, string[]> });

/* -------------------------------- Accounts -------------------------------- */

export async function saveAccountAction(_: JournalState, fd: FormData): Promise<JournalState> {
  const user = await requireUser();
  const id = Number(fd.get("id")) || null;
  const parsed = accountSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const a = parsed.data;
  const values = {
    name: a.name,
    type: a.type,
    firmId: a.firmId,
    firmName: a.firmName,
    broker: a.broker,
    platform: a.platform,
    currency: a.currency,
    initialBalance: a.initialBalance,
    startedAt: a.startedAt,
    rules: a.useRules
      ? { dailyDrawdownPct: a.dailyDrawdownPct, maxDrawdownPct: a.maxDrawdownPct, maxDrawdownType: a.maxDrawdownType, profitTargetPct: a.profitTargetPct, minTradingDays: a.minTradingDays, consistencyPct: a.consistencyPct, resetTz: a.resetTz }
      : null,
    updatedAt: new Date(),
  };
  const d = await db();
  let accountId = id;
  if (id) {
    if (!(await getAccount(user.id, id))) return { error: "حساب پیدا نشد." };
    await d.update(schema.journalAccounts).set(values).where(and(eq(schema.journalAccounts.id, id), eq(schema.journalAccounts.userId, user.id)));
  } else {
    const [row] = await d.insert(schema.journalAccounts).values({ ...values, userId: user.id }).returning({ id: schema.journalAccounts.id });
    accountId = row.id;
  }
  revalidatePath("/journal/");
  redirect(`/journal/accounts/${accountId}/`);
}

export async function deleteAccountAction(fd: FormData) {
  const user = await requireUser();
  const d = await db();
  await d.delete(schema.journalAccounts).where(and(eq(schema.journalAccounts.id, Number(fd.get("id"))), eq(schema.journalAccounts.userId, user.id)));
  redirect("/journal/");
}

export async function archiveAccountAction(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const acc = await getAccount(user.id, id);
  if (!acc) return;
  const d = await db();
  await d.update(schema.journalAccounts).set({ archived: !acc.archived }).where(eq(schema.journalAccounts.id, id));
  revalidatePath("/journal/");
}

/* --------------------------------- Trades --------------------------------- */

/** Fill pips / profit / risk from prices when the user left them empty. */
function enrich(t: z.infer<typeof tradeSchema>) {
  const symbol = normalizeSymbol(t.symbol);
  const pips = t.pips ?? (t.exitPrice !== null ? pipsBetween(symbol, t.side, t.entryPrice, t.exitPrice) : null);
  const profit = t.profit ?? (t.closedAt && t.exitPrice !== null ? estimateProfit(symbol, t.side, t.entryPrice, t.exitPrice, t.lots) : null);
  const riskAmount = t.riskAmount ?? (t.stopLoss !== null ? estimateRisk(symbol, t.entryPrice, t.stopLoss, t.lots) : null);
  return { ...t, symbol, pips, profit, riskAmount };
}

export async function saveTradeAction(_: JournalState, fd: FormData): Promise<JournalState> {
  const user = await requireUser();
  const id = Number(fd.get("id")) || null;
  const parsed = tradeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const account = await getAccount(user.id, parsed.data.accountId);
  if (!account) return { error: "حساب پیدا نشد." };
  const t = enrich(parsed.data);
  if (t.closedAt && t.profit === null) return { error: "برای این نماد محاسبه خودکار ممکن نیست؛ سود/زیان را وارد کنید.", fieldErrors: { profit: ["سود/زیان را وارد کنید"] } };
  const values = {
    accountId: account.id,
    symbol: t.symbol,
    side: t.side,
    openedAt: new Date(t.openedAt),
    closedAt: t.closedAt ? new Date(t.closedAt) : null,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    lots: t.lots,
    stopLoss: t.stopLoss,
    takeProfit: t.takeProfit,
    profit: t.profit,
    commission: t.commission,
    swap: t.swap,
    pips: t.pips,
    riskAmount: t.riskAmount,
    setup: t.setup,
    tags: t.tags,
    mistakes: t.mistakes,
    emotion: t.emotion,
    rating: t.rating,
    notes: t.notes,
    screenshotUrl: t.screenshotUrl,
    updatedAt: new Date(),
  };
  const d = await db();
  if (id) {
    const res = await d.update(schema.journalTrades).set(values).where(and(eq(schema.journalTrades.id, id), eq(schema.journalTrades.userId, user.id))).returning({ id: schema.journalTrades.id });
    if (res.length === 0) return { error: "معامله پیدا نشد." };
  } else {
    await d.insert(schema.journalTrades).values({ ...values, userId: user.id });
  }
  await d.update(schema.journalAccounts).set({ updatedAt: new Date() }).where(eq(schema.journalAccounts.id, account.id));
  revalidatePath(`/journal/accounts/${account.id}/`);
  if (fd.get("intent") === "another") return { ok: true, message: "معامله ثبت شد. معامله بعدی را وارد کن.", nonce: Date.now() };
  redirect(`/journal/accounts/${account.id}/?tab=trades&saved=1`);
}

export async function deleteTradeAction(fd: FormData) {
  const user = await requireUser();
  const d = await db();
  const [row] = await d.delete(schema.journalTrades).where(and(eq(schema.journalTrades.id, Number(fd.get("id"))), eq(schema.journalTrades.userId, user.id))).returning({ accountId: schema.journalTrades.accountId });
  if (row) redirect(`/journal/accounts/${row.accountId}/?tab=trades`);
}

/* ------------------------------ Transactions ------------------------------ */

export async function saveTransactionAction(_: JournalState, fd: FormData): Promise<JournalState> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const account = await getAccount(user.id, parsed.data.accountId);
  if (!account) return { error: "حساب پیدا نشد." };
  const d = await db();
  await d.insert(schema.journalTransactions).values({ ...parsed.data, at: new Date(parsed.data.at), userId: user.id });
  revalidatePath(`/journal/accounts/${account.id}/`);
  return { ok: true, message: "ثبت شد.", nonce: Date.now() };
}

export async function deleteTransactionAction(fd: FormData) {
  const user = await requireUser();
  const d = await db();
  const [row] = await d.delete(schema.journalTransactions).where(and(eq(schema.journalTransactions.id, Number(fd.get("id"))), eq(schema.journalTransactions.userId, user.id))).returning({ accountId: schema.journalTransactions.accountId });
  if (row) revalidatePath(`/journal/accounts/${row.accountId}/`);
}

/* ------------------------------- CSV import ------------------------------- */

const MAX_IMPORT = 5000;

export async function importTradesAction(_: JournalState, fd: FormData): Promise<JournalState> {
  const user = await requireUser();
  const account = await getAccount(user.id, Number(fd.get("accountId")));
  if (!account) return { error: "حساب پیدا نشد." };
  const timeZone = String(fd.get("timeZone") || "UTC");
  const file = fd.get("file");
  let text = String(fd.get("text") ?? "");
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "حجم فایل بیش از ۵ مگابایت است." };
    text = await file.text();
  }
  if (!text.trim()) return { error: "فایل CSV یا متن آن را وارد کنید." };

  const { mapped, unknownHeaders } = mapRows(parseCsv(text));
  if (mapped.length === 0) return { error: "ردیفی برای وارد کردن پیدا نشد." };
  if (mapped.length > MAX_IMPORT) return { error: `حداکثر ${MAX_IMPORT.toLocaleString("fa-IR")} ردیف در هر بار.` };

  const errors: string[] = [];
  const rows: (typeof schema.journalTrades.$inferInsert)[] = [];
  for (const { line, values: v } of mapped) {
    const side = normalizeSide(v.side);
    if (!side) {
      if (v.side && /balance|deposit|credit|withdraw/i.test(v.side)) continue; // MT balance rows
      errors.push(`ردیف ${line}: نوع معامله (buy/sell) نامعتبر است`);
      continue;
    }
    const parsed = tradeSchema.safeParse({
      accountId: account.id,
      symbol: v.symbol ?? "",
      side,
      openedAt: parseDate(v.opened_at, timeZone) ?? "",
      closedAt: parseDate(v.closed_at, timeZone) ?? "",
      entryPrice: v.entry_price ?? "",
      exitPrice: v.exit_price ?? "",
      lots: v.lots ?? "",
      stopLoss: v.stop_loss && Number(v.stop_loss) !== 0 ? v.stop_loss : "",
      takeProfit: v.take_profit && Number(v.take_profit) !== 0 ? v.take_profit : "",
      profit: v.profit ?? "",
      commission: v.commission ?? "",
      swap: v.swap ?? "",
      pips: v.pips ?? "",
      riskAmount: v.risk_amount ?? "",
      setup: v.setup ?? "",
      tags: JSON.stringify((v.tags ?? "").split(/[|;،]/).map((s) => s.trim()).filter(Boolean)),
      mistakes: JSON.stringify((v.mistakes ?? "").split(/[|;،]/).map((s) => s.trim()).filter(Boolean)),
      emotion: v.emotion ?? "",
      rating: v.rating ?? "",
      notes: v.notes ?? "",
      screenshotUrl: "",
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      errors.push(`ردیف ${line}: ${issue.path.join(".")} — ${issue.message}`);
      continue;
    }
    const t = enrich(parsed.data);
    if (t.closedAt && t.profit === null) {
      errors.push(`ردیف ${line}: profit خالی است و برای ${t.symbol} قابل محاسبه نیست`);
      continue;
    }
    rows.push({
      userId: user.id,
      accountId: account.id,
      symbol: t.symbol,
      side: t.side,
      openedAt: new Date(t.openedAt),
      closedAt: t.closedAt ? new Date(t.closedAt) : null,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      lots: t.lots,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      profit: t.profit,
      commission: t.commission,
      swap: t.swap,
      pips: t.pips,
      riskAmount: t.riskAmount,
      setup: t.setup,
      tags: t.tags,
      mistakes: t.mistakes,
      emotion: t.emotion,
      rating: t.rating,
      notes: t.notes,
    });
  }

  if (rows.length === 0) return { error: `هیچ ردیف معتبری پیدا نشد. ${errors.slice(0, 3).join(" · ")}` };
  if (fd.get("dryRun") === "1") {
    return { ok: true, message: `${rows.length.toLocaleString("fa-IR")} ردیف معتبر${errors.length ? ` · ${errors.length.toLocaleString("fa-IR")} ردیف نامعتبر (${errors.slice(0, 3).join(" · ")})` : ""}${unknownHeaders.length ? ` · ستون‌های نادیده: ${unknownHeaders.join("، ")}` : ""}` };
  }
  const d = await db();
  for (let i = 0; i < rows.length; i += 500) await d.insert(schema.journalTrades).values(rows.slice(i, i + 500));
  await d.update(schema.journalAccounts).set({ updatedAt: new Date() }).where(eq(schema.journalAccounts.id, account.id));
  revalidatePath(`/journal/accounts/${account.id}/`);
  redirect(`/journal/accounts/${account.id}/?tab=trades&imported=${rows.length}&skipped=${errors.length}`);
}
