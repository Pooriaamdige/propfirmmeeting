import "server-only";
import type { Candle, DataEnvelope, Quote, SymbolCode, Timeframe } from "@/lib/types";
import { cached } from "@/lib/cache";
import { ServiceUnavailableError } from "@/lib/services/errors";
import type { MarketDataProvider } from "./market/provider";
import { mockProvider } from "./market/mockProvider";
import { liveProvider } from "./market/liveProvider";

/**
 * Market data service. The UI talks only to `/api/market/*`, which calls these
 * functions — never to a provider directly.
 *
 * MARKET_DATA_PROVIDER=live (default) uses real providers with automatic fallback;
 * MARKET_DATA_PROVIDER=mock is for offline development only and is labelled as demo data.
 */
function provider(): MarketDataProvider {
  return process.env.MARKET_DATA_PROVIDER === "mock" ? mockProvider : liveProvider;
}

/** Seconds the server reuses a quote batch; one upstream call serves every visitor. */
const QUOTE_TTL = Number(process.env.MARKET_QUOTE_TTL_SECONDS ?? 5) * 1000;

const sourcesOf = (quotes: Quote[]) => [...new Set(quotes.map((q) => q.source).filter(Boolean))].join(" + ");

export async function getMarketQuotes(symbols: SymbolCode[]): Promise<DataEnvelope<Quote[]>> {
  const p = provider();
  const key = `quotes:${p.name}:${[...symbols].sort().join(",")}`;
  try {
    return await cached(
      key,
      p.isMock ? 2_000 : QUOTE_TTL,
      async () => {
        const data = await p.getQuotes(symbols);
        return { data, source: sourcesOf(data) || p.name, isMock: p.isMock, fetchedAt: new Date().toISOString() };
      },
      60_000,
    );
  } catch (err) {
    throw err instanceof ServiceUnavailableError ? err : new ServiceUnavailableError("market", String(err));
  }
}

export async function getMarketChart(symbol: SymbolCode, timeframe: Timeframe, limit = 240): Promise<DataEnvelope<Candle[]>> {
  const p = provider();
  const ttl = p.isMock ? 5_000 : timeframe === "1m" ? 15_000 : timeframe === "5m" ? 30_000 : 60_000;
  try {
    return await cached(`chart:${p.name}:${symbol}:${timeframe}:${limit}`, ttl, async () => {
      const { candles, source } = await p.getCandles(symbol, timeframe, limit);
      return { data: candles, source, isMock: p.isMock, fetchedAt: new Date().toISOString() };
    });
  } catch (err) {
    throw err instanceof ServiceUnavailableError ? err : new ServiceUnavailableError("market", String(err));
  }
}

export interface OverviewItem {
  quote: Quote;
  spark: number[];
}

/** Quotes plus a 24h sparkline (hourly closes) for each symbol. */
export async function getMarketOverview(symbols: SymbolCode[]): Promise<DataEnvelope<OverviewItem[]>> {
  const quotes = await getMarketQuotes(symbols);
  const sparks = await Promise.allSettled(quotes.data.map((q) => getMarketChart(q.symbol, "1h", 24)));
  return {
    ...quotes,
    data: quotes.data.map((quote, i) => {
      const s = sparks[i];
      return { quote, spark: s.status === "fulfilled" ? s.value.data.map((c) => c.close) : [] };
    }),
  };
}
