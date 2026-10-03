"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Coupon } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { CouponCard } from "./CouponCard";

const SORTS = [
  { id: "featured", label: "پیشنهاد ما" },
  { id: "discount", label: "بیشترین تخفیف" },
  { id: "ending", label: "نزدیک به انقضا" },
] as const;

export function CouponGrid({ coupons }: { coupons: Coupon[] }) {
  const [firm, setFirm] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("featured");
  const firms = useMemo(() => [...new Map(coupons.filter((c) => c.firm).map((c) => [c.firm!.slug, c.firm!.name])).entries()], [coupons]);

  const list = useMemo(() => {
    const l = coupons.filter((c) => !firm || c.firm?.slug === firm);
    if (sort === "discount") return [...l].sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
    if (sort === "ending") return [...l].sort((a, b) => (a.expiresAt ? Date.parse(a.expiresAt) : Infinity) - (b.expiresAt ? Date.parse(b.expiresAt) : Infinity));
    return l;
  }, [coupons, firm, sort]);

  if (coupons.length === 0)
    return (
      <EmptyState
        icon="ticket"
        title="فعلاً کد تخفیف فعالی نداریم."
        description="کدهای جدید به‌زودی اضافه می‌شوند. برای اطلاع، در خبرنامه یا کانال تلگرام عضو شو."
        action={<LinkButton href="/prop-firms/" variant="secondary">مشاهده پراپ‌فرم‌ها</LinkButton>}
      />
    );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="فیلتر پراپ‌فرم">
          {[[null, "همه"] as const, ...firms].map(([slug, name]) => (
            <button key={slug ?? "all"} role="tab" aria-selected={firm === slug} onClick={() => setFirm(slug)} className={cn("relative shrink-0 rounded-full px-4 py-1.5 text-sm transition", firm === slug ? "text-accent-contrast" : "text-muted hover:text-fg")}>
              {firm === slug && <motion.span layoutId="coupon-filter" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className={cn("relative", slug && "latin")}>{name}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">مرتب‌سازی:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-lg border border-line bg-card px-3">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((c, i) => (
            <motion.div key={c.id} layout initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.05 } }} exit={{ opacity: 0, scale: 0.95 }}>
              <CouponCard coupon={c} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
