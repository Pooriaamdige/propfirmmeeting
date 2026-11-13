"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Endless horizontal strip that scrolls by itself, pauses while hovered or focused,
 * and can be dragged with the mouse or a finger (vertical page scrolling keeps working on touch).
 * The content is rendered twice and the offset wraps at one copy's width.
 */
export function DragMarquee({
  children,
  className,
  trackClassName,
  speed = 40,
  reverse = false,
  label,
}: {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Pixels per second. */
  speed?: number;
  reverse?: boolean;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    const one = copy.current;
    if (!el || !tr || !one) return;

    let offset = 0;
    let width = one.offsetWidth;
    let hovered = false;
    let focused = false;
    let visible = true;
    let resumeAt = 0;
    let drag: { id: number; x: number; y: number; start: number; moved: boolean; axis: "x" | "y" | null } | null = null;
    let suppressClick = false;
    let last = performance.now();
    let raf = 0;

    const wrap = () => {
      if (width <= 0) return;
      offset = ((offset % width) + width) % width; // 0..width
      tr.style.transform = `translate3d(${-offset}px,0,0)`;
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      if (!reduce && visible && !hovered && !focused && !drag && now >= resumeAt) {
        offset += (reverse ? -1 : 1) * speed * dt;
        wrap();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      width = one.offsetWidth;
      wrap();
    });
    ro.observe(one);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, start: offset, moved: false, axis: e.pointerType === "mouse" ? "x" : null };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (drag.axis === "y") {
          drag = null; // let the page scroll
          return;
        }
      }
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = "";
      }
      if (drag.moved) {
        offset = drag.start - dx;
        wrap();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) suppressClick = true;
      // On touch there's no hover to keep it paused: resume shortly after the finger lifts.
      if (e.pointerType !== "mouse") resumeAt = performance.now() + 1500;
      drag = null;
      delete el.dataset.dragging;
    };
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovered = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovered = false;
    };
    // Keyboard focus pauses the strip; focus from a mouse/touch press doesn't.
    const onFocusIn = (e: FocusEvent) => (focused = (e.target as Element).matches(":focus-visible"));
    const onFocusOut = () => (focused = false);
    const noNativeDrag = (e: DragEvent) => e.preventDefault();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("dragstart", noNativeDrag);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("dragstart", noNativeDrag);
    };
  }, [reduce, speed, reverse]);

  return (
    <div
      ref={root}
      dir="ltr"
      aria-label={label}
      className={cn("drag-marquee cursor-grab touch-pan-y select-none overflow-hidden data-[dragging]:cursor-grabbing", className)}
    >
      <div ref={track} className="flex w-max will-change-transform">
        <div ref={copy} className={cn("flex shrink-0", trackClassName)}>
          {children}
        </div>
        <div className={cn("flex shrink-0", trackClassName)} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
