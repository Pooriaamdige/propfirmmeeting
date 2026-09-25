"use client";

import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi, SeriesType, Time, UTCTimestamp } from "lightweight-charts";
import { useLiveData } from "@/lib/hooks/useLiveData";
import { CHART_SYMBOLS, SYMBOLS } from "@/lib/symbols";
import { TEHRAN_TZ, formatPrice } from "@/lib/format";
import type { Candle, SymbolCode, Timeframe } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Change } from "@/components/ui/Change";
import { DataStatus } from "@/components/ui/DataStatus";
import { ErrorState } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h", label: "1H" },
  { id: "4h", label: "4H" },
  { id: "1d", label: "1D" },
];

const REFRESH: Record<Timeframe, number> = { "1m": 20_000, "5m": 30_000, "15m": 60_000, "1h": 120_000, "4h": 300_000, "1d": 600_000 };

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TEHRAN_TZ, hour12: false, ...opts });
const fmtTime = fmt({ hour: "2-digit", minute: "2-digit" });
const fmtDay = fmt({ day: "2-digit", month: "short" });
const fmtFull = fmt({ day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function ForexChart({ initialSymbol = "XAUUSD" }: { initialSymbol?: SymbolCode }) {
  const [symbol, setSymbol] = useState<SymbolCode>(initialSymbol);
  const [tf, setTf] = useState<Timeframe>("15m");
  const [type, setType] = useState<"candles" | "line">("candles");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const libRef = useRef<typeof import("lightweight-charts") | null>(null);
  const [ready, setReady] = useState(false);

  const { data, envelope, error, loading, retry } = useLiveData<Candle[]>(`/api/market/chart/?symbol=${symbol}&tf=${tf}&limit=300`, REFRESH[tf]);

  const [lastInitial, setLastInitial] = useState(initialSymbol);
  if (lastInitial !== initialSymbol) {
    setLastInitial(initialSymbol);
    setSymbol(initialSymbol);
  }

  // Create the chart once (library is code-split and loaded on demand).
  useEffect(() => {
    let disposed = false;
    let observer: MutationObserver | null = null;
    import("lightweight-charts").then((lib) => {
      if (disposed || !containerRef.current) return;
      libRef.current = lib;
      const theme = () => ({
        layout: { background: { color: "transparent" }, textColor: cssVar("--muted"), fontFamily: "Vazirmatn, system-ui, sans-serif", attributionLogo: true },
        grid: { vertLines: { color: cssVar("--grid-line") }, horzLines: { color: cssVar("--grid-line") } },
        rightPriceScale: { borderColor: cssVar("--border") },
        timeScale: { borderColor: cssVar("--border") },
      });
      const chart = lib.createChart(containerRef.current, {
        autoSize: true,
        ...theme(),
        crosshair: { mode: lib.CrosshairMode.Normal },
        localization: { locale: "en-US", timeFormatter: (t: Time) => fmtFull.format(new Date((t as number) * 1000)) },
        timeScale: {
          borderColor: cssVar("--border"),
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (t: Time, type: number) => {
            const d = new Date((t as number) * 1000);
            return type <= lib.TickMarkType.DayOfMonth ? fmtDay.format(d) : fmtTime.format(d);
          },
        },
      });
      chartRef.current = chart;
      // Follow theme switches.
      observer = new MutationObserver(() => chart.applyOptions(theme()));
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      setReady(true);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // (Re)create the series when the chart type changes.
  useEffect(() => {
    const chart = chartRef.current;
    const lib = libRef.current;
    if (!ready || !chart || !lib) return;
    if (seriesRef.current) chart.removeSeries(seriesRef.current);
    const pos = cssVar("--pos");
    const neg = cssVar("--neg");
    const digits = SYMBOLS[symbol].digits;
    const priceFormat = { type: "price" as const, precision: digits, minMove: 1 / 10 ** digits };
    seriesRef.current =
      type === "candles"
        ? chart.addSeries(lib.CandlestickSeries, { upColor: pos, downColor: neg, borderVisible: false, wickUpColor: pos, wickDownColor: neg, priceFormat })
        : chart.addSeries(lib.AreaSeries, { lineColor: cssVar("--accent"), topColor: cssVar("--glow"), bottomColor: "transparent", lineWidth: 2, priceFormat });
  }, [type, ready, symbol]);

  // Push data.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !data) return;
    if (type === "candles") series.setData(data.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
    else series.setData(data.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
  }, [data, type, ready]);

  // Fit on symbol / timeframe change.
  useEffect(() => {
    if (data) chartRef.current?.timeScale().fitContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tf, !!data]);

  const last = data?.at(-1);
  const first = data?.[0];
  const changePct = last && first ? ((last.close - first.open) / first.open) * 100 : 0;

  return (
    <div className="card overflow-hidden">
      {/* Symbol selector */}
      <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-line p-2" role="tablist" aria-label="انتخاب نماد">
        {CHART_SYMBOLS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={s === symbol}
            onClick={() => setSymbol(s)}
            className={cn("latin shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition", s === symbol ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-fg")}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-baseline gap-3">
          <h3 className="latin text-lg font-bold">{SYMBOLS[symbol].label}</h3>
          <span className="text-xs text-muted">{SYMBOLS[symbol].faName}</span>
          {last && <span className="num text-lg font-semibold">{formatPrice(symbol, last.close)}</span>}
          {last && <Change value={changePct} className="text-xs" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line p-0.5" role="group" aria-label="تایم‌فریم">
            {TIMEFRAMES.map((t) => (
              <button key={t.id} onClick={() => setTf(t.id)} aria-pressed={t.id === tf} className={cn("latin rounded-md px-2.5 py-1 text-xs font-medium transition", t.id === tf ? "bg-surface text-fg" : "text-muted hover:text-fg")}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-line p-0.5" role="group" aria-label="نوع نمودار">
            <button onClick={() => setType("candles")} aria-pressed={type === "candles"} aria-label="نمودار شمعی" title="Candlestick" className={cn("rounded-md p-1.5 transition", type === "candles" ? "bg-surface text-fg" : "text-muted")}>
              <Icon name="candles" size={16} />
            </button>
            <button onClick={() => setType("line")} aria-pressed={type === "line"} aria-label="نمودار خطی" title="Line" className={cn("rounded-md p-1.5 transition", type === "line" ? "bg-surface text-fg" : "text-muted")}>
              <Icon name="chart" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[380px] px-2 pb-2 pt-3 md:h-[480px]" dir="ltr">
        <div ref={containerRef} className="h-full w-full" aria-label={`نمودار ${SYMBOLS[symbol].label} تایم‌فریم ${tf}`} role="img" />
        {(loading || !ready) && !data && (
          <div className="absolute inset-0 flex items-end gap-1.5 px-6 pb-10 pt-12" aria-hidden>
            {Array.from({ length: 48 }, (_, i) => (
              <div key={i} className="skeleton flex-1" style={{ height: `${30 + ((i * 37) % 55)}%`, animationDelay: `${i * 20}ms` }} />
            ))}
          </div>
        )}
        {!data && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 p-6" dir="rtl">
            <ErrorState message={error} onRetry={retry} />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <DataStatus fetchedAt={envelope?.fetchedAt} source={envelope?.source} isMock={envelope?.isMock} stale={!!error} />
        <span className="text-[11px] text-faint">زمان محور افقی: تهران</span>
      </div>
    </div>
  );
}
