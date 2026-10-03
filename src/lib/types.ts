/* ------------------------------------------------------------------ */
/* Prop firms                                                          */
/* ------------------------------------------------------------------ */

export type RuleStatus = "allowed" | "restricted" | "not-allowed" | "unknown";

export interface RuleDetail {
  status: RuleStatus;
  note: string;
}

export interface ChallengePhase {
  name: string;
  profitTarget: number | null; // percent
  dailyDrawdown: number; // percent
  maxDrawdown: number; // percent
  minTradingDays: number | null;
  timeLimit: string;
}

export interface FeeTier {
  accountSize: number; // USD notional
  fee: number;
  currency: "USD" | "EUR";
}

export type ReviewStatus = "reviewed" | "in-review" | "outdated";

export interface PropFirm {
  id: string;
  /** Database id (set when loaded from the database). */
  dbId?: number;
  published?: boolean;
  featured?: boolean;
  name: string;
  slug: string;
  logo: { monogram: string; color: string; src?: string };
  website: string;
  country: string | null;
  foundedYear: number | null;
  description: string;
  program: string;
  platforms: string[];
  /** Reference account used for headline numbers (100k unless noted) */
  challengeFee: FeeTier;
  feeTiers: FeeTier[];
  phases: ChallengePhase[];
  profitTarget: { phase1: number | null; phase2: number | null };
  dailyDrawdown: { value: number; basis: string };
  maxDrawdown: { value: number; type: "static" | "trailing" | "relative"; basis: string };
  profitSplit: { base: number; max: number };
  leverage: { forex: string; metals: string };
  minimumTradingDays: number | null;
  newsTrading: RuleDetail;
  weekendHolding: RuleDetail;
  overnightHolding: RuleDetail;
  eaAllowed: RuleDetail;
  copyTrading: RuleDetail;
  hedging: RuleDetail;
  consistencyRule: RuleDetail;
  ipRules: RuleDetail;
  vpnVps: RuleDetail;
  payoutRules: { firstPayout: string; frequency: string; methods: string[]; note: string };
  scalingRules: { available: boolean; note: string };
  refundPolicy: { available: boolean; note: string };
  accessNote: string;
  highlights: string[];
  limitations: string[];
  faq: { question: string; answer: string }[];
  sources: { label: string; url: string }[];
  status: ReviewStatus;
  lastReviewedAt: string; // ISO date
}

/* ------------------------------------------------------------------ */
/* Market data                                                         */
/* ------------------------------------------------------------------ */

export type SymbolCode =
  | "XAUUSD"
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "AUDUSD"
  | "USDCAD"
  | "USDCHF"
  | "BTCUSD"
  | "ETHUSD"
  | "DXY";

export interface Quote {
  symbol: SymbolCode;
  price: number;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  volume: number | null;
  timestamp: string; // ISO
  /** Provider that produced this quote. */
  source?: string;
  /** When our server fetched it (may be older than now when serving a cached fallback). */
  fetchedAt?: string;
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export interface Candle {
  time: number; // unix seconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Envelope every data API returns so the UI can always show source + timestamp. */
export interface DataEnvelope<T> {
  data: T;
  source: string;
  isMock: boolean;
  fetchedAt: string; // ISO
}

export interface ApiError {
  error: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Economic calendar / news                                            */
/* ------------------------------------------------------------------ */

export type Impact = "high" | "medium" | "low" | "holiday";
export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "NZD" | "CNY";

export interface EconomicEvent {
  id: string;
  datetime: string; // ISO, UTC
  allDay: boolean;
  currency: Currency;
  impact: Impact;
  title: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

export type CalendarRange = "today" | "tomorrow" | "this-week" | "next-week";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export type ArticleCategory =
  | "prop-firm"
  | "forex"
  | "risk"
  | "psychology"
  | "strategy"
  | "market-news"
  | "education";

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  author: string;
  /** Lightweight Markdown: ## headings, paragraphs, "- " bullets, **bold**, [links](url). */
  body: string;
  published: boolean;
}

export interface Coupon {
  id: number;
  firm: { id: number; slug: string; name: string; logo: PropFirm["logo"]; website: string } | null;
  title: string;
  code: string;
  discountLabel: string;
  discountPercent: number | null;
  description: string;
  terms: string;
  url: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  featured: boolean;
  active: boolean;
  copyCount: number;
}

export interface LotteryCampaign {
  id: number;
  slug: string;
  title: string;
  description: string;
  prize: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}
