"use client";

import { animate, motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toFaDigits } from "@/lib/format";

const ease = [0.2, 0.7, 0.2, 1] as const;

/** Headline that reveals word by word with a blur-in. */
/** `wordClassName` is applied to each word (needed for background-clip text effects like `.text-shine`). */
export function BlurText({ text, className, wordClassName, delay = 0, as: Tag = "span" }: { text: string; className?: string; wordClassName?: string; delay?: number; as?: "span" | "h1" | "h2" | "p" }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const M = motion[Tag];
  return (
    <M className={className} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: delay } } }} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          variants={{ hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } } }}
        >
          {/* Inner span: background-clip:text breaks on elements that also animate `filter`. */}
          <span className={wordClassName}>{w}</span>
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </M>
  );
}

/** Fade/slide children into view with a stagger. */
export function Stagger({ children, className, delay = 0, gap = 0.08 }: { children: ReactNode; className?: string; delay?: number; gap?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -10% 0px" }} variants={{ show: { transition: { staggerChildren: gap, delayChildren: delay } } }}>
      {children}
    </motion.div>
  );
}

export const itemVariants: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={cn("h-full", className)} variants={reduce ? undefined : itemVariants}>
      {children}
    </motion.div>
  );
}

/** Spring count-up when scrolled into view. */
export function NumberTicker({ value, suffix = "", persian = true, className }: { value: number; suffix?: string; persian?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const id = requestAnimationFrame(() => setN(value));
      return () => cancelAnimationFrame(id);
    }
    const controls = animate(0, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, reduce]);
  const text = `${n.toLocaleString("en-US")}${suffix}`;
  return (
    <span ref={ref} className={cn("num", className)}>
      {persian ? toFaDigits(text) : text}
    </span>
  );
}

/** Infinite horizontal marquee (pauses on hover; static under reduced motion). */
export function Marquee({ children, className, duration = 40, reverse = false }: { children: ReactNode; className?: string; duration?: number; reverse?: boolean }) {
  return (
    <div className={cn("marquee group overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]", className)} dir="ltr">
      <div className="marquee-track flex w-max gap-4 group-hover:[animation-play-state:paused]" style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}>
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="flex shrink-0 gap-4 motion-reduce:hidden" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
