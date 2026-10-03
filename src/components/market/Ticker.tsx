"use client";

import { useLiveData } from "@/lib/hooks/useLiveData";
import { TICKER_SYMBOLS } from "@/lib/symbols";
import { formatPrice } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { Change } from "@/components/ui/Change";
import { DataStatus } from "@/components/ui/DataStatus";
import { Icon } from "@/components/ui/Icon";

function TickerItem({ q }: { q: Quote }) {
  return (
    <li className="flex shrink-0 items-center gap-3 border-e border-line px-6 py-3">
      <span className="latin text-[13px] font-semibold text-fg">{q.symbol}</span>
      <span className="num text-[13px] text-fg/85">{formatPrice(q.symbol, q.price)}</span>
      <Change value={q.changePercent} className="text-xs" />
    </li>
  );
}

export function Ticker() {
  const { data, envelope, error, loading, retry } = useLiveData<Quote[]>(`/api/market/quotes/?symbols=${TICKER_SYMBOLS.join(",")}`, 5_000);

  return (
    <section aria-label="نوار قیمت بازار" className="relative border-y border-line bg-surface/60">
      {loading && !data ? (
        <div className="flex gap-8 overflow-hidden px-6 py-3" aria-busy>
          {TICKER_SYMBOLS.map((s) => (
            <div key={s} className="flex shrink-0 items-center gap-3">
              <div className="skeleton h-3.5 w-14" />
              <div className="skeleton h-3.5 w-16" />
              <div className="skeleton h-3.5 w-10" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center gap-3 px-4 py-3 text-sm text-muted" role="alert">
          <Icon name="alert" size={16} className="text-neg" />
          {error ?? "اطلاعات لحظه‌ای موقتاً در دسترس نیست."}
          <button onClick={retry} className="text-accent underline-offset-4 hover:underline">
            تلاش مجدد
          </button>
        </div>
      ) : (
        <div className="ticker overflow-hidden motion-reduce:overflow-x-auto" dir="ltr">
          <div className="ticker-track flex w-max">
            <ul className="flex">
              {data.map((q) => (
                <TickerItem key={q.symbol} q={q} />
              ))}
            </ul>
            <ul className="flex motion-reduce:hidden" aria-hidden>
              {data.map((q) => (
                <TickerItem key={q.symbol} q={q} />
              ))}
            </ul>
          </div>
        </div>
      )}
      {envelope && (
        <div className="mx-auto flex max-w-7xl justify-end px-4 pb-1.5 sm:px-6 lg:px-8">
          <DataStatus fetchedAt={envelope.fetchedAt} source={envelope.source} isMock={envelope.isMock} stale={!!error} className="text-[11px]" />
        </div>
      )}
    </section>
  );
}
