import type { Candle, Quote } from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { getJson } from "@/lib/services/http";
import type { MarketSource } from "../provider";

/** Binance public REST — crypto, no key. USDT pairs used as USD proxy. Blocked in some regions. */
const BASE = process.env.BINANCE_API_BASE ?? "https://api.binance.com/api/v3";

export const binance: MarketSource = {
  name: "Binance",
  supports: (s) => !!SYMBOLS[s].binance,
  async getQuotes(symbols) {
    const list = JSON.stringify(symbols.map((s) => SYMBOLS[s].binance));
    const json = await getJson<{ symbol: string; lastPrice: string; priceChange: string; priceChangePercent: string; highPrice: string; lowPrice: string; volume: string; closeTime: number }[]>(`${BASE}/ticker/24hr?symbols=${encodeURIComponent(list)}`);
    return symbols.flatMap((symbol): Quote[] => {
      const t = json.find((x) => x.symbol === SYMBOLS[symbol].binance);
      return t ? [{ symbol, price: +t.lastPrice, change: +t.priceChange, changePercent: +t.priceChangePercent, high: +t.highPrice, low: +t.lowPrice, volume: +t.volume, timestamp: new Date(t.closeTime).toISOString(), source: "Binance" }] : [];
    });
  },
  async getCandles(symbol, tf, limit): Promise<Candle[]> {
    const json = await getJson<[number, string, string, string, string][]>(`${BASE}/klines?symbol=${SYMBOLS[symbol].binance}&interval=${tf}&limit=${limit}`);
    return json.map((k) => ({ time: Math.floor(k[0] / 1000), open: +k[1], high: +k[2], low: +k[3], close: +k[4] }));
  },
};
