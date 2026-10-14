/**
 * CSV import/export for the journal. Accepts our template and common MT4/MT5 history
 * column names (where "Time"/"Price" appear twice, the second is the close).
 */
export const CSV_COLUMNS = ["symbol", "side", "opened_at", "closed_at", "entry_price", "exit_price", "lots", "stop_loss", "take_profit", "profit", "commission", "swap", "pips", "risk_amount", "setup", "tags", "mistakes", "emotion", "rating", "notes"] as const;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const src = text.replace(/^﻿/, "");
  const delim = (src.split("\n")[0].match(/;/g)?.length ?? 0) > (src.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : src.split("\n")[0].includes("\t") ? "\t" : ",";
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const ALIASES: Record<string, (typeof CSV_COLUMNS)[number]> = {
  symbol: "symbol", item: "symbol", instrument: "symbol",
  side: "side", type: "side", direction: "side",
  opened_at: "opened_at", open_time: "opened_at", "open time": "opened_at", time: "opened_at", "open date": "opened_at",
  closed_at: "closed_at", close_time: "closed_at", "close time": "closed_at", "close date": "closed_at",
  entry_price: "entry_price", "open price": "entry_price", price: "entry_price", entry: "entry_price",
  exit_price: "exit_price", "close price": "exit_price", exit: "exit_price",
  lots: "lots", size: "lots", volume: "lots", lot: "lots",
  stop_loss: "stop_loss", "s / l": "stop_loss", "s/l": "stop_loss", sl: "stop_loss",
  take_profit: "take_profit", "t / p": "take_profit", "t/p": "take_profit", tp: "take_profit",
  profit: "profit", "p/l": "profit", pnl: "profit",
  commission: "commission", commissions: "commission",
  swap: "swap", swaps: "swap",
  pips: "pips",
  risk_amount: "risk_amount", risk: "risk_amount",
  setup: "setup", strategy: "setup",
  tags: "tags", mistakes: "mistakes", emotion: "emotion", rating: "rating",
  notes: "notes", comment: "notes",
};

export interface ParsedRow {
  line: number;
  values: Partial<Record<(typeof CSV_COLUMNS)[number], string>>;
}

/** Map header names to our columns. Returns rows keyed by our column ids. */
export function mapRows(rows: string[][]): { mapped: ParsedRow[]; unknownHeaders: string[] } {
  if (rows.length === 0) return { mapped: [], unknownHeaders: [] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const seen = new Set<string>();
  const unknown: string[] = [];
  const keys = header.map((h) => {
    let k = ALIASES[h];
    if (!k) {
      unknown.push(h);
      return null;
    }
    // MT5 positions table: Time, …, Price, …, Time, Price → second occurrences are the close.
    if (seen.has(k)) k = k === "opened_at" ? "closed_at" : k === "entry_price" ? "exit_price" : k;
    seen.add(k);
    return k;
  });
  const mapped = rows.slice(1).map((r, i) => {
    const values: ParsedRow["values"] = {};
    keys.forEach((k, j) => {
      if (k && r[j] !== undefined && r[j].trim() !== "") values[k] = r[j].trim();
    });
    return { line: i + 2, values };
  });
  return { mapped, unknownHeaders: unknown.filter(Boolean) };
}

/** "2026.09.30 14:05:11" / "2026-09-30 14:05" / ISO → ISO, interpreting naive times in `timeZone`. */
export function parseDate(v: string | undefined, timeZone: string): string | null {
  if (!v) return null;
  const s = v.trim().replace(/\./g, "-").replace(/\//g, "-");
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(s)) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : new Date(t).toISOString();
  }
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", se = "0"] = m;
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +se);
  // Offset of the timezone at that wall time.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(asUtc));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const wall = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return new Date(asUtc - (wall - asUtc)).toISOString();
}

export function normalizeSide(v: string | undefined): "buy" | "sell" | null {
  const s = (v ?? "").trim().toLowerCase();
  if (/^(buy|long|b|خرید)/.test(s)) return "buy";
  if (/^(sell|short|s|فروش)/.test(s)) return "sell";
  return null;
}

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(rows: Record<(typeof CSV_COLUMNS)[number], unknown>[]): string {
  return [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => esc(r[c])).join(","))].join("\r\n");
}
