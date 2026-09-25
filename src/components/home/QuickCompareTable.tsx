"use client";

import Link from "next/link";
import { useState } from "react";
import type { PropFirm } from "@/lib/types";
import { cn } from "@/lib/cn";
import { COMPARE_ROWS } from "@/components/propfirms/compareRows";
import { FirmLogo } from "@/components/propfirms/shared";
import { CompareButton } from "@/components/propfirms/CompareButton";

const COLS = ["fee", "target", "daily", "max", "split", "days", "news"];

/** Sortable overview of all firms (homepage). */
export function QuickCompareTable({ firms }: { firms: PropFirm[] }) {
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 }>({ id: "fee", dir: 1 });
  const rows = COMPARE_ROWS.filter((r) => COLS.includes(r.id));
  const sortRow = COMPARE_ROWS.find((r) => r.id === sort.id);
  const sorted = sortRow?.value ? [...firms].sort((a, b) => ((sortRow.value!(a) ?? 0) - (sortRow.value!(b) ?? 0)) * sort.dir) : firms;

  return (
    <div className="card scrollbar-thin overflow-x-auto [contain:paint]" role="region" aria-label="جدول مقایسه سریع" tabIndex={0}>
      <table className="w-full min-w-[860px] text-sm">
        <caption className="sr-only">مقایسه سریع شرایط اصلی پراپ‌فرم‌ها — برای مرتب‌سازی روی عنوان ستون کلیک کنید</caption>
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="sticky start-0 z-[1] bg-card px-5 py-3 text-start font-medium">
              پراپ‌فرم
            </th>
            {rows.map((r) => {
              const active = sort.id === r.id;
              return (
                <th key={r.id} scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="px-3 py-3 text-start font-medium">
                  <button onClick={() => setSort((s) => ({ id: r.id, dir: s.id === r.id ? ((s.dir * -1) as 1 | -1) : 1 }))} className={cn("inline-flex items-center gap-1 hover:text-fg", active && "text-fg")}>
                    {r.label}
                    <span aria-hidden className={cn("text-[9px]", !active && "opacity-30")}>
                      {active && sort.dir === -1 ? "▼" : "▲"}
                    </span>
                  </button>
                </th>
              );
            })}
            <th scope="col" className="px-5 py-3">
              <span className="sr-only">عملیات</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((f) => (
            <tr key={f.slug} className="transition-colors hover:bg-surface/50">
              <th scope="row" className="sticky start-0 z-[1] bg-card px-5 py-3 text-start">
                <Link href={`/prop-firms/${f.slug}/`} className="flex items-center gap-2.5 hover:text-accent">
                  <FirmLogo firm={f} size={30} />
                  <span className="latin font-semibold">{f.name}</span>
                </Link>
              </th>
              {rows.map((r) => (
                <td key={r.id} className="px-3 py-3">
                  {r.render(f)}
                </td>
              ))}
              <td className="px-5 py-3 text-end">
                <CompareButton slug={f.slug} name={f.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
