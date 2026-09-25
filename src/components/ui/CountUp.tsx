"use client";

import { useEffect, useRef, useState } from "react";
import { toFaDigits } from "@/lib/format";

/** Counts up from 0 when scrolled into view (instant under reduced motion). */
export function CountUp({ to, suffix = "", duration = 1400, persian = true }: { to: number; suffix?: string; duration?: number; persian?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  const text = `${value}${suffix}`;
  return (
    <span ref={ref} className="num">
      {persian ? toFaDigits(text) : text}
    </span>
  );
}
