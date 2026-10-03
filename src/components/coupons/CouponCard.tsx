"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Coupon } from "@/lib/types";
import { cn } from "@/lib/cn";
import { toFaDigits } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { FirmLogo } from "@/components/propfirms/shared";
import { Tilt } from "@/components/fx/Tilt";

function timeLeft(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  if (ms <= 0) return { label: "منقضی شده", urgent: true };
  const days = Math.floor(ms / 86400_000);
  const hours = Math.floor((ms % 86400_000) / 3600_000);
  return { label: days > 0 ? `${toFaDigits(days)} روز مانده` : `${toFaDigits(hours)} ساعت مانده`, urgent: days < 3 };
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers / non-secure contexts.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/** Burst of gold sparks around the copy button. */
function Sparks() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className={cn("absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full", i % 2 ? "bg-accent-2" : "bg-accent")}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 46, y: Math.sin(a) * 30, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

export function CouponCard({ coupon: c }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(0);
  const left = timeLeft(c.expiresAt);
  const onCopy = async () => {
    await copyText(c.code);
    setCopied(Date.now());
    fetch(`/api/coupons/${c.id}/copy/`, { method: "POST", keepalive: true }).catch(() => {});
    setTimeout(() => setCopied(0), 2200);
  };

  return (
    <Tilt className="h-full">
      <article className={cn("ticket relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card", c.featured && "border-beam")} style={{ ["--cut" as string]: "64%" }}>
        <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        {c.featured && <span className="absolute end-4 top-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-contrast">ویژه</span>}

        {/* Top: firm + offer */}
        <div className="relative flex-1 p-5 pb-6">
          <div className="flex items-center gap-3">
            {c.firm ? <FirmLogo firm={c.firm} size={42} /> : <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon name="ticket" /></span>}
            <div className="min-w-0">
              <p className="latin truncate text-sm font-semibold text-muted">{c.firm?.name ?? "PropFirm Meeting"}</p>
              <h3 className="truncate font-bold">{c.title}</h3>
            </div>
          </div>
          <p className="text-shine mt-5 text-3xl font-black tracking-tight">{c.discountLabel}</p>
          {c.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{c.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {left && <span className={cn("rounded-full border px-2 py-0.5", left.urgent ? "border-neg/30 bg-neg/10 text-neg" : "border-line text-muted")}>{left.label}</span>}
            {c.copyCount > 5 && <span className="rounded-full border border-line px-2 py-0.5 text-muted">{toFaDigits(c.copyCount)} بار استفاده</span>}
          </div>
        </div>

        {/* Perforation */}
        <div className="mx-5 border-t-2 border-dashed border-line-strong" aria-hidden />

        {/* Bottom: code */}
        <div className="relative p-5 pt-4">
          <div className="flex items-stretch gap-2">
            <code className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-accent-2/40 bg-accent-2/5 px-3 py-2.5 font-mono text-lg font-bold tracking-[0.15em] text-accent-2" dir="ltr">
              {c.code}
            </code>
            <button
              onClick={onCopy}
              className="btn-sheen relative flex min-w-24 items-center justify-center gap-1.5 rounded-lg bg-linear-to-l from-accent to-[color-mix(in_srgb,var(--accent)_70%,var(--accent-2))] px-3 text-sm font-bold text-accent-contrast transition active:scale-95"
              aria-label={`کپی کد ${c.code}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span key="ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                    <Icon name="check" size={16} strokeWidth={2.6} /> کپی شد
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                    <Icon name="copy" size={16} /> کپی
                  </motion.span>
                )}
              </AnimatePresence>
              {copied ? <Sparks key={copied} /> : null}
            </button>
          </div>
          <span role="status" className="sr-only">{copied ? "کد کپی شد" : ""}</span>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            {c.terms ? <p className="line-clamp-1 text-faint" title={c.terms}>{c.terms}</p> : <span />}
            <div className="flex shrink-0 items-center gap-3">
              {c.firm && (
                <Link href={`/prop-firms/${c.firm.slug}/`} className="text-muted hover:text-fg">
                  تحلیل
                </Link>
              )}
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
                  خرید با این کد <Icon name="external" size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </Tilt>
  );
}
