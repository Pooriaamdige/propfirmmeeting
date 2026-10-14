/**
 * Trading-journal analytics (Myfxbook-style statistics + prop firm rule tracking).
 *
 * Pure and dependency-free on purpose: it runs on the server for the dashboard and is
 * unit-tested directly with `node --test` (see tests/journal-analytics.test.ts).
 *
 * Conventions
 * - Net P/L of a trade = profit − commission + swap (commission is entered as a positive cost).
 * - Only closed trades count towards performance; open trades are reported separately.
 * - Balance is built from closed trades and deposits/withdrawals (manual journals have no
 *   floating equity), so drawdowns are closed-balance drawdowns.
 * - Gain % is time-weighted (deposits and withdrawals don't distort it), like Myfxbook.
 */

export type Side = "buy" | "sell";

export interface JTrade {
  id: number;
  symbol: string;
  side: Side;
  openedAt: string; // ISO
  closedAt: string | null;
  entryPrice: number;
  exitPrice: number | null;
  lots: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number | null;
  commission: number;
  swap: number;
  pips: number | null;
  riskAmount: number | null;
  setup: string;
  tags: string[];
  mistakes: string[];
  emotion: string;
  rating: number | null;
}

export interface JTransaction {
  type: "deposit" | "withdrawal";
  amount: number;
  at: string; // ISO
}

export interface JRules {
  dailyDrawdownPct: number | null;
  maxDrawdownPct: number | null;
  maxDrawdownType: "static" | "trailing";
  profitTargetPct: number | null;
  minTradingDays: number | null;
  consistencyPct: number | null;
  /** IANA timezone of the firm's daily reset (broker server day). */
  resetTz?: string;
}

export interface JAccount {
  initialBalance: number;
  startedAt: string; // YYYY-MM-DD or ISO
  rules: JRules | null;
}

export interface Bucket {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number; // 0..100
  net: number;
  pips: number;
  avg: number;
}

export interface CurvePoint {
  time: number; // unix seconds
  balance: number;
  /** Time-weighted growth index, starts at 100. */
  index: number;
  /** Drawdown from the running peak of the index, in % (≤ 0). */
  drawdownPct: number;
}

export interface RuleCheck {
  id: "profitTarget" | "dailyLoss" | "maxLoss" | "minDays" | "consistency";
  status: "ok" | "warning" | "breached" | "passed" | "pending";
  /** Progress toward a target or usage of a limit, 0..100+. */
  progress: number;
  current: number;
  limit: number;
  detail?: string;
}

export interface JournalStats {
  currency: string;
  trades: { total: number; closed: number; open: number; wins: number; losses: number; breakeven: number };
  balance: number;
  deposits: number;
  withdrawals: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  commission: number;
  swap: number;
  gainPct: number;
  absGainPct: number;
  maxDrawdownPct: number;
  maxDrawdownAmount: number;
  winRate: number;
  lossRate: number;
  profitFactor: number | null; // null = no losses
  avgWin: number;
  avgLoss: number;
  payoffRatio: number | null;
  expectancy: number;
  avgWinPips: number;
  avgLossPips: number;
  totalPips: number;
  totalLots: number;
  bestTrade: { id: number; net: number; pips: number | null } | null;
  worstTrade: { id: number; net: number; pips: number | null } | null;
  longs: { trades: number; winRate: number; net: number };
  shorts: { trades: number; winRate: number; net: number };
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxConsecutiveProfit: number;
  maxConsecutiveLoss: number;
  avgHoldMinutes: number;
  avgHoldWinMinutes: number;
  avgHoldLossMinutes: number;
  sharpe: number | null;
  ahpr: number;
  ghpr: number;
  stdDevReturnPct: number;
  zScore: number | null;
  kellyPct: number | null;
  recoveryFactor: number | null;
  tradingDays: number;
  avgR: number | null;
  totalR: number | null;
  rTrades: number;
  rDistribution: Bucket[];
  curve: CurvePoint[];
  daily: { day: string; net: number; trades: number }[];
  monthly: { month: string; net: number; gainPct: number; trades: number }[];
  bySymbol: Bucket[];
  bySetup: Bucket[];
  byTag: Bucket[];
  byMistake: Bucket[];
  byEmotion: Bucket[];
  bySession: Bucket[];
  byWeekday: Bucket[];
  byHour: Bucket[];
  byDuration: Bucket[];
  byRating: Bucket[];
  rules: RuleCheck[] | null;
  ruleStatus: "passed" | "breached" | "in-progress" | null;
}

/* ------------------------------------------------------------------ */

export const netOf = (t: Pick<JTrade, "profit" | "commission" | "swap">) => (t.profit ?? 0) - (t.commission ?? 0) + (t.swap ?? 0);

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
const ts = (iso: string) => Math.floor(Date.parse(iso) / 1000);

/** YYYY-MM-DD of an instant in a timezone. */
export function dayIn(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function partsIn(iso: string, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date(iso));
  return { weekday: p.find((x) => x.type === "weekday")?.value ?? "", hour: Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24 };
}

/** Forex session by opening time (UTC hours; overlaps are counted as their own bucket). */
export function sessionOf(iso: string): string {
  const h = new Date(iso).getUTCHours();
  const london = h >= 7 && h < 16;
  const ny = h >= 12 && h < 21;
  if (london && ny) return "london-ny";
  if (london) return "london";
  if (ny) return "newyork";
  return "asia";
}

function bucketize(trades: JTrade[], keysOf: (t: JTrade) => string[], order?: string[]): Bucket[] {
  const map = new Map<string, JTrade[]>();
  for (const t of trades) for (const k of keysOf(t)) if (k) map.set(k, [...(map.get(k) ?? []), t]);
  const out = [...map.entries()].map(([key, ts]): Bucket => {
    const nets = ts.map(netOf);
    const wins = nets.filter((n) => n > 0).length;
    const losses = nets.filter((n) => n < 0).length;
    const net = nets.reduce((a, b) => a + b, 0);
    return { key, trades: ts.length, wins, losses, winRate: ts.length ? round((wins / ts.length) * 100, 1) : 0, net: round(net), pips: round(ts.reduce((a, t) => a + (t.pips ?? 0), 0), 1), avg: round(net / ts.length) };
  });
  if (order) return order.map((k) => out.find((b) => b.key === k) ?? { key: k, trades: 0, wins: 0, losses: 0, winRate: 0, net: 0, pips: 0, avg: 0 });
  return out.sort((a, b) => b.trades - a.trades || b.net - a.net);
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DURATIONS: [string, number][] = [
  ["<5m", 5],
  ["5-30m", 30],
  ["30m-2h", 120],
  ["2-8h", 480],
  ["8-24h", 1440],
  ["1-3d", 4320],
  [">3d", Infinity],
];
/** Losing buckets include their lower edge (a full stop is exactly −1R); winning buckets include their lower edge too. */
const R_BUCKETS: [string, (r: number) => boolean][] = [
  ["≤-2R", (r) => r <= -2],
  ["-2R…-1R", (r) => r > -2 && r <= -1],
  ["-1R…0", (r) => r > -1 && r < 0],
  ["0…1R", (r) => r >= 0 && r < 1],
  ["1R…2R", (r) => r >= 1 && r < 2],
  ["2R…3R", (r) => r >= 2 && r < 3],
  ["≥3R", (r) => r >= 3],
];

/** Wald–Wolfowitz runs test on win/loss sequence (Myfxbook "Z-Score"). */
export function zScore(results: boolean[]): number | null {
  const n = results.length;
  if (n < 3) return null;
  const w = results.filter(Boolean).length;
  const l = n - w;
  if (w === 0 || l === 0) return null;
  let runs = 1;
  for (let i = 1; i < n; i++) if (results[i] !== results[i - 1]) runs++;
  const x = 2 * w * l;
  const denom = Math.sqrt((x * (x - n)) / (n - 1));
  if (!denom) return null;
  return (n * (runs - 0.5) - x) / denom;
}

/* ------------------------------------------------------------------ */

export function computeStats(account: JAccount, allTrades: JTrade[], transactions: JTransaction[], opts: { currency?: string; timeZone?: string } = {}): JournalStats {
  const tz = opts.timeZone ?? "Asia/Tehran";
  const resetTz = account.rules?.resetTz ?? "Europe/Athens";
  const closed = allTrades.filter((t) => t.closedAt).sort((a, b) => Date.parse(a.closedAt!) - Date.parse(b.closedAt!));
  const open = allTrades.filter((t) => !t.closedAt);
  const nets = closed.map(netOf);

  const deposits = transactions.filter((t) => t.type === "deposit").reduce((a, t) => a + t.amount, 0);
  const withdrawals = transactions.filter((t) => t.type === "withdrawal").reduce((a, t) => a + t.amount, 0);
  const netProfit = nets.reduce((a, b) => a + b, 0);
  const balance = account.initialBalance + deposits - withdrawals + netProfit;

  /* ---- balance curve + time-weighted index ---- */
  type Ev = { time: number; kind: "trade" | "cash"; amount: number };
  const events: Ev[] = [
    ...closed.map((t, i) => ({ time: ts(t.closedAt!), kind: "trade" as const, amount: nets[i] })),
    ...transactions.map((t) => ({ time: ts(t.at), kind: "cash" as const, amount: t.type === "deposit" ? t.amount : -t.amount })),
  ].sort((a, b) => a.time - b.time || (a.kind === "cash" ? -1 : 1));

  const startTime = ts(account.startedAt.length === 10 ? `${account.startedAt}T00:00:00Z` : account.startedAt);
  let bal = account.initialBalance;
  let index = 100;
  let peakIndex = 100;
  let maxDDPct = 0;
  let cum = 0;
  let peakCum = 0;
  let maxDDAmount = 0;
  const returns: number[] = []; // per-trade return fraction
  const curve: CurvePoint[] = [{ time: Math.min(startTime, events[0]?.time ?? startTime), balance: bal, index, drawdownPct: 0 }];
  for (const e of events) {
    if (e.kind === "trade") {
      const r = bal > 0 ? e.amount / bal : 0;
      returns.push(r);
      index *= 1 + r;
      cum += e.amount;
      peakCum = Math.max(peakCum, cum);
      maxDDAmount = Math.max(maxDDAmount, peakCum - cum);
    }
    bal += e.amount;
    peakIndex = Math.max(peakIndex, index);
    const dd = peakIndex > 0 ? ((index - peakIndex) / peakIndex) * 100 : 0;
    maxDDPct = Math.min(maxDDPct, dd);
    curve.push({ time: e.time, balance: round(bal), index: round(index, 4), drawdownPct: round(dd, 3) });
  }

  /* ---- win/loss stats ---- */
  const winsNet = nets.filter((n) => n > 0);
  const lossesNet = nets.filter((n) => n < 0);
  const grossProfit = winsNet.reduce((a, b) => a + b, 0);
  const grossLoss = lossesNet.reduce((a, b) => a + b, 0);
  const avgWin = mean(winsNet);
  const avgLoss = mean(lossesNet);
  const winPips = closed.filter((t, i) => nets[i] > 0 && t.pips != null).map((t) => t.pips!);
  const lossPips = closed.filter((t, i) => nets[i] < 0 && t.pips != null).map((t) => t.pips!);

  let best: JournalStats["bestTrade"] = null;
  let worst: JournalStats["worstTrade"] = null;
  closed.forEach((t, i) => {
    if (!best || nets[i] > best.net) best = { id: t.id, net: round(nets[i]), pips: t.pips };
    if (!worst || nets[i] < worst.net) worst = { id: t.id, net: round(nets[i]), pips: t.pips };
  });

  const sideStats = (side: Side) => {
    const idx = closed.map((t, i) => (t.side === side ? i : -1)).filter((i) => i >= 0);
    const w = idx.filter((i) => nets[i] > 0).length;
    return { trades: idx.length, winRate: idx.length ? round((w / idx.length) * 100, 1) : 0, net: round(idx.reduce((a, i) => a + nets[i], 0)) };
  };

  // streaks
  let cw = 0, cl = 0, mw = 0, ml = 0, cp = 0, cn = 0, mcp = 0, mcn = 0;
  for (const n of nets) {
    if (n > 0) {
      cw++; cp += n; cl = 0; cn = 0;
    } else if (n < 0) {
      cl++; cn += n; cw = 0; cp = 0;
    } else {
      cw = cl = 0; cp = cn = 0;
    }
    mw = Math.max(mw, cw); ml = Math.max(ml, cl); mcp = Math.max(mcp, cp); mcn = Math.min(mcn, cn);
  }

  // holding time
  const hold = (t: JTrade) => (Date.parse(t.closedAt!) - Date.parse(t.openedAt)) / 60000;
  const holds = closed.map(hold);

  // ratios
  const ahpr = mean(returns);
  const ghpr = returns.length ? Math.pow(returns.reduce((a, r) => a * (1 + r), 1), 1 / returns.length) - 1 : 0;
  const sd = std(returns);
  const winRate = closed.length ? (winsNet.length / closed.length) * 100 : 0;
  const payoff = lossesNet.length && winsNet.length ? avgWin / Math.abs(avgLoss) : null;
  const kelly = payoff ? (winRate / 100 - (1 - winRate / 100) / payoff) * 100 : null;

  // R multiples
  const rTrades = closed.map((t, i) => ({ t, r: t.riskAmount && t.riskAmount > 0 ? nets[i] / t.riskAmount : null })).filter((x): x is { t: JTrade; r: number } => x.r !== null);
  const rDistribution = R_BUCKETS.map(([key, inBucket]) => {
    const bs = bucketize(rTrades.filter((x) => inBucket(x.r)).map((x) => x.t), () => [key]);
    return bs[0] ?? { key, trades: 0, wins: 0, losses: 0, winRate: 0, net: 0, pips: 0, avg: 0 };
  });

  // daily / monthly (user timezone)
  const dailyMap = new Map<string, { net: number; trades: number }>();
  closed.forEach((t, i) => {
    const d = dayIn(t.closedAt!, tz);
    const cur = dailyMap.get(d) ?? { net: 0, trades: 0 };
    dailyMap.set(d, { net: cur.net + nets[i], trades: cur.trades + 1 });
  });
  const daily = [...dailyMap.entries()].sort().map(([day, v]) => ({ day, net: round(v.net), trades: v.trades }));

  const monthly: JournalStats["monthly"] = [];
  {
    let b = account.initialBalance;
    const byMonth = new Map<string, { net: number; growth: number; trades: number }>();
    for (const e of events) {
      const m = dayIn(new Date(e.time * 1000).toISOString(), tz).slice(0, 7);
      const cur = byMonth.get(m) ?? { net: 0, growth: 1, trades: 0 };
      if (e.kind === "trade") {
        cur.net += e.amount;
        cur.growth *= 1 + (b > 0 ? e.amount / b : 0);
        cur.trades++;
      }
      byMonth.set(m, cur);
      b += e.amount;
    }
    for (const [month, v] of [...byMonth.entries()].sort()) if (v.trades) monthly.push({ month, net: round(v.net), gainPct: round((v.growth - 1) * 100), trades: v.trades });
  }

  const tradingDays = new Set(allTrades.map((t) => dayIn(t.openedAt, resetTz))).size;

  const stats: JournalStats = {
    currency: opts.currency ?? "USD",
    trades: { total: allTrades.length, closed: closed.length, open: open.length, wins: winsNet.length, losses: lossesNet.length, breakeven: closed.length - winsNet.length - lossesNet.length },
    balance: round(balance),
    deposits: round(deposits),
    withdrawals: round(withdrawals),
    netProfit: round(netProfit),
    grossProfit: round(grossProfit),
    grossLoss: round(grossLoss),
    commission: round(closed.reduce((a, t) => a + (t.commission ?? 0), 0)),
    swap: round(closed.reduce((a, t) => a + (t.swap ?? 0), 0)),
    gainPct: round(index - 100),
    absGainPct: account.initialBalance + deposits > 0 ? round((netProfit / (account.initialBalance + deposits)) * 100) : 0,
    maxDrawdownPct: round(Math.abs(maxDDPct)),
    maxDrawdownAmount: round(maxDDAmount),
    winRate: round(winRate, 1),
    lossRate: closed.length ? round((lossesNet.length / closed.length) * 100, 1) : 0,
    profitFactor: grossLoss < 0 ? round(grossProfit / Math.abs(grossLoss)) : null,
    avgWin: round(avgWin),
    avgLoss: round(avgLoss),
    payoffRatio: payoff !== null ? round(payoff) : null,
    expectancy: closed.length ? round(netProfit / closed.length) : 0,
    avgWinPips: round(mean(winPips), 1),
    avgLossPips: round(mean(lossPips), 1),
    totalPips: round(closed.reduce((a, t) => a + (t.pips ?? 0), 0), 1),
    totalLots: round(closed.reduce((a, t) => a + t.lots, 0)),
    bestTrade: best,
    worstTrade: worst,
    longs: sideStats("buy"),
    shorts: sideStats("sell"),
    maxConsecutiveWins: mw,
    maxConsecutiveLosses: ml,
    maxConsecutiveProfit: round(mcp),
    maxConsecutiveLoss: round(mcn),
    avgHoldMinutes: round(mean(holds), 1),
    avgHoldWinMinutes: round(mean(closed.filter((_, i) => nets[i] > 0).map(hold)), 1),
    avgHoldLossMinutes: round(mean(closed.filter((_, i) => nets[i] < 0).map(hold)), 1),
    sharpe: sd > 0 ? round(ahpr / sd) : null,
    ahpr: round(ahpr * 100, 3),
    ghpr: round(ghpr * 100, 3),
    stdDevReturnPct: round(sd * 100, 3),
    zScore: (() => {
      const z = zScore(nets.filter((n) => n !== 0).map((n) => n > 0));
      return z === null ? null : round(z);
    })(),
    kellyPct: kelly !== null ? round(kelly, 1) : null,
    recoveryFactor: maxDDAmount > 0 ? round(netProfit / maxDDAmount) : null,
    tradingDays,
    avgR: rTrades.length ? round(mean(rTrades.map((x) => x.r))) : null,
    totalR: rTrades.length ? round(rTrades.reduce((a, x) => a + x.r, 0)) : null,
    rTrades: rTrades.length,
    rDistribution,
    curve,
    daily,
    monthly,
    bySymbol: bucketize(closed, (t) => [t.symbol.toUpperCase()]),
    bySetup: bucketize(closed, (t) => [t.setup.trim()]),
    byTag: bucketize(closed, (t) => t.tags),
    byMistake: bucketize(closed, (t) => t.mistakes).sort((a, b) => a.net - b.net),
    byEmotion: bucketize(closed, (t) => [t.emotion]),
    bySession: bucketize(closed, (t) => [sessionOf(t.openedAt)], ["asia", "london", "london-ny", "newyork"]),
    byWeekday: bucketize(closed, (t) => [partsIn(t.openedAt, tz).weekday], WEEKDAYS).filter((b, i) => i < 5 || b.trades > 0),
    byHour: bucketize(closed, (t) => [String(partsIn(t.openedAt, tz).hour)], Array.from({ length: 24 }, (_, h) => String(h))),
    byDuration: bucketize(closed, (t) => {
      const m = hold(t);
      return [DURATIONS.find(([, max]) => m < max)![0]];
    }, DURATIONS.map(([k]) => k)),
    byRating: bucketize(closed, (t) => (t.rating ? [String(t.rating)] : []), ["1", "2", "3", "4", "5"]),
    rules: null,
    ruleStatus: null,
  };

  if (account.rules) Object.assign(stats, propRules(account, closed, nets, transactions, resetTz));
  return stats;
}

/* ------------------------------------------------------------------ */
/* Prop firm rule tracking                                              */
/* ------------------------------------------------------------------ */

function propRules(account: JAccount, closed: JTrade[], nets: number[], transactions: JTransaction[], resetTz: string): Pick<JournalStats, "rules" | "ruleStatus"> {
  const r = account.rules!;
  const init = account.initialBalance;
  const cash = transactions.reduce((a, t) => a + (t.type === "deposit" ? t.amount : -t.amount), 0);
  const checks: RuleCheck[] = [];

  // Closed-balance path per broker day.
  const days = new Map<string, number>();
  let peak = init;
  let bal = init + cash;
  let breachedMax = false;
  // Static: floor fixed at initial − limit. Trailing: floor follows the peak balance by the
  // same amount and stops trailing once it reaches the initial balance (common prop rule).
  const ddAmount = (init * (r.maxDrawdownPct ?? 0)) / 100;
  const floorAt = (pk: number) => (r.maxDrawdownType === "trailing" ? Math.min(init, pk - ddAmount) : init - ddAmount);
  closed.forEach((t, i) => {
    const d = dayIn(t.closedAt!, resetTz);
    days.set(d, (days.get(d) ?? 0) + nets[i]);
    bal += nets[i];
    peak = Math.max(peak, bal);
    if (r.maxDrawdownPct) {
      if (bal <= floorAt(peak)) breachedMax = true;
    }
  });
  const profit = nets.reduce((a, b) => a + b, 0);

  if (r.profitTargetPct) {
    const target = (init * r.profitTargetPct) / 100;
    const progress = target > 0 ? (profit / target) * 100 : 0;
    checks.push({ id: "profitTarget", status: progress >= 100 ? "passed" : "pending", progress: round(Math.max(0, progress), 1), current: round(profit), limit: round(target) });
  }

  if (r.dailyDrawdownPct) {
    const limit = (init * r.dailyDrawdownPct) / 100;
    const worstDay = Math.min(0, ...days.values());
    const today = days.get(dayIn(new Date().toISOString(), resetTz)) ?? 0;
    const breached = -worstDay >= limit;
    const used = Math.max(0, -today);
    checks.push({
      id: "dailyLoss",
      status: breached ? "breached" : used / limit > 0.7 ? "warning" : "ok",
      progress: round((used / limit) * 100, 1),
      current: round(-today > 0 ? -today : 0),
      limit: round(limit),
      detail: `worst:${round(-worstDay)}`,
    });
  }

  if (r.maxDrawdownPct) {
    const floor = floorAt(peak);
    const room = bal - floor;
    const limit = ddAmount;
    const used = Math.max(0, limit - room);
    checks.push({ id: "maxLoss", status: breachedMax ? "breached" : used / limit > 0.7 ? "warning" : "ok", progress: round((used / limit) * 100, 1), current: round(room), limit: round(limit), detail: `floor:${round(floor)}` });
  }

  if (r.minTradingDays) {
    const n = new Set(closed.map((t) => dayIn(t.openedAt, resetTz))).size;
    checks.push({ id: "minDays", status: n >= r.minTradingDays ? "passed" : "pending", progress: round(Math.min(100, (n / r.minTradingDays) * 100), 1), current: n, limit: r.minTradingDays });
  }

  if (r.consistencyPct && profit > 0) {
    const bestDay = Math.max(0, ...days.values());
    const share = (bestDay / profit) * 100;
    checks.push({ id: "consistency", status: share > r.consistencyPct ? "warning" : "ok", progress: round(share, 1), current: round(share, 1), limit: r.consistencyPct });
  }

  const breached = checks.some((c) => c.status === "breached");
  const targetMet = checks.find((c) => c.id === "profitTarget")?.status === "passed";
  const daysMet = checks.find((c) => c.id === "minDays")?.status !== "pending";
  return { rules: checks, ruleStatus: breached ? "breached" : targetMet && daysMet ? "passed" : "in-progress" };
}
