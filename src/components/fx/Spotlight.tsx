"use client";

import { useRef, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Card that follows the pointer with a soft orange glow and a highlighted border
 * (CSS vars --mx/--my drive both; see `.spotlight` in globals.css).
 */
export function SpotlightCard({ className, children, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("spotlight", className)}
      {...props}
    >
      {children}
    </div>
  );
}
