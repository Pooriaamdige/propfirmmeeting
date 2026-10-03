import type { Candle, Quote, SymbolCode, Timeframe } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { getJson } from "@/lib/services/http";
import { aggregate, type MarketSource } from "../provider";

/**
 * Yahoo Finance public chart API — no key. Near real-time for forex and crypto.
 * XAUUSD is served from COMEX gold futures (GC=F) and DXY from ICE (DX-Y.NYB); the
 * quote's `source` says so, because futures trade a few dollars away from spot.
 */
const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

interface ChartResponse {
  chart: {
    result?: {
      meta: { regularMarketPrice: number; chartPreviousClose?: number; previousClose?: number; regularMarketDayHigh?: number; regularMarketDayLow?: number; regularMarketVolume?: number; regularMarketTime: number };
      timestamp?: number[];
      indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[] }[] };
    }[];
    error?: { description: string } | null;
  };
}

async function chart(symbol: string, interval: string, range: string): Promise<NonNullable<ChartResponse["chart"]["result"]>[number]> {
  let lastErr: unknown;
  for (const host of HOSTS) {
    try {
      const json = await getJson<ChartResponse>(`${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`);
      const r = json.chart.result?.[0];
      if (!r) throw new Error(json.chart.error?.description ?? "Yahoo: empty result");
      return r;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function label(symbol: SymbolCode) {
  if (symbol === "XAUUSD") return "Yahoo Finance (COMEX Gold Futures)";
  if (symbol === "DXY") return "Yahoo Finance (ICE DX)";
  return "Yahoo Finance";
}

const TF: Record<Timeframe, { interval: string; range: string; agg?: number }> = {
  "1m": { interval: "1m", range: "1d" },
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "5d" },
  "1h": { interval: "60m", range: "1mo" },
  "4h": { interval: "60m", range: "3mo", agg: 14400 },
  "1d": { interval: "1d", range: "2y" },
};

export const yahoo: MarketSource = {
  name: "Yahoo Finance",
  supports: (s) => !!SYMBOLS[s].yahoo,
  async getQuotes(symbols) {
    const results = await Promise.allSettled(
      symbols.map(async (symbol): Promise<Quote> => {
        const r = await chart(SYMBOLS[symbol].yahoo!, "5m", "1d");
        const m = r.meta;
        const prev = m.chartPreviousClose ?? m.previousClose ?? m.regularMarketPrice;
        const isCrypto = SYMBOLS[symbol].assetClass === "crypto";
        return {
          symbol,
          price: m.regularMarketPrice,
          change: m.regularMarketPrice - prev,
          changePercent: prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0,
          high: m.regularMarketDayHigh ?? null,
          low: m.regularMarketDayLow ?? null,
          volume: isCrypto && m.regularMarketVolume ? m.regularMarketVolume : null,
          timestamp: new Date(m.regularMarketTime * 1000).toISOString(),
          source: label(symbol),
        };
      }),
    );
    const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    if (ok.length === 0 && results.length) throw (results[0] as PromiseRejectedResult).reason;
    return ok;
  },
  async getCandles(symbol, tf, limit) {
    const cfg = TF[tf];
    const r = await chart(SYMBOLS[symbol].yahoo!, cfg.interval, cfg.range);
    const q = r.indicators.quote[0];
    const raw: Candle[] = (r.timestamp ?? []).flatMap((t, i) => (q.open[i] == null || q.close[i] == null ? [] : [{ time: t, open: q.open[i]!, high: q.high[i]!, low: q.low[i]!, close: q.close[i]! }]));
    return (cfg.agg ? aggregate(raw, cfg.agg) : raw).slice(-limit);
  },
};
