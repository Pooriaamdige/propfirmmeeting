"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas "market dust": gold particles drifting upward that link into a constellation
 * near the pointer. Pauses when offscreen or when the tab is hidden; static under reduced motion.
 */
export function ParticleField({ className, density = 0.00009 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; hue: 0 | 1 };
    let ps: P[] = [];

    const colors = () => {
      const s = getComputedStyle(document.documentElement);
      return [s.getPropertyValue("--accent").trim() || "#eb7e2f", s.getPropertyValue("--accent-2").trim() || "#f2c85b"];
    };
    let [c1, c2] = colors();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(140, Math.round(w * h * density)));
      ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: -0.08 - Math.random() * 0.25, r: 0.6 + Math.random() * 1.6, a: 0.25 + Math.random() * 0.6, hue: Math.random() > 0.35 ? 1 : 0 }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -5) {
            p.y = h + 5;
            p.x = Math.random() * w;
          }
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;
        }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.hue ? c2 : c1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // constellation near the pointer
      ctx.lineWidth = 0.6;
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm > 160) continue;
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 90) {
            ctx.globalAlpha = (1 - d / 90) * (1 - dm / 160) * 0.7;
            ctx.strokeStyle = c2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && document.visibilityState === "visible";
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => ((mouse.x = -9999), (mouse.y = -9999));
    const mo = new MutationObserver(() => ([c1, c2] = colors()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={className ?? "pointer-events-none absolute inset-0 h-full w-full"} />;
}
