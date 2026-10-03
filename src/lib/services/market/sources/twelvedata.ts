import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { getJson } from "@/lib/services/http";
import type { MarketSource } from "../provider";

/** Twelve Data — spot forex, XAU/USD and DXY. Requires TWELVEDATA_API_KEY (paid plans recommended for frequent polling). */
const BASE = "https://api.twelvedata.com";
const INTERVAL: Record<Timeframe, string> = { "1m": "1min", "5m": "5min", "15m": "15min", "1h": "1h", "4h": "4h", "1d": "1day" };

interface TdQuote {
  close: string;
  change: string;
  percent_change: string;
  high: string;
  low: string;
  volume?: string;
  timestamp: number;
  status?: string;
  message?: string;
}

/**
 * Credit budget. Twelve Data charges 1 credit per symbol per request and returns
 * HTTP 429 when the per-minute allowance is exceeded (free plan: 8/min, 800/day).
 * We refuse calls that would exceed TWELVEDATA_CREDITS_PER_MINUTE so the next provider
 * (or the last cached value) is used instead of burning into 429s.
 */
const spent: number[] = [];
function takeCredits(n: number) {
  const limit = Number(process.env.TWELVEDATA_CREDITS_PER_MINUTE ?? 8);
  const now = Date.now();
  while (spent.length && now - spent[0] > 60_000) spent.shift();
  if (spent.length + n > limit) throw new Error(`Twelve Data credit budget (${limit}/min) reached`);
  for (let i = 0; i < n; i++) spent.push(now);
}

export const twelveData: MarketSource = {
  name: "Twelve Data",
  supports: (s) => !!SYMBOLS[s].twelveData && !!process.env.TWELVEDATA_API_KEY,
  async getQuotes(symbols) {
    const td = symbols.map((s) => SYMBOLS[s].twelveData!);
    takeCredits(td.length);
    const json = await getJson<TdQuote | Record<string, TdQuote> & { status?: string; message?: string }>(`${BASE}/quote?symbol=${encodeURIComponent(td.join(","))}&apikey=${process.env.TWELVEDATA_API_KEY}`);
    if ((json as TdQuote).status === "error") throw new Error((json as TdQuote).message ?? "Twelve Data error");
    const by: Record<string, TdQuote> = symbols.length === 1 ? { [td[0]]: json as TdQuote } : (json as Record<string, TdQuote>);
    return symbols.flatMap((symbol): Quote[] => {
      const q = by[SYMBOLS[symbol].twelveData!];
      if (!q || q.status === "error" || !q.close) return [];
      const vol = q.volume ? Number(q.volume) : 0;
      return [{ symbol, price: +q.close, change: +q.change, changePercent: +q.percent_change, high: +q.high, low: +q.low, volume: vol > 0 ? vol : null, timestamp: new Date(q.timestamp * 1000).toISOString(), source: "Twelve Data" }];
    });
  },
  async getCandles(symbol: SymbolCode, tf: Timeframe, limit: number): Promise<Candle[]> {
    takeCredits(1);
    const json = await getJson<{ status: string; message?: string; values?: { datetime: string; open: string; high: string; low: string; close: string }[] }>(
      `${BASE}/time_series?symbol=${encodeURIComponent(SYMBOLS[symbol].twelveData!)}&interval=${INTERVAL[tf]}&outputsize=${limit}&timezone=UTC&apikey=${process.env.TWELVEDATA_API_KEY}`,
    );
    if (json.status !== "ok" || !json.values) throw new Error(json.message ?? "Twelve Data time_series error");
    return json.values
      .map((v) => ({ time: Math.floor(Date.parse(v.datetime.length > 10 ? v.datetime.replace(" ", "T") + "Z" : v.datetime + "T00:00:00Z") / 1000), open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
      .reverse();
  },
};
