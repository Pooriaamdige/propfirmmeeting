import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";
import { cached } from "@/lib/cache";
import { getJson } from "@/lib/services/http";
import type { MarketSource } from "../provider";

/**
 * OANDA v20 REST API — real-time spot forex and XAU/USD. A free demo ("practice")
 * account token is enough: https://www.oanda.com → open a demo account → Manage API Access.
 *
 *   OANDA_API_TOKEN   required
 *   OANDA_ACCOUNT_ID  optional (enables the single-request pricing endpoint)
 *   OANDA_ENV         practice (default) | live
 *
 * DXY is not an OANDA instrument, so it is computed from its six components with the
 * official ICE formula and labelled as calculated.
 */
const HOST = () => process.env.OANDA_API_BASE ?? (process.env.OANDA_ENV === "live" ? "https://api-fxtrade.oanda.com" : "https://api-fxpractice.oanda.com");
const token = () => process.env.OANDA_API_TOKEN ?? "";

const INSTRUMENT: Partial<Record<SymbolCode, string>> = {
  XAUUSD: "XAU_USD",
  EURUSD: "EUR_USD",
  GBPUSD: "GBP_USD",
  USDJPY: "USD_JPY",
  AUDUSD: "AUD_USD",
  USDCAD: "USD_CAD",
  USDCHF: "USD_CHF",
};

// ICE U.S. Dollar Index: 50.14348112 × EURUSD^-0.576 × USDJPY^0.136 × GBPUSD^-0.119 × USDCAD^0.091 × USDSEK^0.042 × USDCHF^0.036
const DXY_WEIGHTS: [string, number][] = [
  ["EUR_USD", -0.576],
  ["USD_JPY", 0.136],
  ["GBP_USD", -0.119],
  ["USD_CAD", 0.091],
  ["USD_SEK", 0.042],
  ["USD_CHF", 0.036],
];
const dxyFrom = (px: Record<string, number>) => DXY_WEIGHTS.reduce((acc, [inst, w]) => acc * Math.pow(px[inst], w), 50.14348112);

const GRAN: Record<Timeframe, string> = { "1m": "M1", "5m": "M5", "15m": "M15", "1h": "H1", "4h": "H4", "1d": "D" };

interface OCandle {
  complete: boolean;
  time: string; // UNIX seconds as string (Accept-Datetime-Format: UNIX)
  mid: { o: string; h: string; l: string; c: string };
}

const headers = () => ({ Authorization: `Bearer ${token()}`, "Accept-Datetime-Format": "UNIX" });
// Forex trading day boundary: 17:00 New York.
const DAY = "dailyAlignment=17&alignmentTimezone=America%2FNew_York";

async function candles(inst: string, gran: string, count: number): Promise<OCandle[]> {
  const json = await getJson<{ candles: OCandle[] }>(`${HOST()}/v3/instruments/${inst}/candles?price=M&granularity=${gran}&count=${count}&${DAY}`, { headers: headers() });
  return json.candles ?? [];
}

/** Current mid price per instrument. */
async function prices(insts: string[]): Promise<Record<string, { mid: number; time: number }>> {
  const out: Record<string, { mid: number; time: number }> = {};
  const account = process.env.OANDA_ACCOUNT_ID;
  if (account) {
    const json = await getJson<{ prices: { instrument: string; time: string; bids: { price: string }[]; asks: { price: string }[] }[] }>(
      `${HOST()}/v3/accounts/${account}/pricing?instruments=${insts.join("%2C")}`,
      { headers: headers() },
    );
    for (const p of json.prices) out[p.instrument] = { mid: (Number(p.bids[0].price) + Number(p.asks[0].price)) / 2, time: Number(p.time) };
    return out;
  }
  // Without an account id: the latest 5-second candle is effectively the live price.
  await Promise.all(
    insts.map(async (inst) => {
      const c = (await candles(inst, "S5", 1)).at(-1);
      if (c) out[inst] = { mid: Number(c.mid.c), time: Number(c.time) };
    }),
  );
  return out;
}

/** Today's high/low and the previous trading day's close (cached — changes slowly). */
async function daily(inst: string) {
  return cached(`oanda:daily:${inst}`, 5 * 60_000, async () => {
    const d = await candles(inst, "D", 2);
    const today = d.at(-1);
    const prev = d.length > 1 ? d[d.length - 2] : null;
    return { high: today ? Number(today.mid.h) : null, low: today ? Number(today.mid.l) : null, prevClose: prev ? Number(prev.mid.c) : today ? Number(today.mid.o) : null };
  });
}

export const oanda: MarketSource = {
  name: "OANDA",
  supports: (s) => !!token() && (!!INSTRUMENT[s] || s === "DXY"),
  async getQuotes(symbols) {
    const wantDxy = symbols.includes("DXY");
    const insts = new Set(symbols.flatMap((s) => (INSTRUMENT[s] ? [INSTRUMENT[s]!] : [])));
    if (wantDxy) DXY_WEIGHTS.forEach(([i]) => insts.add(i));
    const px = await prices([...insts]);
    const quotes: Quote[] = [];

    for (const symbol of symbols) {
      const inst = INSTRUMENT[symbol];
      if (!inst || !px[inst]) continue;
      const d = await daily(inst);
      const price = px[inst].mid;
      const prev = d.prevClose ?? price;
      quotes.push({
        symbol,
        price,
        change: price - prev,
        changePercent: prev ? ((price - prev) / prev) * 100 : 0,
        high: d.high !== null ? Math.max(d.high, price) : null,
        low: d.low !== null ? Math.min(d.low, price) : null,
        volume: null,
        timestamp: new Date(px[inst].time * 1000).toISOString(),
        source: "OANDA",
      });
    }

    if (wantDxy && DXY_WEIGHTS.every(([i]) => px[i])) {
      const now: Record<string, number> = {};
      const prev: Record<string, number> = {};
      for (const [i] of DXY_WEIGHTS) {
        now[i] = px[i].mid;
        const d = await daily(i);
        prev[i] = d.prevClose ?? px[i].mid;
      }
      const price = dxyFrom(now);
      const p0 = dxyFrom(prev);
      quotes.push({ symbol: "DXY", price, change: price - p0, changePercent: ((price - p0) / p0) * 100, high: null, low: null, volume: null, timestamp: new Date().toISOString(), source: "OANDA (DXY calculated)" });
    }
    return quotes;
  },
  async getCandles(symbol, tf, limit): Promise<Candle[]> {
    const inst = INSTRUMENT[symbol];
    if (inst) {
      return (await candles(inst, GRAN[tf], limit)).map((c) => ({ time: Math.floor(Number(c.time)), open: +c.mid.o, high: +c.mid.h, low: +c.mid.l, close: +c.mid.c }));
    }
    if (symbol === "DXY") {
      // Combine component closes per timestamp (approximation for OHLC: computed from each component's O/H/L/C).
      const series = await Promise.all(DXY_WEIGHTS.map(async ([i]) => [i, await candles(i, GRAN[tf], limit)] as const));
      const byTime = new Map<number, Record<string, OCandle>>();
      for (const [i, cs] of series) for (const c of cs) {
        const t = Math.floor(Number(c.time));
        byTime.set(t, { ...(byTime.get(t) ?? {}), [i]: c });
      }
      const out: Candle[] = [];
      for (const [t, parts] of [...byTime.entries()].sort((a, b) => a[0] - b[0])) {
        if (DXY_WEIGHTS.some(([i]) => !parts[i])) continue;
        const pick = (k: "o" | "c") => Object.fromEntries(DXY_WEIGHTS.map(([i]) => [i, Number(parts[i].mid[k])]));
        const o = dxyFrom(pick("o"));
        const c = dxyFrom(pick("c"));
        out.push({ time: t, open: o, close: c, high: Math.max(o, c), low: Math.min(o, c) });
      }
      return out.slice(-limit);
    }
    return [];
  },
};
