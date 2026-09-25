import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { fetchJson, ServiceUnavailableError } from "@/lib/services/errors";
import type { MarketDataProvider } from "./provider";

/* ------------------------------ Twelve Data ------------------------------ */
// Forex, metals and the dollar index. Requires TWELVEDATA_API_KEY.

const TD_BASE = "https://api.twelvedata.com";
const TD_INTERVAL: Record<Timeframe, string> = { "1m": "1min", "5m": "5min", "15m": "15min", "1h": "1h", "4h": "4h", "1d": "1day" };

interface TdQuote {
  symbol: string;
  close: string;
  change: string;
  percent_change: string;
  high: string;
  low: string;
  volume?: string;
  timestamp: number;
  status?: string;
  code?: number;
  message?: string;
}

function tdKey(): string {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new ServiceUnavailableError("market", "TWELVEDATA_API_KEY is not configured");
  return key;
}

async function tdQuotes(symbols: SymbolCode[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  const tdSymbols = symbols.map((s) => SYMBOLS[s].twelveData!);
  const url = `${TD_BASE}/quote?symbol=${encodeURIComponent(tdSymbols.join(","))}&apikey=${tdKey()}`;
  const json = await fetchJson<TdQuote | Record<string, TdQuote>>(url);
  const bySymbol: Record<string, TdQuote> = symbols.length === 1 ? { [tdSymbols[0]]: json as TdQuote } : (json as Record<string, TdQuote>);

  return symbols.flatMap((symbol): Quote[] => {
    const q = bySymbol[SYMBOLS[symbol].twelveData!];
    if (!q || q.status === "error" || !q.close) return [];
    const volume = q.volume ? Number(q.volume) : null;
    return [
      {
        symbol,
        price: Number(q.close),
        change: Number(q.change),
        changePercent: Number(q.percent_change),
        high: Number(q.high),
        low: Number(q.low),
        volume: volume && volume > 0 ? volume : null,
        timestamp: new Date(q.timestamp * 1000).toISOString(),
      },
    ];
  });
}

async function tdCandles(symbol: SymbolCode, timeframe: Timeframe, limit: number): Promise<Candle[]> {
  const url = `${TD_BASE}/time_series?symbol=${encodeURIComponent(SYMBOLS[symbol].twelveData!)}&interval=${TD_INTERVAL[timeframe]}&outputsize=${limit}&timezone=UTC&apikey=${tdKey()}`;
  const json = await fetchJson<{ status: string; message?: string; values?: { datetime: string; open: string; high: string; low: string; close: string }[] }>(url);
  if (json.status !== "ok" || !json.values) throw new Error(json.message ?? "Twelve Data time_series error");
  return json.values
    .map((v) => ({
      time: Math.floor(Date.parse(v.datetime.replace(" ", "T") + (v.datetime.length > 10 ? "Z" : "T00:00:00Z")) / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }))
    .reverse();
}

/* -------------------------------- Binance -------------------------------- */
// Crypto via the public (key-less) Binance REST API. USDT pairs used as USD proxy.

const BN_BASE = "https://api.binance.com/api/v3";

async function bnQuotes(symbols: SymbolCode[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  const list = JSON.stringify(symbols.map((s) => SYMBOLS[s].binance));
  const json = await fetchJson<{ symbol: string; lastPrice: string; priceChange: string; priceChangePercent: string; highPrice: string; lowPrice: string; volume: string; closeTime: number }[]>(
    `${BN_BASE}/ticker/24hr?symbols=${encodeURIComponent(list)}`,
  );
  return symbols.flatMap((symbol): Quote[] => {
    const t = json.find((x) => x.symbol === SYMBOLS[symbol].binance);
    if (!t) return [];
    return [
      {
        symbol,
        price: Number(t.lastPrice),
        change: Number(t.priceChange),
        changePercent: Number(t.priceChangePercent),
        high: Number(t.highPrice),
        low: Number(t.lowPrice),
        volume: Number(t.volume),
        timestamp: new Date(t.closeTime).toISOString(),
      },
    ];
  });
}

async function bnCandles(symbol: SymbolCode, timeframe: Timeframe, limit: number): Promise<Candle[]> {
  const json = await fetchJson<[number, string, string, string, string][]>(`${BN_BASE}/klines?symbol=${SYMBOLS[symbol].binance}&interval=${timeframe}&limit=${limit}`);
  return json.map((k) => ({ time: Math.floor(k[0] / 1000), open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]) }));
}

/* ------------------------------- Composite ------------------------------- */

export const liveProvider: MarketDataProvider = {
  name: "Twelve Data + Binance",
  isMock: false,
  async getQuotes(symbols) {
    const crypto = symbols.filter((s) => SYMBOLS[s].binance);
    const rest = symbols.filter((s) => !SYMBOLS[s].binance);
    const results = await Promise.allSettled([tdQuotes(rest), bnQuotes(crypto)]);
    const quotes = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    if (quotes.length === 0) {
      const reason = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      throw new ServiceUnavailableError("market", String(reason?.reason ?? "No quotes returned"));
    }
    // Keep requested order.
    return symbols.flatMap((s) => quotes.filter((q) => q.symbol === s));
  },
  async getCandles(symbol, timeframe, limit) {
    return SYMBOLS[symbol].binance ? bnCandles(symbol, timeframe, limit) : tdCandles(symbol, timeframe, limit);
  },
};
