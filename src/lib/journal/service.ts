import "server-only";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { computeStats, type JAccount, type JTrade, type JTransaction, type JournalStats } from "./analytics";

export type AccountRow = typeof schema.journalAccounts.$inferSelect;
export type TradeRow = typeof schema.journalTrades.$inferSelect;
export type TransactionRow = typeof schema.journalTransactions.$inferSelect;

export const toJTrade = (t: TradeRow): JTrade => ({
  id: t.id,
  symbol: t.symbol,
  side: t.side === "sell" ? "sell" : "buy",
  openedAt: t.openedAt.toISOString(),
  closedAt: t.closedAt?.toISOString() ?? null,
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
});

const toJTx = (t: TransactionRow): JTransaction => ({ type: t.type === "withdrawal" ? "withdrawal" : "deposit", amount: t.amount, at: t.at.toISOString() });
const toJAccount = (a: AccountRow): JAccount => ({ initialBalance: a.initialBalance, startedAt: a.startedAt, rules: a.rules ?? null });

export async function listAccounts(userId: number) {
  const d = await db();
  const accounts = await d.select().from(schema.journalAccounts).where(eq(schema.journalAccounts.userId, userId)).orderBy(asc(schema.journalAccounts.archived), desc(schema.journalAccounts.updatedAt));
  if (accounts.length === 0) return [];
  const ids = accounts.map((a) => a.id);
  const [trades, txs] = await Promise.all([
    d.select().from(schema.journalTrades).where(inArray(schema.journalTrades.accountId, ids)),
    d.select().from(schema.journalTransactions).where(inArray(schema.journalTransactions.accountId, ids)),
  ]);
  return accounts.map((a) => ({
    account: a,
    stats: computeStats(toJAccount(a), trades.filter((t) => t.accountId === a.id).map(toJTrade), txs.filter((t) => t.accountId === a.id).map(toJTx), { currency: a.currency }),
  }));
}

/** Owned account or null (never another user's). */
export async function getAccount(userId: number, id: number): Promise<AccountRow | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const d = await db();
  const [a] = await d.select().from(schema.journalAccounts).where(and(eq(schema.journalAccounts.id, id), eq(schema.journalAccounts.userId, userId)));
  return a ?? null;
}

export interface TradeFilters {
  from?: string; // YYYY-MM-DD
  to?: string;
  symbol?: string;
  side?: "buy" | "sell";
  setup?: string;
  status?: "open" | "closed" | "win" | "loss";
}

export async function getTrades(userId: number, accountId: number, f: TradeFilters = {}): Promise<TradeRow[]> {
  const d = await db();
  const conds = [eq(schema.journalTrades.userId, userId), eq(schema.journalTrades.accountId, accountId)];
  if (f.from) conds.push(gte(schema.journalTrades.openedAt, new Date(`${f.from}T00:00:00Z`)));
  if (f.to) conds.push(lte(schema.journalTrades.openedAt, new Date(`${f.to}T23:59:59Z`)));
  if (f.symbol) conds.push(eq(schema.journalTrades.symbol, f.symbol));
  if (f.side) conds.push(eq(schema.journalTrades.side, f.side));
  if (f.setup) conds.push(eq(schema.journalTrades.setup, f.setup));
  let rows = await d.select().from(schema.journalTrades).where(and(...conds)).orderBy(desc(schema.journalTrades.openedAt));
  if (f.status === "open") rows = rows.filter((t) => !t.closedAt);
  if (f.status === "closed") rows = rows.filter((t) => t.closedAt);
  if (f.status === "win") rows = rows.filter((t) => t.closedAt && (t.profit ?? 0) - t.commission + t.swap > 0);
  if (f.status === "loss") rows = rows.filter((t) => t.closedAt && (t.profit ?? 0) - t.commission + t.swap < 0);
  return rows;
}

export async function getTransactions(userId: number, accountId: number): Promise<TransactionRow[]> {
  const d = await db();
  return d.select().from(schema.journalTransactions).where(and(eq(schema.journalTransactions.userId, userId), eq(schema.journalTransactions.accountId, accountId))).orderBy(desc(schema.journalTransactions.at));
}

export async function getTrade(userId: number, id: number): Promise<TradeRow | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const d = await db();
  const [t] = await d.select().from(schema.journalTrades).where(and(eq(schema.journalTrades.id, id), eq(schema.journalTrades.userId, userId)));
  return t ?? null;
}

export async function accountStats(account: AccountRow, trades: TradeRow[], txs: TransactionRow[], timeZone = "Asia/Tehran"): Promise<JournalStats> {
  return computeStats(toJAccount(account), trades.map(toJTrade), txs.map(toJTx), { currency: account.currency, timeZone });
}

/** Distinct values the user has used before (for autocomplete). */
export async function getUserVocabulary(userId: number) {
  const d = await db();
  const rows = await d.select({ setup: schema.journalTrades.setup, tags: schema.journalTrades.tags, symbol: schema.journalTrades.symbol }).from(schema.journalTrades).where(eq(schema.journalTrades.userId, userId)).limit(2000);
  return {
    setups: [...new Set(rows.map((r) => r.setup).filter(Boolean))].slice(0, 50),
    tags: [...new Set(rows.flatMap((r) => r.tags))].slice(0, 50),
    symbols: [...new Set(rows.map((r) => r.symbol))].slice(0, 50),
  };
}
