"use client";

import { useMemo, useState } from "react";
import { useLiveData } from "@/lib/hooks/useLiveData";
import { SYMBOLS, TICKER_SYMBOLS } from "@/lib/symbols";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Quote, SymbolCode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Field, Output, inputClass, parseNum } from "./Field";

const LEVERAGES = [1, 2, 5, 10, 20, 30, 50, 100, 200, 500];
const LEVERAGE_CHIPS = [30, 50, 100];
const LOT_CHIPS = [0.01, 0.1, 0.5, 1];

/** Required margin in USD for `lots` of `symbol` at `price` with leverage 1:`leverage`. */
export function requiredMargin(symbol: SymbolCode, lots: number, price: number, leverage: number): number {
  const notionalBase = lots * SYMBOLS[symbol].contractSize;
  // USD/xxx pairs: the base currency is already USD. Everything else here is quoted in USD.
  const notionalUsd = symbol.startsWith("USD") ? notionalBase : notionalBase * price;
  return notionalUsd / leverage;
}

export function MarginCalculator() {
  const [symbol, setSymbol] = useState<SymbolCode>("XAUUSD");
  const [lots, setLots] = useState("1");
  const [leverage, setLeverage] = useState(100);
  const [account, setAccount] = useState("10000");
  const [priceInput, setPriceInput] = useState<string | null>(null);
  const quotes = useLiveData<Quote[]>(`/api/market/quotes/?symbols=${TICKER_SYMBOLS.join(",")}`, 0);
  const liveQuote = quotes.data?.find((x) => x.symbol === symbol);
  const price = priceInput ?? String(liveQuote ? Number(liveQuote.price.toFixed(SYMBOLS[symbol].digits)) : SYMBOLS[symbol].mockAnchor);
  const meta = SYMBOLS[symbol];

  const result = useMemo(() => {
    const l = parseNum(lots);
    const p = parseNum(price);
    const a = parseNum(account);
    if (!(l > 0 && p > 0)) return null;
    const margin = requiredMargin(symbol, l, p, leverage);
    const notional = margin * leverage;
    const perLot = requiredMargin(symbol, 1, p, leverage);
    return {
      margin,
      notional,
      units: l * meta.contractSize,
      share: a > 0 ? (margin / a) * 100 : null,
      free: a > 0 ? a - margin : null,
      maxLots: a > 0 ? Math.floor((a / perLot) * 100) / 100 : null,
    };
  }, [lots, price, account, leverage, symbol, meta.contractSize]);

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <form className="space-y-5 p-5 md:p-6" onSubmit={(e) => e.preventDefault()} aria-label="ورودی‌های محاسبه‌گر مارجین">
        <div className="grid grid-cols-2 gap-4">
          <Field label="نماد" hint="Instrument" htmlFor="mg-symbol">
            <select id="mg-symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value as SymbolCode); setPriceInput(null); }} className={cn(inputClass, "latin")}>
              {TICKER_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ارز حساب" hint="Account Currency" htmlFor="mg-currency">
            <select id="mg-currency" value="USD" disabled className={cn(inputClass, "latin opacity-80")}>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>

        <div>
          <Field label="حجم معامله" hint="Lot Size" htmlFor="mg-lots" suffix="lot">
            <input id="mg-lots" inputMode="decimal" value={lots} onChange={(e) => setLots(e.target.value)} aria-invalid={!(parseNum(lots) > 0)} className={inputClass} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LOT_CHIPS.map((v) => (
              <button key={v} type="button" onClick={() => setLots(String(v))} className={cn("num rounded-md border px-2 py-1 text-xs transition", parseNum(lots) === v ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Field label="لوریج" hint="Leverage" htmlFor="mg-leverage">
            <select id="mg-leverage" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className={cn(inputClass, "num")}>
              {LEVERAGES.map((v) => (
                <option key={v} value={v}>
                  1:{v}
                </option>
              ))}
            </select>
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LEVERAGE_CHIPS.map((v) => (
              <button key={v} type="button" onClick={() => setLeverage(v)} className={cn("num rounded-md border px-2 py-1 text-xs transition", leverage === v ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
                1:{v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="قیمت فعلی" hint={liveQuote && priceInput === null ? "Live" : "Price"} htmlFor="mg-price">
            <input id="mg-price" inputMode="decimal" value={price} onChange={(e) => setPriceInput(e.target.value)} className={inputClass} />
          </Field>
          <Field label="بالانس حساب" hint="اختیاری" htmlFor="mg-account" suffix="USD">
            <input id="mg-account" inputMode="decimal" value={account} onChange={(e) => setAccount(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="text-xs leading-6 text-muted">
          اندازه قرارداد {meta.label}: <span className="num text-fg">{formatNumber(meta.contractSize, 0)}</span> واحد در هر لات
          {meta.assetClass === "index" && " (در بروکرهای مختلف متفاوت است؛ مقدار حساب خود را بررسی کنید)"}.
        </p>
      </form>

      <div className="relative border-t border-line bg-surface/30 p-5 md:p-6 lg:border-s lg:border-t-0">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Output label="مارجین موردنیاز" labelEn="Required Margin" value={result ? formatMoney(result.margin) : "—"} tone="accent" big />
          </div>
          <Output label="ارزش معامله" labelEn="Position Value" value={result ? formatMoney(result.notional, "USD", 0) : "—"} />
          <Output label="سهم از بالانس" labelEn="Margin / Balance" value={result?.share != null ? `${formatNumber(result.share, 2)}%` : "—"} tone={result?.share != null && result.share > 100 ? "neg" : undefined} />
          <Output label="مارجین آزاد" labelEn="Free Margin" value={result?.free != null ? formatMoney(result.free) : "—"} tone={result?.free != null && result.free < 0 ? "neg" : "pos"} />
          <Output label="حداکثر حجم با این بالانس" labelEn="Max Lots" value={result?.maxLots != null ? `${formatNumber(result.maxLots, 2)} lot` : "—"} />
        </div>
        <p className="relative mt-4 text-xs leading-6 text-muted">
          مارجین = حجم × اندازه قرارداد × قیمت ÷ لوریج (برای جفت‌ارزهای USD/xxx بدون ضرب در قیمت). لوریج حساب‌های پراپ معمولاً برای فارکس ۱:۳۰ تا ۱:۱۰۰ و برای طلا، شاخص و کریپتو کمتر است؛ عدد دقیق را از قوانین پراپ‌فرم ببینید.
        </p>
      </div>
    </div>
  );
}
