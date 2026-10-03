import { ParticleField } from "@/components/fx/ParticleField";

/** Hero backdrop: particles, aurora, and candlesticks that grow in and breathe. */
export function HeroScene() {
  const candles = Array.from({ length: 30 }, (_, i) => {
    const base = 170 + Math.sin(i * 0.5) * 46 + Math.sin(i * 1.7) * 16 - i * 2.2;
    const body = 16 + ((i * 7) % 26);
    return { x: 20 + i * 42, y: base - body / 2, h: body, wick: body + 18 + ((i * 5) % 20), up: Math.sin(i * 1.3) > -0.25 };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="grid-bg fade-mask-b absolute inset-0" />
      <div className="ambient absolute inset-0" />
      <svg className="absolute inset-x-0 bottom-0 h-[72%] w-full opacity-[0.09]" viewBox="0 0 1280 300" preserveAspectRatio="xMidYMax slice">
        {candles.map((c, i) => (
          <g key={i} fill={c.up ? "var(--accent-2)" : "var(--accent)"} stroke={c.up ? "var(--accent-2)" : "var(--accent)"} style={{ transformOrigin: `${c.x + 7}px ${c.y + c.h}px`, animation: `rise 0.9s ${i * 0.05}s both cubic-bezier(.2,.7,.2,1), float ${6 + (i % 5)}s ${i * 0.2}s ease-in-out infinite` }}>
            <line x1={c.x + 7} x2={c.x + 7} y1={c.y + c.h / 2 - c.wick / 2} y2={c.y + c.h / 2 + c.wick / 2} strokeWidth="1.5" />
            <rect x={c.x} y={c.y} width="14" height={c.h} rx="2" />
          </g>
        ))}
      </svg>
      <ParticleField />
    </div>
  );
}
