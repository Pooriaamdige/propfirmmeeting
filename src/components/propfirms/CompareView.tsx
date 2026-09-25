"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PropFirm } from "@/lib/types";
import { MAX_COMPARE, useCompare } from "@/components/Providers";
import { cn } from "@/lib/cn";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { COMPARE_ROWS } from "./compareRows";
import { FirmLogo, ReviewBadge, ReviewedAt } from "./shared";

export function CompareView({ firms, embedded = false }: { firms: PropFirm[]; embedded?: boolean }) {
  const { selected, toggle, set, remove, ready } = useCompare();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sortRow, setSortRow] = useState<string>("");
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [rowFilter, setRowFilter] = useState<"all" | "cost" | "risk" | "rules">("all");
  const hydrated = useRef(false);

  // URL → state (once), so shared links like /compare/?firms=ftmo,the5ers work.
  useEffect(() => {
    if (!ready || hydrated.current || embedded) return;
    hydrated.current = true;
    const fromUrl = params.get("firms")?.split(",").filter((s) => firms.some((f) => f.slug === s));
    if (fromUrl?.length) set(fromUrl);
  }, [ready, params, firms, set, embedded]);

  // state → URL
  useEffect(() => {
    if (!ready || embedded || !hydrated.current) return;
    const qs = selected.length ? `?firms=${selected.join(",")}` : "";
    router.replace(`${pathname}${qs}`, { scroll: false });
  }, [selected, ready, embedded, router, pathname]);

  const chosen = useMemo(() => {
    let list = selected.map((s) => firms.find((f) => f.slug === s)).filter(Boolean) as PropFirm[];
    const row = COMPARE_ROWS.find((r) => r.id === sortRow);
    if (row?.value) {
      list = [...list].sort((a, b) => {
        const va = row.value!(a) ?? 0;
        const vb = row.value!(b) ?? 0;
        return row.better === "low" ? va - vb : vb - va;
      });
    }
    return list;
  }, [selected, firms, sortRow]);

  const GROUPS: Record<typeof rowFilter, string[] | null> = {
    all: null,
    cost: ["fee", "target", "split", "payout", "refund", "scaling"],
    risk: ["daily", "max", "leverage", "days"],
    rules: ["news", "weekend", "ea"],
  };

  const rows = COMPARE_ROWS.filter((r) => !GROUPS[rowFilter] || GROUPS[rowFilter]!.includes(r.id)).filter((r) => {
    if (!onlyDiff || chosen.length < 2 || !r.value) return true;
    return new Set(chosen.map((f) => r.value!(f))).size > 1;
  });

  const best = (rowId: string) => {
    const r = COMPARE_ROWS.find((x) => x.id === rowId);
    if (!r?.value || chosen.length < 2) return null;
    const vals = chosen.map((f) => r.value!(f) ?? 0);
    const target = r.better === "low" ? Math.min(...vals) : Math.max(...vals);
    return vals.every((v) => v === target) ? null : target;
  };

  return (
    <div className="space-y-6">
      {/* Picker */}
      <div className="card p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            انتخاب پراپ‌فرم‌ها <span className="text-muted">(حداکثر {MAX_COMPARE.toLocaleString("fa-IR")} مورد)</span>
          </h2>
          <span className="num text-xs text-muted">
            {selected.length}/{MAX_COMPARE}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {firms.map((f) => {
            const on = selected.includes(f.slug);
            const disabled = !on && selected.length >= MAX_COMPARE;
            return (
              <button
                key={f.slug}
                onClick={() => toggle(f.slug)}
                disabled={disabled}
                aria-pressed={on}
                className={cn("flex items-center gap-2 rounded-lg border py-1.5 pe-3 ps-1.5 text-sm transition disabled:opacity-40", on ? "border-accent/60 bg-accent/10" : "border-line hover:border-line-strong")}
              >
                <FirmLogo firm={f} size={26} />
                <span className="latin font-medium">{f.name}</span>
                <Icon name={on ? "check" : "plus"} size={14} className={on ? "text-accent" : "text-faint"} />
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length === 0 ? (
        <EmptyState
          icon="scale"
          title="هنوز پراپ‌فرمی برای مقایسه انتخاب نکرده‌اید."
          description="حداقل دو پراپ‌فرم را از لیست بالا یا صفحه پراپ‌فرم‌ها انتخاب کنید."
          action={
            <LinkButton href="/prop-firms/" variant="secondary">
              مشاهده پراپ‌فرم‌ها
            </LinkButton>
          }
        />
      ) : (
        <>
          {/* Table controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex rounded-lg border border-line p-0.5" role="tablist" aria-label="فیلتر ویژگی‌ها">
              {(
                [
                  ["all", "همه"],
                  ["cost", "هزینه و سود"],
                  ["risk", "ریسک"],
                  ["rules", "قوانین"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={rowFilter === id} onClick={() => setRowFilter(id)} className={cn("flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition", rowFilter === id ? "bg-surface font-semibold" : "text-muted hover:text-fg")}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                فقط تفاوت‌ها
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted">مرتب‌سازی ستون‌ها:</span>
                <select value={sortRow} onChange={(e) => setSortRow(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-2 text-sm">
                  <option value="">ترتیب انتخاب</option>
                  {COMPARE_ROWS.filter((r) => r.value).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="card scrollbar-thin overflow-x-auto [contain:paint]" role="region" aria-label="جدول مقایسه" tabIndex={0}>
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">مقایسه پراپ‌فرم‌های انتخاب‌شده</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="sticky start-0 z-[1] w-44 bg-card p-4 text-start text-xs font-medium text-muted">
                    ویژگی
                  </th>
                  {chosen.map((f) => (
                    <th key={f.slug} scope="col" className="min-w-[170px] p-4 text-start align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/prop-firms/${f.slug}/`} className="flex items-center gap-2 hover:text-accent">
                          <FirmLogo firm={f} size={32} />
                          <span className="latin font-bold">{f.name}</span>
                        </Link>
                        <button onClick={() => remove(f.slug)} className="rounded p-1 text-faint hover:bg-surface hover:text-fg" aria-label={`حذف ${f.name}`}>
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <ReviewBadge status={f.status} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const b = best(r.id);
                  return (
                    <tr key={r.id} className="hover:bg-surface/40">
                      <th scope="row" className="sticky start-0 z-[1] bg-card p-4 text-start font-medium">
                        {r.label}
                        <span className="latin block text-[11px] font-normal text-faint">{r.labelEn}</span>
                      </th>
                      {chosen.map((f) => {
                        const isBest = b !== null && r.value && r.value(f) === b;
                        return (
                          <td key={f.slug} className={cn("p-4 align-middle", isBest && "bg-pos/[0.06]")}>
                            <div className="flex items-center gap-1.5">
                              {r.render(f)}
                              {isBest && <span className="sr-only">(بهترین مقدار)</span>}
                              {isBest && <Icon name="check" size={13} className="text-pos" aria-hidden />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row" className="sticky start-0 z-[1] bg-card p-4 text-start text-xs font-medium text-muted">
                    تاریخ بررسی
                  </th>
                  {chosen.map((f) => (
                    <td key={f.slug} className="p-4">
                      <ReviewedAt firm={f} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs leading-6 text-muted">
            <Icon name="info" size={13} className="me-1 inline text-faint" />
            مقادیر برای حساب مرجع هر پراپ‌فرم (معمولاً ۱۰۰ هزار دلاری) نمایش داده شده‌اند. علامت <Icon name="check" size={12} className="inline text-pos" /> مطلوب‌ترین مقدار عددی هر ردیف را نشان می‌دهد و به معنی توصیه نیست.
          </p>
        </>
      )}
    </div>
  );
}
