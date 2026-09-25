/** Decorative financial grid: faint grid, drifting data points, candlestick silhouettes. Pure CSS/SVG. */
export function HeroBackground() {
  const candles = Array.from({ length: 28 }, (_, i) => {
    const base = 150 + Math.sin(i * 0.55) * 40 + Math.sin(i * 1.7) * 14;
    const body = 18 + ((i * 7) % 22);
    return { x: 30 + i * 44, y: base - body / 2, h: body, wick: body + 16 + ((i * 5) % 18), up: Math.sin(i * 1.3) > -0.2 };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="grid-bg fade-mask-b absolute inset-0" />
      <div className="ambient absolute inset-0" />
      <svg className="absolute inset-x-0 bottom-0 h-[70%] w-full opacity-[0.07]" viewBox="0 0 1260 300" preserveAspectRatio="xMidYMax slice">
        {candles.map((c, i) => (
          <g key={i} fill={c.up ? "var(--pos)" : "var(--neg)"} stroke={c.up ? "var(--pos)" : "var(--neg)"}>
            <line x1={c.x + 7} x2={c.x + 7} y1={c.y + c.h / 2 - c.wick / 2} y2={c.y + c.h / 2 + c.wick / 2} strokeWidth="1.5" />
            <rect x={c.x} y={c.y} width="14" height={c.h} rx="2" />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0" style={{ animation: "drift 16s linear infinite" }}>
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            className="absolute h-[3px] w-[3px] rounded-full bg-accent"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 110}%`, opacity: 0.12 + ((i * 7) % 10) / 40 }}
          />
        ))}
      </div>
    </div>
  );
}
