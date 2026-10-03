import type { Quote, SymbolCode } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { ServiceUnavailableError } from "@/lib/services/errors";
import { isTripped, registerProvider, reportFailure, reportSuccess } from "@/lib/services/health";
import type { MarketDataProvider, MarketSource } from "./provider";
import { twelveData } from "./sources/twelvedata";
import { yahoo } from "./sources/yahoo";
import { binance } from "./sources/binance";
import { coinbase } from "./sources/coinbase";
import { oanda } from "./sources/oanda";
import { cached } from "@/lib/cache";

const SOURCES: Record<string, MarketSource> = { oanda, twelvedata: twelveData, yahoo, binance, coinbase };

/**
 * Ordered provider chains (comma-separated env, first = preferred):
 *   MARKET_FX_PROVIDERS     forex, gold, DXY   default: oanda,twelvedata,yahoo   (sources without credentials are skipped)
 *   MARKET_CRYPTO_PROVIDERS BTC, ETH           default: binance,coinbase,yahoo
 */
function chain(kind: "fx" | "crypto"): MarketSource[] {
  const env = kind === "fx" ? process.env.MARKET_FX_PROVIDERS : process.env.MARKET_CRYPTO_PROVIDERS;
  const names = (env ?? (kind === "fx" ? "oanda,twelvedata,yahoo" : "binance,coinbase,yahoo")).split(",").map((s) => s.trim().toLowerCase());
  return names.flatMap((n) => (SOURCES[n] ? [SOURCES[n]] : []));
}

for (const s of [...chain("fx"), ...chain("crypto")]) registerProvider(s.name, "market");

/** MARKET_FX_QUOTE_TTL_SECONDS (default 10, or 60 when only Twelve Data/Yahoo are available) · MARKET_CRYPTO_QUOTE_TTL_SECONDS (default 5) */
function groupTtl(kind: "fx" | "crypto") {
  if (kind === "crypto") return Number(process.env.MARKET_CRYPTO_QUOTE_TTL_SECONDS ?? 5) * 1000;
  const fallback = process.env.OANDA_API_TOKEN ? 10 : 60;
  return Number(process.env.MARKET_FX_QUOTE_TTL_SECONDS ?? fallback) * 1000;
}

const kindOf = (s: SymbolCode) => (SYMBOLS[s].assetClass === "crypto" ? "crypto" : "fx");

/** Try each source in order until every requested symbol has a quote. */
async function quotesFor(symbols: SymbolCode[], sources: MarketSource[]): Promise<{ quotes: Quote[]; errors: string[] }> {
  let pending = [...symbols];
  const quotes: Quote[] = [];
  const errors: string[] = [];
  for (const src of sources) {
    const target = pending.filter((s) => src.supports(s));
    if (target.length === 0) continue;
    if (isTripped(src.name)) {
      errors.push(`${src.name}: paused after repeated failures`);
      continue;
    }
    try {
      const got = await src.getQuotes(target);
      if (got.length === 0) throw new Error("no data");
      reportSuccess(src.name, "market");
      quotes.push(...got);
      pending = pending.filter((s) => !got.some((q) => q.symbol === s));
      if (pending.length === 0) break;
    } catch (err) {
      reportFailure(src.name, "market", err);
      errors.push(`${src.name}: ${(err as Error).message}`);
    }
  }
  return { quotes, errors };
}

export const liveProvider: MarketDataProvider = {
  name: "Live",
  isMock: false,
  async getQuotes(symbols) {
    const fx = symbols.filter((s) => kindOf(s) === "fx");
    const crypto = symbols.filter((s) => kindOf(s) === "crypto");
    // Each asset group has its own refresh interval: crypto APIs are generous, forex ones (Twelve Data) are metered.
    // A failed refresh falls back to the last good group result (with its original timestamp) for up to 15 minutes.
    const group = (kind: "fx" | "crypto", list: SymbolCode[]) =>
      list.length === 0
        ? Promise.resolve({ quotes: [] as Quote[], errors: [] as string[] })
        : cached(`group:${kind}:${list.join(",")}`, groupTtl(kind), async () => {
            const r = await quotesFor(list, chain(kind));
            if (r.quotes.length === 0) throw new ServiceUnavailableError("market", r.errors.join(" | ") || "No provider configured");
            const fetchedAt = new Date().toISOString();
            return { ...r, quotes: r.quotes.map((q) => ({ ...q, fetchedAt })) };
          }, 15 * 60_000).catch((err) => ({ quotes: [] as Quote[], errors: [String((err as Error).message)] }));
    const [a, b] = await Promise.all([group("fx", fx), group("crypto", crypto)]);
    const quotes = [...a.quotes, ...b.quotes];
    if (quotes.length === 0) throw new ServiceUnavailableError("market", [...a.errors, ...b.errors].join(" | ") || "No provider configured");
    return symbols.flatMap((s) => quotes.filter((q) => q.symbol === s));
  },
  async getCandles(symbol, timeframe, limit) {
    const errors: string[] = [];
    for (const src of chain(kindOf(symbol))) {
      if (!src.supports(symbol) || isTripped(src.name)) continue;
      try {
        const candles = await src.getCandles(symbol, timeframe, limit);
        if (candles.length === 0) throw new Error("no candles");
        reportSuccess(src.name, "market");
        const source = src.name === "Yahoo Finance" && symbol === "XAUUSD" ? "Yahoo Finance (COMEX Gold Futures)" : src.name === "OANDA" && symbol === "DXY" ? "OANDA (DXY calculated)" : src.name;
        return { candles, source };
      } catch (err) {
        reportFailure(src.name, "market", err);
        errors.push(`${src.name}: ${(err as Error).message}`);
      }
    }
    throw new ServiceUnavailableError("market", errors.join(" | ") || "No provider available");
  },
};
