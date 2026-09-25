import type { SymbolCode } from "@/lib/types";

export interface SymbolMeta {
  code: SymbolCode;
  label: string; // display ticker, e.g. XAU/USD
  faName: string;
  digits: number;
  assetClass: "forex" | "metal" | "crypto" | "index";
  /** Size of one pip in price units (used by the position size calculator). */
  pipSize: number;
  /** Units per 1 standard lot. */
  contractSize: number;
  twelveData?: string;
  binance?: string;
  /** Anchor price used only by the development mock provider. */
  mockAnchor: number;
}

export const SYMBOLS: Record<SymbolCode, SymbolMeta> = {
  XAUUSD: { code: "XAUUSD", label: "XAU/USD", faName: "طلا", digits: 2, assetClass: "metal", pipSize: 0.1, contractSize: 100, twelveData: "XAU/USD", mockAnchor: 2658.42 },
  EURUSD: { code: "EURUSD", label: "EUR/USD", faName: "یورو / دلار", digits: 5, assetClass: "forex", pipSize: 0.0001, contractSize: 100000, twelveData: "EUR/USD", mockAnchor: 1.1724 },
  GBPUSD: { code: "GBPUSD", label: "GBP/USD", faName: "پوند / دلار", digits: 5, assetClass: "forex", pipSize: 0.0001, contractSize: 100000, twelveData: "GBP/USD", mockAnchor: 1.3512 },
  USDJPY: { code: "USDJPY", label: "USD/JPY", faName: "دلار / ین", digits: 3, assetClass: "forex", pipSize: 0.01, contractSize: 100000, twelveData: "USD/JPY", mockAnchor: 147.82 },
  AUDUSD: { code: "AUDUSD", label: "AUD/USD", faName: "دلار استرالیا / دلار", digits: 5, assetClass: "forex", pipSize: 0.0001, contractSize: 100000, twelveData: "AUD/USD", mockAnchor: 0.6614 },
  USDCAD: { code: "USDCAD", label: "USD/CAD", faName: "دلار / دلار کانادا", digits: 5, assetClass: "forex", pipSize: 0.0001, contractSize: 100000, twelveData: "USD/CAD", mockAnchor: 1.3821 },
  USDCHF: { code: "USDCHF", label: "USD/CHF", faName: "دلار / فرانک", digits: 5, assetClass: "forex", pipSize: 0.0001, contractSize: 100000, twelveData: "USD/CHF", mockAnchor: 0.7962 },
  BTCUSD: { code: "BTCUSD", label: "BTC/USD", faName: "بیت‌کوین", digits: 2, assetClass: "crypto", pipSize: 1, contractSize: 1, binance: "BTCUSDT", mockAnchor: 108420 },
  ETHUSD: { code: "ETHUSD", label: "ETH/USD", faName: "اتریوم", digits: 2, assetClass: "crypto", pipSize: 0.1, contractSize: 1, binance: "ETHUSDT", mockAnchor: 4312.5 },
  DXY: { code: "DXY", label: "DXY", faName: "شاخص دلار", digits: 3, assetClass: "index", pipSize: 0.01, contractSize: 1, twelveData: "DXY", mockAnchor: 97.42 },
};

export const ALL_SYMBOLS = Object.keys(SYMBOLS) as SymbolCode[];
export const TICKER_SYMBOLS: SymbolCode[] = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "BTCUSD", "ETHUSD"];
export const HERO_SYMBOLS: SymbolCode[] = ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"];
export const OVERVIEW_SYMBOLS: SymbolCode[] = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "DXY"];
export const CHART_SYMBOLS: SymbolCode[] = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "BTCUSD", "ETHUSD"];

export function isSymbol(value: string | null | undefined): value is SymbolCode {
  return !!value && value in SYMBOLS;
}
