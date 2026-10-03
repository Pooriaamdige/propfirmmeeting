import type { Candle, Quote, Timeframe } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { getJson } from "@/lib/services/http";
import { aggregate, type MarketSource } from "../provider";

/** Coinbase Exchange public API — crypto, no key. */
const BASE = "https://api.exchange.coinbase.com";
const GRAN: Record<Timeframe, { g: number; agg?: number }> = { "1m": { g: 60 }, "5m": { g: 300 }, "15m": { g: 900 }, "1h": { g: 3600 }, "4h": { g: 3600, agg: 14400 }, "1d": { g: 86400 } };

export const coinbase: MarketSource = {
  name: "Coinbase",
  supports: (s) => !!SYMBOLS[s].coinbase,
  async getQuotes(symbols) {
    const out = await Promise.all(
      symbols.map(async (symbol): Promise<Quote> => {
        const s = await getJson<{ open: string; high: string; low: string; last: string; volume: string }>(`${BASE}/products/${SYMBOLS[symbol].coinbase}/stats`);
        const price = +s.last;
        const open = +s.open;
        return { symbol, price, change: price - open, changePercent: open ? ((price - open) / open) * 100 : 0, high: +s.high, low: +s.low, volume: +s.volume, timestamp: new Date().toISOString(), source: "Coinbase" };
      }),
    );
    return out;
  },
  async getCandles(symbol, tf, limit): Promise<Candle[]> {
    const { g, agg } = GRAN[tf];
    const json = await getJson<[number, number, number, number, number, number][]>(`${BASE}/products/${SYMBOLS[symbol].coinbase}/candles?granularity=${g}`);
    const raw = json.map((k) => ({ time: k[0], low: k[1], high: k[2], open: k[3], close: k[4] })).reverse();
    return (agg ? aggregate(raw, agg) : raw).slice(-limit);
  },
};
