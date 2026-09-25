import { useId } from "react";
import type { Candle } from "@/lib/types";

/** Lightweight animated SVG area chart used in the hero (no chart library on first load). */
export function AreaChart({ candles, height = 180, positive }: { candles: Candle[]; height?: number; positive: boolean }) {
  const id = useId();
  const width = 600;
  if (candles.length < 2) return null;
  const closes = candles.map((c) => c.close);
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const range = max - min || 1;
  const y = (v: number) => height - 8 - ((v - min) / range) * (height - 24);
  const x = (i: number) => (i / (closes.length - 1)) * width;
  const line = closes.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const color = positive ? "var(--pos)" : "var(--neg)";
  const lastY = y(closes[closes.length - 1]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full" style={{ direction: "ltr" }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="var(--grid-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      {/* candle bodies as a faint texture */}
      {candles.map((c, i) => (
        <line key={c.time} x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id}-fill)`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1} className="draw-line" strokeLinejoin="round" />
      <line x1="0" x2={width} y1={lastY} y2={lastY} stroke={color} strokeOpacity="0.5" strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
