import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";

export interface MarketDataProvider {
  name: string;
  isMock: boolean;
  getQuotes(symbols: SymbolCode[]): Promise<Quote[]>;
  getCandles(symbol: SymbolCode, timeframe: Timeframe, limit: number): Promise<{ candles: Candle[]; source: string }>;
}

/** One upstream (Twelve Data, Yahoo, Binance, …). */
export interface MarketSource {
  name: string;
  supports(symbol: SymbolCode): boolean;
  /** Missing symbols are simply omitted from the result. */
  getQuotes(symbols: SymbolCode[]): Promise<Quote[]>;
  getCandles(symbol: SymbolCode, timeframe: Timeframe, limit: number): Promise<Candle[]>;
}

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

/** Aggregate candles into a larger bucket (e.g. 1h → 4h) aligned to UTC. */
export function aggregate(candles: Candle[], bucketSeconds: number): Candle[] {
  const out: Candle[] = [];
  for (const c of candles) {
    const t = Math.floor(c.time / bucketSeconds) * bucketSeconds;
    const last = out[out.length - 1];
    if (last && last.time === t) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
    } else out.push({ time: t, open: c.open, high: c.high, low: c.low, close: c.close });
  }
  return out;
}
