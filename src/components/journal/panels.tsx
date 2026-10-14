"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CalendarHeatmap, TimeArea } from "./charts";
import type { CurvePoint } from "@/lib/journal/analytics";

const monthLabel = (m: string) => new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T00:00:00Z`));

export function EquityPanel({ curve, currency, initial }: { curve: CurvePoint[]; currency: string; initial: number }) {
  const [mode, setMode] = useState<"growth" | "balance" | "drawdown">("growth");
  const pts = curve.map((p) => ({ t: p.time, v: mode === "growth" ? p.index - 100 : mode === "balance" ? p.balance : p.drawdownPct }));
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex rounded-lg border border-line p-0.5 text-xs" role="tablist" aria-label="نوع نمودار">
          {(
            [
              ["growth", "رشد ٪"],
              ["balance", "بالانس"],
              ["drawdown", "دراداون"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={cn("rounded-md px-3 py-1", mode === id ? "bg-surface font-semibold" : "text-muted hover:text-fg")}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "growth" && <TimeArea points={pts} unit="pct" baseline={0} />}
      {mode === "balance" && <TimeArea points={pts} unit="money" currency={currency} baseline={initial} />}
      {mode === "drawdown" && <TimeArea points={pts} unit="pct" color="var(--neg)" baseline={0} invert />}
    </div>
  );
}

export function CalendarPanel({ days, currency }: { days: { day: string; net: number; trades: number }[]; currency: string }) {
  const months = [...new Set(days.map((d) => d.day.slice(0, 7)))].sort();
  const [i, setI] = useState(months.length - 1);
  if (months.length === 0) return <p className="py-10 text-center text-sm text-muted">هنوز معامله بسته‌شده‌ای نیست.</p>;
  const month = months[Math.max(0, i)];
  const total = days.filter((d) => d.day.startsWith(month)).reduce((a, d) => a + d.net, 0);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setI(Math.max(0, i - 1))} disabled={i <= 0} className="rounded-md px-2 py-1 text-muted hover:bg-surface disabled:opacity-30" aria-label="ماه قبل">
          →
        </button>
        <p className="text-sm font-semibold">
          {monthLabel(month)} · <span className={cn("num", total >= 0 ? "text-pos" : "text-neg")}>{(total >= 0 ? "+" : "") + total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
        </p>
        <button onClick={() => setI(Math.min(months.length - 1, i + 1))} disabled={i >= months.length - 1} className="rounded-md px-2 py-1 text-muted hover:bg-surface disabled:opacity-30" aria-label="ماه بعد">
          ←
        </button>
      </div>
      <CalendarHeatmap days={days} month={month} currency={currency} />
    </div>
  );
}
