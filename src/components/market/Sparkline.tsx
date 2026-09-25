import { useId } from "react";

/** Dependency-free SVG sparkline with an area fill. */
export function Sparkline({ values, width = 120, height = 36, positive, className, animate = true }: { values: number[]; width?: number; height?: number; positive: boolean; className?: string; animate?: boolean }) {
  const id = useId();
  if (values.length < 2) return <div style={{ width, height }} className={className} aria-hidden />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / range) * (height - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const color = positive ? "var(--pos)" : "var(--neg)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden style={{ direction: "ltr" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className={animate ? "draw-line" : undefined} />
    </svg>
  );
}
