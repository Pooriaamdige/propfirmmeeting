import type { ReactNode } from "react";

export function Field({ label, hint, htmlFor, children, suffix }: { label: string; hint?: string; htmlFor: string; children: ReactNode; suffix?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint && <span className="latin text-[11px] font-normal text-faint">{hint}</span>}
      </label>
      {/* Numeric inputs are LTR, so the unit sits on the physical right. */}
      <div className={suffix ? "relative [&_input]:pr-12" : "relative"}>
        {children}
        {suffix && <span className="latin pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint">{suffix}</span>}
      </div>
    </div>
  );
}

export const inputClass = "num h-11 w-full rounded-lg border border-line bg-surface/60 px-3 text-left text-sm outline-none transition focus:border-accent/60 focus:bg-card aria-[invalid=true]:border-neg/60";

export function Output({ label, labelEn, value, tone, big }: { label: string; labelEn: string; value: string; tone?: "pos" | "neg" | "accent"; big?: boolean }) {
  const color = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "accent" ? "text-accent" : "text-fg";
  return (
    <div className="rounded-xl border border-line bg-surface/50 p-4">
      <p className="flex items-baseline justify-between text-xs text-muted">
        {label}
        <span className="latin text-[10px] text-faint">{labelEn}</span>
      </p>
      <p className={`num mt-2 font-bold tracking-tight ${big ? "text-3xl" : "text-xl"} ${color}`} aria-live="polite">
        {value}
      </p>
    </div>
  );
}

/** Parse a user-typed number that may contain Persian digits or thousands separators. */
export function parseNum(v: string): number {
  const n = Number(v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[,٬\s]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}
