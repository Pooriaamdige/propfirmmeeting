"use client";

import { useMemo, useState } from "react";
import { useLiveData } from "@/lib/hooks/useLiveData";
import { useNow } from "@/lib/hooks/useNow";
import { useTimezone } from "@/components/Providers";
import { dayKey, formatClock, formatWeekday } from "@/lib/format";
import type { CalendarRange, Currency, EconomicEvent, Impact } from "@/lib/types";
import { cn } from "@/lib/cn";
import { DataStatus } from "@/components/ui/DataStatus";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { IMPACT_META, ImpactBadge } from "./Impact";
import { EventValues } from "./EventValues";
import { TimezoneSwitch } from "./TimezoneSwitch";

const RANGES: { id: CalendarRange; label: string }[] = [
  { id: "today", label: "امروز" },
  { id: "tomorrow", label: "فردا" },
  { id: "this-week", label: "این هفته" },
  { id: "next-week", label: "هفته آینده" },
];
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];
const IMPACTS: Impact[] = ["high", "medium", "low"];

function Chip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition", active ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:border-line-strong hover:text-fg", className)}>
      {children}
    </button>
  );
}

export function EconomicCalendar({ compact = false }: { compact?: boolean }) {
  const { tz } = useTimezone();
  const now = useNow(60_000);
  const [range, setRange] = useState<CalendarRange>(compact ? "today" : "this-week");
  const [currencies, setCurrencies] = useState<Set<Currency>>(new Set());
  const [impacts, setImpacts] = useState<Set<Impact>>(new Set());
  const { data, envelope, error, loading, retry } = useLiveData<EconomicEvent[]>(`/api/calendar/?range=${range}&tz=${encodeURIComponent(tz)}`, 300_000);

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  const groups = useMemo(() => {
    const filtered = (data ?? []).filter((e) => (currencies.size === 0 || currencies.has(e.currency)) && (impacts.size === 0 || impacts.has(e.impact)));
    const map = new Map<string, EconomicEvent[]>();
    for (const e of filtered) {
      const k = dayKey(new Date(e.datetime), tz);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()];
  }, [data, currencies, impacts, tz]);

  const filtersActive = currencies.size > 0 || impacts.size > 0;

  return (
    <div className="card overflow-hidden">
      {/* Controls */}
      <div className="space-y-4 border-b border-line p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-line p-0.5" role="tablist" aria-label="بازه زمانی">
            {RANGES.map((r) => (
              <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)} className={cn("rounded-md px-3 py-1.5 text-sm transition", range === r.id ? "bg-surface font-semibold text-fg" : "text-muted hover:text-fg")}>
                {r.label}
              </button>
            ))}
          </div>
          <TimezoneSwitch />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="فیلتر ارز">
            <span className="me-1 text-xs text-muted">ارز:</span>
            {CURRENCIES.map((c) => (
              <Chip key={c} active={currencies.has(c)} onClick={() => toggle(currencies, c, setCurrencies)} className="latin">
                {c}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="فیلتر اهمیت">
            <span className="me-1 text-xs text-muted">اهمیت:</span>
            {IMPACTS.map((i) => (
              <Chip key={i} active={impacts.has(i)} onClick={() => toggle(impacts, i, setImpacts)}>
                <span className="inline-flex items-center gap-1.5">
                  <ImpactBadge impact={i} />
                  <span className="latin">{IMPACT_META[i].label}</span>
                </span>
              </Chip>
            ))}
          </div>
          {filtersActive && (
            <button
              onClick={() => {
                setCurrencies(new Set());
                setImpacts(new Set());
              }}
              className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline md:ms-auto"
            >
              حذف فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {loading && !data ? (
        <div className="space-y-3 p-5" aria-busy>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-48 md:block" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="p-5">
          <ErrorState message={error ?? "دریافت تقویم اقتصادی با مشکل مواجه شد."} onRetry={retry} />
        </div>
      ) : groups.length === 0 ? (
        <div className="p-5">
          <EmptyState icon="calendar" title={filtersActive ? "رویدادی با این فیلترها پیدا نشد." : "رویدادی در این بازه ثبت نشده است."} description={range === "next-week" ? "تقویم هفته آینده معمولاً از اواخر هفته جاری منتشر می‌شود." : undefined} />
        </div>
      ) : (
        <div className={cn(compact && "scrollbar-thin max-h-[560px] overflow-y-auto")}>
          {groups.map(([day, events]) => (
            <section key={day} aria-label={formatWeekday(events[0].datetime, tz)}>
              <h4 className="sticky top-0 z-[1] border-b border-line bg-surface/95 px-5 py-2 text-xs font-semibold text-muted backdrop-blur">{formatWeekday(events[0].datetime, tz)}</h4>
              <table className="w-full table-fixed text-sm">
                <thead className="sr-only md:not-sr-only">
                  <tr className="border-b border-line text-[11px] text-faint">
                    <th scope="col" className="w-24 px-5 py-2 text-start font-normal">زمان</th>
                    <th scope="col" className="w-16 py-2 text-start font-normal">ارز</th>
                    <th scope="col" className="w-16 py-2 text-start font-normal">اهمیت</th>
                    <th scope="col" className="py-2 text-start font-normal">رویداد</th>
                    <th scope="col" className="hidden w-72 py-2 pe-5 text-start font-normal md:table-cell">Actual / Forecast / Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {events.map((e) => {
                    const past = now ? Date.parse(e.datetime) <= now.getTime() : false;
                    return (
                      <tr key={e.id} className={cn("align-top transition-colors hover:bg-surface/50", past && "text-fg/70")}>
                        <td className="px-5 py-3">
                          <time dateTime={e.datetime} className="num font-medium">
                            {e.allDay ? "All day" : formatClock(e.datetime, tz, false)}
                          </time>
                        </td>
                        <td className="latin py-3 font-semibold">{e.currency}</td>
                        <td className="py-3.5">
                          <ImpactBadge impact={e.impact} />
                        </td>
                        <td className="py-3 pe-4">
                          <span className="latin block">{e.title}</span>
                          <EventValues e={e} className="mt-2 max-w-xs md:hidden" />
                        </td>
                        <td className="hidden py-3 pe-5 md:table-cell">
                          <EventValues e={e} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      <div className="border-t border-line px-5 py-3">
        <DataStatus fetchedAt={envelope?.fetchedAt} source={envelope?.source} isMock={envelope?.isMock} stale={!!error} timeZone={tz} />
      </div>
    </div>
  );
}
