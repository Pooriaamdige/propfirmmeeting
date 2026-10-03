"use client";

import { useState } from "react";
import { useLiveData } from "@/lib/hooks/useLiveData";
import { HERO_SYMBOLS, SYMBOLS } from "@/lib/symbols";
import { formatPrice } from "@/lib/format";
import type { Candle, Quote, SymbolCode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Change } from "@/components/ui/Change";
import { DataStatus } from "@/components/ui/DataStatus";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { AreaChart } from "./AreaChart";
import { usePriceFlash } from "./usePriceFlash";

function QuoteRow({ q, active, onSelect }: { q: Quote; active: boolean; onSelect: () => void }) {
  const flash = usePriceFlash(q.price);
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-start transition", active ? "bg-surface ring-1 ring-line-strong" : "hover:bg-surface/60", flash)}
    >
      <span>
        <span className="latin block text-[13px] font-semibold">{q.symbol}</span>
        <span className="block text-[11px] text-muted">{SYMBOLS[q.symbol].faName}</span>
      </span>
      <span className="text-end">
        <span className="num block text-[13px] font-semibold">{formatPrice(q.symbol, q.price)}</span>
        <Change value={q.changePercent} className="text-[11px]" />
      </span>
    </button>
  );
}

export function HeroDashboard() {
  const [symbol, setSymbol] = useState<SymbolCode>("XAUUSD");
  const quotes = useLiveData<Quote[]>(`/api/market/quotes/?symbols=${HERO_SYMBOLS.join(",")}`, 5_000);
  const chart = useLiveData<Candle[]>(`/api/market/chart/?symbol=${symbol}&tf=15m&limit=96`, 60_000);
  const active = quotes.data?.find((q) => q.symbol === symbol);

  return (
    <div className="relative" style={{ animation: "float 9s ease-in-out infinite" }}>
      <div className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-2xl" aria-hidden />
      {/* floating live chips */}
      {quotes.data && (
        <>
          {quotes.data.slice(0, 2).map((q, i) => (
            <div key={q.symbol} className={cn("absolute z-10 hidden items-center gap-2 rounded-xl border border-line-strong bg-card/90 px-3 py-2 text-xs shadow-card backdrop-blur md:flex", i === 0 ? "float-slow -top-4 start-1/3" : "float-slower -bottom-5 end-10")}>
              <span className={cn("h-1.5 w-1.5 rounded-full live-dot", q.changePercent >= 0 ? "bg-pos" : "bg-neg")} aria-hidden />
              <span className="latin font-semibold">{q.symbol}</span>
              <Change value={q.changePercent} className="text-[11px]" />
            </div>
          ))}
        </>
      )}
      <div className="card border-beam relative overflow-hidden rounded-2xl" aria-label="داشبورد بازار">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-neg/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-pos/70" />
          </div>
          <span className="latin text-[11px] uppercase tracking-[0.2em] text-muted">Market Monitor</span>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1fr_190px]">
          {/* chart */}
          <div className="border-b border-line p-4 sm:border-b-0 sm:border-e">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <p className="latin text-xs text-muted">{SYMBOLS[symbol].label} · 15m</p>
                {active ? (
                  <p className="num mt-1 text-2xl font-bold tracking-tight">{formatPrice(symbol, active.price)}</p>
                ) : (
                  <Skeleton className="mt-2 h-7 w-32" />
                )}
              </div>
              {active && <Change value={active.changePercent} className="rounded-md bg-surface px-2 py-1 text-xs" />}
            </div>
            <div className="h-44">
              {chart.data ? (
                <AreaChart key={symbol + chart.envelope?.fetchedAt} candles={chart.data} positive={(active?.changePercent ?? 0) >= 0} height={176} />
              ) : chart.error ? (
                <ErrorState compact message={chart.error} onRetry={chart.retry} />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </div>

          {/* watchlist */}
          <div className="space-y-1 p-2">
            {quotes.data
              ? quotes.data.map((q) => <QuoteRow key={q.symbol} q={q} active={q.symbol === symbol} onSelect={() => setSymbol(q.symbol)} />)
              : quotes.error
                ? <ErrorState compact message={quotes.error} onRetry={quotes.retry} />
                : HERO_SYMBOLS.map((s) => <Skeleton key={s} className="h-[52px] w-full" />)}
          </div>
        </div>
        <div className="border-t border-line px-4 py-2">
          <DataStatus fetchedAt={quotes.envelope?.fetchedAt} source={quotes.envelope?.source} isMock={quotes.envelope?.isMock} stale={!!quotes.error} className="text-[11px]" />
        </div>
      </div>
    </div>
  );
}
