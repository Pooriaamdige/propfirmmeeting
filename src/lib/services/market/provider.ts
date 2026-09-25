import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";

export interface MarketDataProvider {
  name: string;
  isMock: boolean;
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
