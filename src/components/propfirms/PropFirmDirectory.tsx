"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PropFirm } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { PropFirmCard } from "./PropFirmCard";

const SORTS = [
  { id: "fee", label: "کمترین هزینه", fn: (a: PropFirm, b: PropFirm) => a.challengeFee.fee / a.challengeFee.accountSize - b.challengeFee.fee / b.challengeFee.accountSize },
  { id: "split", label: "بیشترین تقسیم سود", fn: (a: PropFirm, b: PropFirm) => b.profitSplit.max - a.profitSplit.max },
  { id: "drawdown", label: "بیشترین دراداون مجاز", fn: (a: PropFirm, b: PropFirm) => b.maxDrawdown.value - a.maxDrawdown.value || b.dailyDrawdown.value - a.dailyDrawdown.value },
  { id: "days", label: "کمترین روز معاملاتی", fn: (a: PropFirm, b: PropFirm) => (a.minimumTradingDays ?? 99) - (b.minimumTradingDays ?? 99) },
  { id: "reviewed", label: "جدیدترین بررسی", fn: (a: PropFirm, b: PropFirm) => b.lastReviewedAt.localeCompare(a.lastReviewedAt) },
] as const;

const FILTERS = [
  { id: "news", label: "معامله در اخبار (بدون محدودیت)", test: (f: PropFirm) => f.newsTrading.status === "allowed" },
  { id: "weekend", label: "نگه‌داشتن آخر هفته", test: (f: PropFirm) => f.weekendHolding.status === "allowed" },
  { id: "ea", label: "اکسپرت مجاز", test: (f: PropFirm) => f.eaAllowed.status === "allowed" },
  { id: "refund", label: "بازگشت هزینه", test: (f: PropFirm) => f.refundPolicy.available },
  { id: "dd10", label: "دراداون کلی ۱۰٪", test: (f: PropFirm) => f.maxDrawdown.value >= 10 },
] as const;

export function PropFirmDirectory({ firms, limit }: { firms: PropFirm[]; limit?: number }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("fee");
  const [filters, setFilters] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return firms
      .filter((f) => !term || f.name.toLowerCase().includes(term) || f.program.toLowerCase().includes(term) || (f.country ?? "").includes(term))
      .filter((f) => FILTERS.every((flt) => !filters.has(flt.id) || flt.test(f)))
      .sort(SORTS.find((s) => s.id === sort)!.fn)
      .slice(0, limit);
  }, [firms, q, sort, filters, limit]);

  const toggle = (id: string) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">جستجوی پراپ‌فرم</span>
            <Icon name="search" size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی نام پراپ‌فرم…" className="h-11 w-full rounded-lg border border-line bg-card ps-9 pe-3 text-sm outline-none transition placeholder:text-faint focus:border-accent/60" />
          </label>
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-muted">مرتب‌سازی:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-11 flex-1 rounded-lg border border-line bg-card px-3 text-sm outline-none focus:border-accent/60">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="فیلترها">
          <Icon name="filter" size={14} className="me-1 text-faint" />
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => toggle(f.id)} aria-pressed={filters.has(f.id)} className={cn("rounded-full border px-3 py-1 text-xs transition", filters.has(f.id) ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="search" title="پراپ‌فرمی با این شرایط پیدا نشد." description="فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((f) => (
            <PropFirmCard key={f.id} firm={f} />
          ))}
        </div>
      )}
    </div>
  );
}
