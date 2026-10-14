export const fmtMoney = (v: number, currency = "USD", signed = false) => {
  const s = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: Math.abs(v) < 1000 ? 2 : 0 }).format(Math.abs(v));
  return v < 0 ? `-${s}` : signed && v > 0 ? `+${s}` : s;
};
export const fmtNum = (v: number | null | undefined, d = 2) => (v == null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: d }));
export const fmtPct = (v: number | null | undefined, signed = true) => (v == null ? "—" : `${signed && v > 0 ? "+" : ""}${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`);
export const fmtDuration = (minutes: number) => {
  if (!minutes) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  return `${Math.floor(minutes / 1440)}d ${Math.round((minutes % 1440) / 60)}h`;
};
export const fmtDateTime = (iso: string | Date, timeZone = "Asia/Tehran") =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
export const fmtDay = (iso: string | Date, timeZone = "Asia/Tehran") => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeZone }).format(new Date(iso));
export const toneOf = (v: number) => (v > 0 ? "text-pos" : v < 0 ? "text-neg" : "text-muted");
