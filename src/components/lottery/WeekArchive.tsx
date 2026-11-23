"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseLotteryWeek } from "@/lib/lottery-winners";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export function WeekArchive({ weeks, selected }: { weeks: number[]; selected: number | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filtered = query.trim() ? weeks.filter((w) => String(w).includes(String(parseLotteryWeek(query) ?? "invalid"))) : weeks;
  return <nav aria-label="آرشیو هفته‌های قرعه‌کشی" className="card p-4 sm:p-5 lg:sticky lg:top-24">
    <h2 className="mb-4 flex items-center gap-2 font-bold"><Icon name="calendar" size={18} className="text-accent" /> آرشیو هفته‌ها</h2>
    <label className="mb-2 block text-xs text-muted" htmlFor="lottery-week">انتخاب هفته</label>
    <select id="lottery-week" value={selected ?? ""} onChange={(e) => router.push(`/lottery-winners/?week=${e.target.value}`, { scroll: false })} className="h-12 w-full rounded-lg border border-line bg-card px-3 text-sm outline-none focus:border-accent">
      {selected === null && <option value="" disabled>انتخاب کنید</option>}
      {weeks.map((week, i) => <option key={week} value={week}>هفته {week.toLocaleString("fa-IR")}{i === 0 ? "، جدیدترین" : ""}</option>)}
    </select>
    <details className="mt-4">
      <summary className="cursor-pointer py-2 text-sm text-muted hover:text-fg">جستجو و مشاهده همه هفته‌ها</summary>
      <label className="relative mt-3 block">
        <span className="sr-only">جستجوی شماره هفته</span>
        <Icon name="search" size={16} className="absolute start-3 top-3.5 text-faint" />
        <input type="search" inputMode="numeric" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="شماره هفته، مثلاً ۵۲" className="h-11 w-full rounded-lg border border-line bg-surface/50 pe-3 ps-9 text-sm outline-none focus:border-accent" />
      </label>
      <div className="mt-3 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-2">
        {filtered.map((week) => <Link key={week} href={`/lottery-winners/?week=${week}`} scroll={false} aria-current={selected === week ? "page" : undefined} className={cn("rounded-lg border px-2 py-3 text-center text-sm transition hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent", selected === week ? "border-accent/40 bg-accent/10 font-bold text-accent" : "border-line text-muted")}>
          هفته {week.toLocaleString("fa-IR")}
        </Link>)}
      </div>
      {!filtered.length && <p role="status" className="py-4 text-sm text-muted">هفته‌ای با این شماره پیدا نشد.</p>}
    </details>
  </nav>;
}
