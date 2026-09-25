"use client";

import Link from "next/link";
import { useLiveData } from "@/lib/hooks/useLiveData";
import { useNow } from "@/lib/hooks/useNow";
import { useTimezone } from "@/components/Providers";
import { formatClock, formatWeekday, toFaDigits } from "@/lib/format";
import type { EconomicEvent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { DataStatus } from "@/components/ui/DataStatus";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { ImpactBadge } from "./Impact";
import { EventValues } from "./EventValues";
import { TimezoneSwitch } from "./TimezoneSwitch";

function countdown(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return toFaDigits(h ? `${h} ساعت و ${m % 60} دقیقه` : `${m} دقیقه`);
}

export function NewsFeed({ limit, showMoreLink = false }: { limit?: number; showMoreLink?: boolean }) {
  const { tz } = useTimezone();
  const now = useNow(30_000);
  const { data, envelope, error, loading, retry } = useLiveData<EconomicEvent[]>(`/api/news/?tz=${encodeURIComponent(tz)}`, 120_000);
  const items = limit ? data?.slice(0, limit) : data;
  const nextId = now ? data?.find((e) => Date.parse(e.datetime) > now.getTime())?.id : undefined;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="latin rounded bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Forex Factory</span>
          <h3 className="font-bold">رویدادهای پراهمیت</h3>
        </div>
        <TimezoneSwitch />
      </div>

      {loading && !data ? (
        <ul className="divide-y divide-line" aria-busy>
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ))}
        </ul>
      ) : !data ? (
        <div className="p-5">
          <ErrorState message={error ?? "دریافت اخبار بازار با مشکل مواجه شد."} onRetry={retry} />
        </div>
      ) : items && items.length === 0 ? (
        <div className="p-5">
          <EmptyState icon="calendar" title="رویداد پراهمیتی در پیش نیست." description="در بازه فعلی خبر با اثر متوسط یا بالا ثبت نشده است." />
        </div>
      ) : (
        <ol className="divide-y divide-line">
          {items!.map((e) => {
            const past = now ? Date.parse(e.datetime) <= now.getTime() : false;
            const isNext = e.id === nextId;
            return (
              <li key={e.id} className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 py-4 transition-colors md:grid-cols-[88px_56px_28px_minmax(0,1fr)_260px] md:items-center", isNext && "bg-accent/[0.05]", past && "opacity-75")}>
                <div className="flex flex-col">
                  <time dateTime={e.datetime} className="num text-sm font-semibold">
                    {e.allDay ? "All day" : formatClock(e.datetime, tz, false)}
                  </time>
                  <span className="text-[11px] text-faint">{formatWeekday(e.datetime, tz)}</span>
                </div>
                <div className="flex items-center gap-3 md:contents">
                  <span className="latin w-fit rounded border border-line px-1.5 py-0.5 text-xs font-semibold">{e.currency}</span>
                  <ImpactBadge impact={e.impact} />
                  <p className="text-sm font-medium md:col-auto">
                    <span className="latin">{e.title}</span>
                    {isNext && now && <span className="ms-2 whitespace-nowrap rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">{countdown(Date.parse(e.datetime) - now.getTime())} دیگر</span>}
                  </p>
                </div>
                <EventValues e={e} className="col-span-2 md:col-span-1" />
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
        <DataStatus fetchedAt={envelope?.fetchedAt} source={envelope?.source} isMock={envelope?.isMock} stale={!!error} timeZone={tz} />
        {showMoreLink && (
          <Link href="/economic-calendar/" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
            تقویم کامل
            <Icon name="arrow-left" size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
