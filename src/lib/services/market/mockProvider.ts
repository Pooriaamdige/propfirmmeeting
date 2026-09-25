import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { TIMEFRAME_SECONDS, type MarketDataProvider } from "./provider";

/**
 * DEVELOPMENT ONLY. Produces a deterministic, smoothly-evolving price path so the UI
 * can be built and demoed without API keys. Every response is flagged `isMock`, and the
 * UI labels it as demo data — it is never presented as live market data.
 */

const DAILY_VOL: Record<string, number> = { forex: 0.004, metal: 0.009, crypto: 0.025, index: 0.003 };

function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function seedOf(symbol: string): number {
  let h = 0;
  for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return h;
}

function priceAt(symbol: SymbolCode, tSec: number): number {
  const meta = SYMBOLS[symbol];
  const vol = DAILY_VOL[meta.assetClass];
  const s = seedOf(symbol);
  const x =
    vol * 2.2 * Math.sin(tSec / (5 * 86400) + s) +
    vol * 1.4 * Math.sin(tSec / (37 * 3600) + s * 1.7) +
    vol * 0.8 * Math.sin(tSec / (6 * 3600) + s * 0.3) +
    vol * 0.3 * Math.sin(tSec / (47 * 60) + s * 2.1) +
    vol * 0.12 * Math.sin(tSec / (7 * 60) + s) +
    vol * 0.05 * (hash(Math.floor(tSec / 60) + s) - 0.5);
  return meta.mockAnchor * Math.exp(x);
}

function candleAt(symbol: SymbolCode, start: number, step: number, now: number): Candle {
  const end = Math.min(start + step, now);
  const samples = 8;
  let high = -Infinity;
  let low = Infinity;
  for (let i = 0; i <= samples; i++) {
    const p = priceAt(symbol, start + ((end - start) * i) / samples);
    high = Math.max(high, p);
    low = Math.min(low, p);
  }
  const open = priceAt(symbol, start);
  const close = priceAt(symbol, end);
  const wick = (high - low) * 0.15 * hash(start + seedOf(symbol));
  return { time: start, open, high: high + wick, low: low - wick, close };
}

export const mockProvider: MarketDataProvider = {
  name: "Mock (development)",
  isMock: true,
  async getQuotes(symbols) {
    const now = Math.floor(Date.now() / 1000);
    return symbols.map((symbol): Quote => {
      const price = priceAt(symbol, now);
      const prev = priceAt(symbol, now - 86400);
      let high = -Infinity;
      let low = Infinity;
      for (let t = now - 86400; t <= now; t += 900) {
        const p = priceAt(symbol, t);
        high = Math.max(high, p);
        low = Math.min(low, p);
      }
      const isCrypto = SYMBOLS[symbol].assetClass === "crypto";
      return {
        symbol,
        price,
        change: price - prev,
        changePercent: ((price - prev) / prev) * 100,
        high: Math.max(high, price),
        low: Math.min(low, price),
        volume: isCrypto ? Math.round(20000 + hash(Math.floor(now / 3600)) * 15000) : null,
        timestamp: new Date(now * 1000).toISOString(),
      };
    });
  },
  async getCandles(symbol, timeframe: Timeframe, limit) {
    const step = TIMEFRAME_SECONDS[timeframe];
    const now = Math.floor(Date.now() / 1000);
    const last = Math.floor(now / step) * step;
    const out: Candle[] = [];
    for (let i = limit - 1; i >= 0; i--) out.push(candleAt(symbol, last - i * step, step, now));
    return out;
  },
};
