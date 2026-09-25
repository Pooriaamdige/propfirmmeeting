"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Field, Output, inputClass, parseNum } from "./Field";

export interface DrawdownPreset {
  slug: string;
  name: string;
  daily: number;
  max: number;
}

export function DrawdownCalculator({ presets = [] }: { presets?: DrawdownPreset[] }) {
  const [balance, setBalance] = useState("100000");
  const [current, setCurrent] = useState("100000");
  const [todayPnl, setTodayPnl] = useState("0");
  const [daily, setDaily] = useState("5");
  const [max, setMax] = useState("10");
  const [preset, setPreset] = useState("");

  const r = useMemo(() => {
    const b = parseNum(balance);
    const c = parseNum(current);
    const pnl = parseNum(todayPnl) || 0;
    const d = parseNum(daily);
    const m = parseNum(max);
    if (!(b > 0 && c > 0 && d > 0 && m > 0 && d <= 100 && m <= 100)) return null;
    const maxDaily = (b * d) / 100;
    const maxOverall = (b * m) / 100;
    const startOfDay = c - pnl;
    const dailyFloor = startOfDay - maxDaily;
    const overallFloor = b - maxOverall;
    const floor = Math.max(dailyFloor, overallFloor);
    const remaining = Math.max(0, c - floor);
    const binding = dailyFloor >= overallFloor ? "daily" : "overall";
    const usedOverall = Math.min(1, Math.max(0, (b - c) / maxOverall));
    const usedDaily = Math.min(1, Math.max(0, -pnl / maxDaily));
    return { maxDaily, maxOverall, remaining, floor, binding, usedOverall, usedDaily, breached: c <= floor };
  }, [balance, current, todayPnl, daily, max]);

  const applyPreset = (slug: string) => {
    setPreset(slug);
    const p = presets.find((x) => x.slug === slug);
    if (p) {
      setDaily(String(p.daily));
      setMax(String(p.max));
    }
  };

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <form className="space-y-5 p-5 md:p-6" onSubmit={(e) => e.preventDefault()} aria-label="ورودی‌های محاسبه‌گر دراداون">
        {presets.length > 0 && (
          <Field label="قوانین یک پراپ‌فرم را بارگذاری کن" hint="Preset" htmlFor="dd-preset">
            <select id="dd-preset" value={preset} onChange={(e) => applyPreset(e.target.value)} className={cn(inputClass, "font-sans")}>
              <option value="">— دستی —</option>
              {presets.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.daily}% / {p.max}%)
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="بالانس اولیه حساب" hint="Account Balance" htmlFor="dd-balance" suffix="USD">
            <input id="dd-balance" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className={inputClass} />
          </Field>
          <Field label="اکوییتی فعلی" hint="Current Equity" htmlFor="dd-current" suffix="USD">
            <input id="dd-current" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
          </Field>
          <Field label="دراداون روزانه" hint="Daily DD %" htmlFor="dd-daily" suffix="%">
            <input id="dd-daily" inputMode="decimal" value={daily} onChange={(e) => { setDaily(e.target.value); setPreset(""); }} className={inputClass} />
          </Field>
          <Field label="دراداون کلی" hint="Max DD %" htmlFor="dd-max" suffix="%">
            <input id="dd-max" inputMode="decimal" value={max} onChange={(e) => { setMax(e.target.value); setPreset(""); }} className={inputClass} />
          </Field>
        </div>
        <Field label="سود/زیان امروز تا این لحظه" hint="Today's P&L" htmlFor="dd-pnl" suffix="USD">
          <input id="dd-pnl" inputMode="decimal" value={todayPnl} onChange={(e) => setTodayPnl(e.target.value)} className={inputClass} />
        </Field>
        <p className="text-xs leading-6 text-muted">فرض محاسبه: دراداون روزانه نسبت به بالانس اولیه و از ابتدای روز، و دراداون کلی به‌صورت ثابت (Static). نحوه دقیق محاسبه را در صفحه قوانین هر پراپ‌فرم بررسی کنید.</p>
      </form>

      <div className="relative border-t border-line bg-surface/30 p-5 md:p-6 lg:border-s lg:border-t-0">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative grid gap-3 sm:grid-cols-2">
          <Output label="حداکثر زیان روزانه" labelEn="Maximum Daily Loss" value={r ? formatMoney(r.maxDaily, "USD", 0) : "—"} tone="neg" />
          <Output label="حداکثر زیان کلی" labelEn="Maximum Overall Loss" value={r ? formatMoney(r.maxOverall, "USD", 0) : "—"} tone="neg" />
          <div className="sm:col-span-2">
            <Output label="ریسک باقی‌مانده امروز" labelEn="Remaining Risk" value={r ? formatMoney(r.remaining, "USD", 0) : "—"} tone={r?.breached ? "neg" : "accent"} big />
          </div>
        </div>
        {r && (
          <div className="relative mt-5 space-y-4">
            {[
              { label: "مصرف دراداون روزانه", v: r.usedDaily },
              { label: "مصرف دراداون کلی", v: r.usedOverall },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted">{bar.label}</span>
                  <span className="num">{formatNumber(bar.v * 100, 1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={Math.round(bar.v * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={bar.label}>
                  <div className={cn("h-full rounded-full transition-[width] duration-500", bar.v > 0.8 ? "bg-neg" : bar.v > 0.5 ? "bg-warn" : "bg-accent")} style={{ width: `${bar.v * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs leading-6 text-muted">
              {r.breached ? (
                <span className="text-neg">اکوییتی به کف مجاز رسیده است؛ این حساب طبق فرض‌های بالا نقض قانون محسوب می‌شود.</span>
              ) : (
                <>
                  کف مجاز فعلی: <span className="num text-fg">{formatMoney(r.floor, "USD", 0)}</span> — محدودیت فعال: {r.binding === "daily" ? "دراداون روزانه" : "دراداون کلی"}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
