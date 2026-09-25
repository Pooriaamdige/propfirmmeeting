"use client";

import { useLiveData } from "@/lib/hooks/useLiveData";
import { OVERVIEW_SYMBOLS, SYMBOLS } from "@/lib/symbols";
import { formatCompact, formatPrice } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { Change } from "@/components/ui/Change";
import { DataStatus } from "@/components/ui/DataStatus";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { Sparkline } from "./Sparkline";
import { usePriceFlash } from "./usePriceFlash";

interface OverviewItem {
  quote: Quote;
  spark: number[];
}

const FA_TITLES: Partial<Record<string, string>> = { XAUUSD: "طلا", EURUSD: "یورو / دلار", GBPUSD: "پوند / دلار", USDJPY: "دلار / ین", BTCUSD: "بیت‌کوین", DXY: "شاخص دلار" };

function OverviewCard({ item }: { item: OverviewItem }) {
  const { quote: q, spark } = item;
  const flash = usePriceFlash(q.price);
  const up = q.changePercent >= 0;
  return (
    <article className="card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:border-line-strong">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold">{FA_TITLES[q.symbol] ?? SYMBOLS[q.symbol].faName}</h3>
          <p className="latin mt-0.5 text-xs text-muted">{SYMBOLS[q.symbol].label}</p>
        </div>
        <Change value={q.changePercent} className={`rounded-md px-2 py-1 text-xs ${up ? "bg-pos/10" : "bg-neg/10"}`} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className={`num rounded-md text-[1.65rem] font-bold leading-none tracking-tight ${flash}`}>{formatPrice(q.symbol, q.price)}</p>
        <Sparkline values={spark} positive={up} width={110} height={40} />
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-xs">
        <div>
          <dt className="text-muted">High</dt>
          <dd className="num mt-1 font-medium">{q.high !== null ? formatPrice(q.symbol, q.high) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Low</dt>
          <dd className="num mt-1 font-medium">{q.low !== null ? formatPrice(q.symbol, q.low) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">حجم</dt>
          <dd className="num mt-1 font-medium" title={q.volume === null ? "حجم متمرکز برای این نماد در دسترس نیست" : undefined}>
            {q.volume !== null ? formatCompact(q.volume) : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function MarketOverview() {
  const { data, envelope, error, loading, retry } = useLiveData<OverviewItem[]>(`/api/market/overview/?symbols=${OVERVIEW_SYMBOLS.join(",")}`, 20_000);

  return (
    <div>
      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {OVERVIEW_SYMBOLS.map((s) => (
            <div key={s} className="card space-y-4 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <ErrorState message="دریافت اطلاعات بازار با مشکل مواجه شد." onRetry={retry} />
      ) : (
        <>
          {error && <ErrorState compact message={error} lastUpdated={envelope?.fetchedAt} onRetry={retry} />}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <OverviewCard key={item.quote.symbol} item={item} />
            ))}
          </div>
        </>
      )}
      <DataStatus className="mt-4" fetchedAt={envelope?.fetchedAt} source={envelope?.source} isMock={envelope?.isMock} stale={!!error} />
    </div>
  );
}
