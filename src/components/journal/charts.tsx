"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/journal/format";

export type Unit = "money" | "pct" | "num" | "r";
/** Formatting lives here because server components can't pass functions to client components. */
export function formatUnit(v: number, unit: Unit, currency = "USD", signed = false) {
  if (unit === "money") return fmtMoney(v, currency, signed);
  if (unit === "pct") return fmtPct(v, signed);
  if (unit === "r") return `${signed && v > 0 ? "+" : ""}${v.toFixed(2)}R`;
  return fmtNum(v);
}

/* Shared tooltip ----------------------------------------------------------- */

/** Container width in px (charts draw at real size so marks keep their specified thickness). */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Tooltip positioned in % of the chart box (no DOM measurement during render). */
function Tip({ xPct, yPct, children }: { xPct: number; yPct: number; children: React.ReactNode }) {
  const shift = xPct < 15 ? "0%" : xPct > 85 ? "-100%" : "-50%";
  return (
    <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-xs shadow-card" style={{ left: `${xPct}%`, top: `${yPct}%`, transform: `translate(${shift}, calc(-100% - 8px))` }} dir="rtl">
      {children}
    </div>
  );
}

/* Polarity bar chart (P/L by category) -------------------------------------- */

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  sub?: string;
}

/**
 * Vertical columns from a zero baseline. Positive above / negative below (position encodes
 * the sign, color repeats it), ≤ 24px wide with 4px rounded data-ends, hairline grid, hover tooltip.
 */
export function PolarityBars({ data, height = 200, unit = "money", currency = "USD", emptyLabel = "داده‌ای نیست" }: { data: BarDatum[]; height?: number; unit?: Unit; currency?: string; emptyLabel?: string }) {
  const format = (v: number) => formatUnit(v, unit, currency, true);
  const [hover, setHover] = useState<number | null>(null);
  const [boxRef, width] = useWidth(640);
  const pad = { top: 16, bottom: 28, left: 8, right: 8 };
  const max = Math.max(0, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const span = max - min || 1;
  const innerH = height - pad.top - pad.bottom;
  const y = (v: number) => pad.top + ((max - v) / span) * innerH;
  const slot = (width - pad.left - pad.right) / Math.max(1, data.length);
  const bw = Math.min(24, slot * 0.6);
  const empty = data.every((d) => d.value === 0);

  return (
    <div ref={boxRef} className="relative" onPointerLeave={() => setHover(null)}>
      {empty ? (
        <p className="py-10 text-center text-sm text-muted">{emptyLabel}</p>
      ) : (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full" style={{ direction: "ltr" }} role="img" aria-label="نمودار ستونی سود و زیان">
        <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" strokeWidth="1" />
        {data.map((d, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const top = y(Math.max(0, d.value));
          const h = Math.max(1, Math.abs(y(d.value) - y(0)));
          const up = d.value >= 0;
          const r = Math.min(4, h / 2, bw / 2);
          // rounded data-end only (square at the baseline)
          const path = up
            ? `M${cx - bw / 2},${top + h} V${top + r} Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top} H${cx + bw / 2 - r} Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r} V${top + h} Z`
            : `M${cx - bw / 2},${top} V${top + h - r} Q${cx - bw / 2},${top + h} ${cx - bw / 2 + r},${top + h} H${cx + bw / 2 - r} Q${cx + bw / 2},${top + h} ${cx + bw / 2},${top + h - r} V${top} Z`;
          return (
            <g key={d.key} onPointerEnter={() => setHover(i)}>
              <rect x={pad.left + slot * i} y={pad.top} width={slot} height={innerH} fill="transparent" />
              {d.value !== 0 && <path d={path} fill={up ? "var(--pos)" : "var(--neg)"} opacity={hover === null || hover === i ? 1 : 0.45} />}
              {data.length <= 24 && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      )}
      {hover !== null && !empty && (
        <Tip xPct={((pad.left + slot * hover + slot / 2) / width) * 100} yPct={(y(Math.max(0, data[hover].value)) / height) * 100}>
          <span className="block font-semibold">{data[hover].label}</span>
          <span className={cn("num", data[hover].value >= 0 ? "text-pos" : "text-neg")}>{format(data[hover].value)}</span>
          {data[hover].sub && <span className="block text-muted">{data[hover].sub}</span>}
        </Tip>
      )}
    </div>
  );
}

/* Single-series line/area over time ---------------------------------------- */

export function TimeArea({ points, height = 240, color = "var(--accent)", unit = "money", currency = "USD", baseline, invert = false }: { points: { t: number; v: number }[]; height?: number; color?: string; unit?: Unit; currency?: string; baseline?: number; invert?: boolean }) {
  const format = (v: number) => formatUnit(v, unit, currency);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useWidth(720);
  const pad = { top: 12, bottom: 24, left: 64, right: 12 };
  const { xs, ys, min, max, ticks } = useMemo(() => {
    const vs = points.map((p) => p.v);
    let lo = Math.min(...vs, baseline ?? Infinity);
    let hi = Math.max(...vs, baseline ?? -Infinity);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const t0 = points[0]?.t ?? 0;
    const t1 = points.at(-1)?.t ?? 1;
    const xs = points.map((p, i) => pad.left + (points.length === 1 ? 0.5 : (t1 === t0 ? i / (points.length - 1) : (p.t - t0) / (t1 - t0))) * (width - pad.left - pad.right));
    const ys = points.map((p) => pad.top + ((hi - p.v) / (hi - lo)) * (height - pad.top - pad.bottom));
    const ticks = [0, 0.5, 1].map((f) => lo + (hi - lo) * f);
    return { xs, ys, min: lo, max: hi, ticks };
  }, [points, height, baseline, width, pad.left, pad.right, pad.top, pad.bottom]);
  if (points.length < 2)
    return (
      <div ref={ref}>
        <p className="py-12 text-center text-sm text-muted">برای رسم نمودار حداقل دو معامله بسته‌شده لازم است.</p>
      </div>
    );
  const yOf = (v: number) => pad.top + ((max - v) / (max - min)) * (height - pad.top - pad.bottom);
  const line = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const fillBase = invert ? pad.top : height - pad.bottom;
  const fmtT = (t: number) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric", timeZone: "Asia/Tehran" }).format(new Date(t * 1000));

  const onMove = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    xs.forEach((x, i) => {
      if (Math.abs(x - sx) < Math.abs(xs[best] - sx)) best = i;
    });
    setHover(best);
  };

  return (
    <div ref={ref} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full touch-none" style={{ direction: "ltr" }} role="img">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={width - pad.right} y1={yOf(v)} y2={yOf(v)} stroke="var(--grid-line)" strokeWidth="1" />
            <text x={pad.left - 6} y={yOf(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--faint)">
              {format(v)}
            </text>
          </g>
        ))}
        {baseline !== undefined && <line x1={pad.left} x2={width - pad.right} y1={yOf(baseline)} y2={yOf(baseline)} stroke="var(--border-strong)" strokeWidth="1" />}
        <path d={`${line} L${xs.at(-1)},${fillBase} L${xs[0]},${fillBase} Z`} fill={color} opacity="0.1" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <text x={pad.left} y={height - 6} fontSize="10.5" fill="var(--faint)">
          {fmtT(points[0].t)}
        </text>
        <text x={width - pad.right} y={height - 6} textAnchor="end" fontSize="10.5" fill="var(--faint)">
          {fmtT(points.at(-1)!.t)}
        </text>
        {hover !== null && (
          <>
            <line x1={xs[hover]} x2={xs[hover]} y1={pad.top} y2={height - pad.bottom} stroke="var(--border-strong)" strokeWidth="1" />
            <circle cx={xs[hover]} cy={ys[hover]} r="4.5" fill={color} stroke="var(--card)" strokeWidth="2" />
          </>
        )}
        {hover === null && <circle cx={xs.at(-1)} cy={ys.at(-1)} r="4" fill={color} stroke="var(--card)" strokeWidth="2" />}
      </svg>
      {hover !== null && (
        <Tip xPct={(xs[hover] / width) * 100} yPct={(ys[hover] / height) * 100}>
          <span className="block text-muted">{new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date(points[hover].t * 1000))}</span>
          <span className="num font-semibold">{format(points[hover].v)}</span>
        </Tip>
      )}
    </div>
  );
}

/* Calendar heatmap of daily P/L -------------------------------------------- */

/** Diverging (neg ← gray → pos) intensity by |P/L|; every cell also shows the sign via tooltip and the month table. */
export function CalendarHeatmap({ days, month, currency = "USD" }: { days: { day: string; net: number; trades: number }[]; month: string; currency?: string }) {
  const format = (v: number) => fmtMoney(v, currency, true);
  const [hover, setHover] = useState<string | null>(null);
  const map = new Map(days.map((d) => [d.day, d]));
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 1) % 7; // week starts Saturday
  const maxAbs = Math.max(1, ...days.filter((d) => d.day.startsWith(month)).map((d) => Math.abs(d.net)));
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  const hd = hover ? map.get(hover) : null;
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-faint">
        {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5" onPointerLeave={() => setHover(null)}>
        {cells.map((c, i) => {
          if (!c) return <span key={`e${i}`} />;
          const d = map.get(c);
          const a = d ? 0.18 + 0.72 * (Math.abs(d.net) / maxAbs) : 0;
          const bg = d ? `color-mix(in srgb, ${d.net >= 0 ? "var(--pos)" : "var(--neg)"} ${Math.round(a * 100)}%, var(--surface))` : "var(--surface)";
          return (
            <button key={c} type="button" onPointerEnter={() => setHover(c)} onFocus={() => setHover(c)} aria-label={`${c}: ${d ? format(d.net) : "بدون معامله"}`} className="num aspect-square rounded-md text-[10px] text-fg/70 outline-offset-1" style={{ background: bg }}>
              {Number(c.slice(-2))}
            </button>
          );
        })}
      </div>
      <p className="mt-2 h-5 text-xs text-muted">
        {hover ? (
          <>
            <span className="num">{hover}</span> ·{" "}
            {hd ? (
              <>
                <span className={cn("num font-semibold", hd.net >= 0 ? "text-pos" : "text-neg")}>{format(hd.net)}</span> · {hd.trades.toLocaleString("fa-IR")} معامله
              </>
            ) : (
              "بدون معامله"
            )}
          </>
        ) : (
          "روی هر روز نگه دار تا سود/زیان آن را ببینی."
        )}
      </p>
    </div>
  );
}

/* Meter -------------------------------------------------------------------- */

export function Meter({ value, tone }: { value: number; tone: "ok" | "warning" | "breached" | "passed" | "pending" }) {
  const color = tone === "breached" ? "bg-neg" : tone === "warning" ? "bg-warn" : tone === "passed" ? "bg-pos" : "bg-accent";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
