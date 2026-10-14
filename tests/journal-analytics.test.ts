import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStats, netOf, sessionOf, zScore, type JTrade } from "../src/lib/journal/analytics.ts";

let id = 0;
function trade(p: Partial<JTrade> & { profit: number; openedAt: string; closedAt?: string | null }): JTrade {
  return {
    id: ++id,
    symbol: "EURUSD",
    side: "buy",
    closedAt: p.closedAt === undefined ? p.openedAt.replace(/T(\d\d)/, (_, h) => `T${String(Math.min(23, Number(h) + 1)).padStart(2, "0")}`) : p.closedAt,
    entryPrice: 1.1,
    exitPrice: 1.101,
    lots: 1,
    stopLoss: null,
    takeProfit: null,
    commission: 0,
    swap: 0,
    pips: null,
    riskAmount: null,
    setup: "",
    tags: [],
    mistakes: [],
    emotion: "",
    rating: null,
    ...p,
  };
}

const account = { initialBalance: 10000, startedAt: "2026-09-01", rules: null };

test("net P/L subtracts commission and adds swap", () => {
  assert.equal(netOf({ profit: 100, commission: 7, swap: -2 }), 91);
  assert.equal(netOf({ profit: null, commission: 0, swap: 0 }), 0);
});

test("core win/loss statistics", () => {
  const trades = [
    trade({ profit: 200, pips: 20, openedAt: "2026-09-01T08:00:00Z" }),
    trade({ profit: -100, pips: -10, openedAt: "2026-09-02T08:00:00Z" }),
    trade({ profit: 300, pips: 30, openedAt: "2026-09-03T08:00:00Z", side: "sell" }),
    trade({ profit: -100, pips: -10, openedAt: "2026-09-04T08:00:00Z" }),
    trade({ profit: 0, openedAt: "2026-09-05T08:00:00Z", closedAt: null }), // open
  ];
  const s = computeStats(account, trades, []);
  assert.equal(s.trades.closed, 4);
  assert.equal(s.trades.open, 1);
  assert.equal(s.netProfit, 300);
  assert.equal(s.balance, 10300);
  assert.equal(s.winRate, 50);
  assert.equal(s.profitFactor, 2.5); // 500 / 200
  assert.equal(s.avgWin, 250);
  assert.equal(s.avgLoss, -100);
  assert.equal(s.payoffRatio, 2.5);
  assert.equal(s.expectancy, 75);
  assert.equal(s.totalPips, 30);
  assert.equal(s.longs.trades, 3);
  assert.equal(s.shorts.winRate, 100);
  assert.equal(s.bestTrade?.net, 300);
  assert.equal(s.worstTrade?.net, -100);
  assert.equal(s.maxConsecutiveWins, 1);
  assert.equal(s.maxConsecutiveLosses, 1);
  // Kelly = W − (1−W)/R = 0.5 − 0.5/2.5 = 0.3
  assert.equal(s.kellyPct, 30);
});

test("time-weighted gain ignores deposits; drawdown from the peak", () => {
  const trades = [
    trade({ profit: 1000, openedAt: "2026-09-01T08:00:00Z" }), // +10%
    trade({ profit: -2200, openedAt: "2026-09-03T08:00:00Z" }), // on 22000 → −10%
  ];
  const s = computeStats(account, trades, [{ type: "deposit", amount: 11000, at: "2026-09-02T00:00:00Z" }]);
  assert.equal(s.gainPct, -1); // 1.1 × 0.9 = 0.99
  assert.equal(s.maxDrawdownPct, 10);
  assert.equal(s.maxDrawdownAmount, 2200);
  assert.equal(s.balance, 10000 + 11000 + 1000 - 2200);
  assert.equal(s.absGainPct, round2((-1200 / 21000) * 100));
});

test("R-multiples from risk amount", () => {
  const s = computeStats(account, [trade({ profit: 300, riskAmount: 100, openedAt: "2026-09-01T08:00:00Z" }), trade({ profit: -100, riskAmount: 100, openedAt: "2026-09-02T08:00:00Z" })], []);
  assert.equal(s.avgR, 1);
  assert.equal(s.totalR, 2);
  assert.equal(s.rDistribution.find((b) => b.key === "≥3R")?.trades, 1);
  assert.equal(s.rDistribution.find((b) => b.key === "-2R…-1R")?.trades, 1); // a full stop is exactly −1R
});

test("prop rules: daily loss breach, static max loss, target, min days, consistency", () => {
  const rules = { dailyDrawdownPct: 5, maxDrawdownPct: 10, maxDrawdownType: "static" as const, profitTargetPct: 10, minTradingDays: 3, consistencyPct: 40, resetTz: "UTC" };
  const ok = computeStats({ ...account, rules }, [
    trade({ profit: 400, openedAt: "2026-09-01T08:00:00Z" }),
    trade({ profit: 300, openedAt: "2026-09-02T08:00:00Z" }),
    trade({ profit: 300, openedAt: "2026-09-03T08:00:00Z" }),
  ], []);
  assert.equal(ok.ruleStatus, "passed");
  assert.equal(ok.rules?.find((r) => r.id === "profitTarget")?.status, "passed");
  assert.equal(ok.rules?.find((r) => r.id === "consistency")?.current, 40);

  const breached = computeStats({ ...account, rules }, [
    trade({ profit: -300, openedAt: "2026-09-01T08:00:00Z" }),
    trade({ profit: -250, openedAt: "2026-09-01T10:00:00Z" }),
  ], []);
  assert.equal(breached.rules?.find((r) => r.id === "dailyLoss")?.status, "breached");
  assert.equal(breached.ruleStatus, "breached");
  assert.equal(breached.rules?.find((r) => r.id === "maxLoss")?.current, 450); // 9450 − 9000
});

test("trailing max loss stops trailing at the initial balance", () => {
  const rules = { dailyDrawdownPct: null, maxDrawdownPct: 5, maxDrawdownType: "trailing" as const, profitTargetPct: null, minTradingDays: null, consistencyPct: null, resetTz: "UTC" };
  const s = computeStats({ ...account, rules }, [trade({ profit: 1000, openedAt: "2026-09-01T08:00:00Z" }), trade({ profit: -400, openedAt: "2026-09-02T08:00:00Z" })], []);
  // peak 11000 → floor min(10000, 10500) = 10000; balance 10600 → room 600
  assert.equal(s.rules?.find((r) => r.id === "maxLoss")?.detail, "floor:10000");
  assert.equal(s.rules?.find((r) => r.id === "maxLoss")?.current, 600);
});

test("sessions and z-score", () => {
  assert.equal(sessionOf("2026-09-01T02:00:00Z"), "asia");
  assert.equal(sessionOf("2026-09-01T09:00:00Z"), "london");
  assert.equal(sessionOf("2026-09-01T13:00:00Z"), "london-ny");
  assert.equal(sessionOf("2026-09-01T18:00:00Z"), "newyork");
  // Alternating results → more runs than chance → positive Z (a win tends to be followed by a loss)
  assert.ok((zScore([true, false, true, false, true, false, true, false]) ?? 0) > 2);
  // Clustered results → fewer runs → negative Z
  assert.ok((zScore([true, true, true, true, false, false, false, false]) ?? 0) < -1.5);
  assert.equal(zScore([true, true]), null);
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

import { mapRows, parseCsv, parseDate } from "../src/lib/journal/csv.ts";

test("CSV: quotes, MT5 duplicate Time/Price columns, timezone-aware dates", () => {
  const rows = parseCsv('Time,Position,Symbol,Type,Volume,Price,S / L,T / P,Time,Price,Commission,Swap,Profit\n2026.09.30 10:00:00,1,EURUSD,buy,0.5,1.1000,1.0950,,2026.09.30 12:30:00,1.1040,-3.5,0,"200.00"\n');
  const { mapped } = mapRows(rows);
  const v = mapped[0].values;
  assert.equal(v.opened_at, "2026.09.30 10:00:00");
  assert.equal(v.closed_at, "2026.09.30 12:30:00");
  assert.equal(v.entry_price, "1.1000");
  assert.equal(v.exit_price, "1.1040");
  assert.equal(v.profit, "200.00");
  assert.equal(parseDate("2026.09.30 10:00:00", "Europe/Athens"), "2026-09-30T07:00:00.000Z");
  assert.equal(parseDate("2026-09-30T10:00:00Z", "Asia/Tehran"), "2026-09-30T10:00:00.000Z");
});
