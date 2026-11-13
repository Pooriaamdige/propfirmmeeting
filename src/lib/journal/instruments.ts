/**
 * Instrument helpers for manual trade entry: pip size and money estimates.
 * Estimates are only offered when the quote currency is USD or the base is USD
 * (account in USD); otherwise the user enters P/L as shown by the platform.
 */
export const COMMON_SYMBOLS = [
  "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
  "EURJPY", "GBPJPY", "EURGBP", "AUDJPY", "XAGUSD", "US30", "NAS100", "SPX500", "GER40", "BTCUSD", "ETHUSD",
];

const CRYPTO = /^(BTC|ETH|SOL|XRP|LTC|BNB|ADA|DOGE)/;
const INDEX = /^(US30|US100|NAS100|USTEC|SPX500|US500|GER40|DE40|UK100|JP225|HK50|FRA40|AUS200)/;

/** "eurusd.m", "EURUSDpro", "XAUUSD-RAW" → "EURUSD" / "XAUUSD" (drops common broker suffixes). */
export function normalizeSymbol(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = s.match(/^([A-Z]{6})(M|PRO|RAW|ECN|I|C|Z|STD)$/);
  return m ? m[1] : s;
}

export function pipSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.startsWith("XAU")) return 0.1;
  if (s.startsWith("XAG")) return 0.01;
  if (INDEX.test(s) || CRYPTO.test(s)) return 1;
  if (/JPY/.test(s)) return 0.01;
  return 0.0001;
}

export function contractSize(symbol: string): number | null {
  const s = symbol.toUpperCase();
  if (s.startsWith("XAU")) return 100;
  if (s.startsWith("XAG")) return 5000;
  if (INDEX.test(s)) return null; // broker-specific
  if (CRYPTO.test(s)) return 1;
  if (/^[A-Z]{6}$/.test(s)) return 100000;
  return null;
}

const dir = (side: "buy" | "sell") => (side === "buy" ? 1 : -1);

export function pipsBetween(symbol: string, side: "buy" | "sell", entry: number, exit: number): number {
  return Math.round(((exit - entry) * dir(side) * 10) / pipSize(symbol)) / 10;
}

/** Value in USD of a price move of `delta` on `lots`, or null when it can't be derived. */
function moneyForMove(symbol: string, delta: number, lots: number, priceForConversion: number): number | null {
  const s = symbol.toUpperCase();
  const cs = contractSize(s);
  if (cs === null) return null;
  const raw = delta * lots * cs;
  if (s.endsWith("USD") || CRYPTO.test(s)) return raw;
  if (s.startsWith("USD") && priceForConversion > 0) return raw / priceForConversion;
  return null;
}

export function estimateProfit(symbol: string, side: "buy" | "sell", entry: number, exit: number, lots: number): number | null {
  const v = moneyForMove(symbol, (exit - entry) * dir(side), lots, exit);
  return v === null ? null : Math.round(v * 100) / 100;
}

export function estimateRisk(symbol: string, entry: number, stopLoss: number, lots: number): number | null {
  const v = moneyForMove(symbol, Math.abs(entry - stopLoss), lots, stopLoss);
  return v === null ? null : Math.round(v * 100) / 100;
}

export const MISTAKES = [
  "ورود زودهنگام",
  "خروج زودهنگام",
  "جابجایی حد ضرر",
  "بدون حد ضرر",
  "حجم بیش از حد",
  "معامله انتقامی",
  "خارج از پلن",
  "معامله حوالی خبر",
  "ترس از جاماندن (FOMO)",
  "بیش‌معامله‌گری",
] as const;

export const EMOTIONS: { id: string; label: string; emoji: string }[] = [
  { id: "calm", label: "آرام", emoji: "😌" },
  { id: "confident", label: "مطمئن", emoji: "💪" },
  { id: "anxious", label: "مضطرب", emoji: "😰" },
  { id: "fear", label: "ترس", emoji: "😨" },
  { id: "greedy", label: "طمع", emoji: "🤑" },
  { id: "excited", label: "هیجان‌زده", emoji: "🤩" },
  { id: "tired", label: "خسته", emoji: "🥱" },
  { id: "angry", label: "عصبی", emoji: "😠" },
];

export const SESSION_LABELS: Record<string, string> = { sydney: "سیدنی", asia: "آسیا (توکیو)", london: "لندن", "london-ny": "همپوشانی لندن/نیویورک", newyork: "نیویورک" };
export const WEEKDAY_LABELS: Record<string, string> = { Mon: "دوشنبه", Tue: "سه‌شنبه", Wed: "چهارشنبه", Thu: "پنجشنبه", Fri: "جمعه", Sat: "شنبه", Sun: "یکشنبه" };
export const ACCOUNT_TYPES: { id: string; label: string }[] = [
  { id: "challenge", label: "چالش پراپ" },
  { id: "funded", label: "حساب Funded" },
  { id: "personal", label: "حساب شخصی" },
  { id: "demo", label: "دمو" },
];
export const RESET_TIMEZONES: { id: string; label: string }[] = [
  { id: "Europe/Athens", label: "سرور اکثر بروکرها (GMT+2/+3)" },
  { id: "Europe/Prague", label: "CET/CEST (مثل FTMO)" },
  { id: "UTC", label: "UTC" },
  { id: "America/New_York", label: "نیویورک" },
  { id: "Asia/Tehran", label: "تهران" },
];
