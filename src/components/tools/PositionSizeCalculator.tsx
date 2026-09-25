"use client";

import { useMemo, useState } from "react";
import { useLiveData } from "@/lib/hooks/useLiveData";
import { SYMBOLS, TICKER_SYMBOLS } from "@/lib/symbols";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Quote, SymbolCode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Field, Output, inputClass, parseNum } from "./Field";

const PRESETS = [10000, 25000, 50000, 100000, 200000];

/** USD value of one pip for one standard lot. */
export function pipValuePerLot(symbol: SymbolCode, price: number): number {
  const m = SYMBOLS[symbol];
  const raw = m.pipSize * m.contractSize;
  return symbol.startsWith("USD") ? raw / price : raw; // quote currency is not USD → convert
}

export function PositionSizeCalculator() {
  const [account, setAccount] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [sl, setSl] = useState("50");
  const [tp, setTp] = useState("100");
  const [symbol, setSymbol] = useState<SymbolCode>("EURUSD");
  // null = use the latest quote (or a reference price) for pip value conversion; user can override.
  const [priceInput, setPriceInput] = useState<string | null>(null);
  const quotes = useLiveData<Quote[]>(`/api/market/quotes/?symbols=${TICKER_SYMBOLS.join(",")}`, 0);
  const liveQuote = quotes.data?.find((x) => x.symbol === symbol);
  const price = priceInput ?? String(liveQuote ? Number(liveQuote.price.toFixed(SYMBOLS[symbol].digits)) : SYMBOLS[symbol].mockAnchor);

  const isCrypto = SYMBOLS[symbol].assetClass === "crypto";
  const unit = isCrypto ? "پوینت" : "پیپ";

  const result = useMemo(() => {
    const a = parseNum(account);
    const r = parseNum(risk);
    const s = parseNum(sl);
    const t = parseNum(tp);
    const p = parseNum(price);
    if (!(a > 0 && r > 0 && r <= 100 && s > 0 && p > 0)) return null;
    const riskAmount = (a * r) / 100;
    const pv = pipValuePerLot(symbol, p);
    const rawLots = riskAmount / (s * pv);
    const lots = Math.floor(rawLots * 100) / 100;
    const loss = lots * s * pv;
    const profit = t > 0 ? lots * t * pv : 0;
    return { riskAmount, lots, rawLots, loss, profit, pv, units: lots * SYMBOLS[symbol].contractSize, rr: t > 0 ? t / s : 0 };
  }, [account, risk, sl, tp, price, symbol]);

  const errors = {
    account: !(parseNum(account) > 0),
    risk: !(parseNum(risk) > 0 && parseNum(risk) <= 100),
    sl: !(parseNum(sl) > 0),
  };

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <form className="space-y-5 p-5 md:p-6" onSubmit={(e) => e.preventDefault()} aria-label="ورودی‌های محاسبه‌گر پراپ">
        <Field label="سایز حساب" hint="Account Size" htmlFor="ps-account" suffix="USD">
          <input id="ps-account" inputMode="decimal" value={account} onChange={(e) => setAccount(e.target.value)} aria-invalid={errors.account} className={inputClass} />
        </Field>
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setAccount(String(p))} className={cn("num rounded-md border px-2 py-1 text-xs transition", parseNum(account) === p ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
              ${p / 1000}K
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ریسک هر معامله" hint="Risk %" htmlFor="ps-risk" suffix="%">
            <input id="ps-risk" inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)} aria-invalid={errors.risk} className={inputClass} />
          </Field>
          <Field label="نماد" hint="Symbol" htmlFor="ps-symbol">
            <select id="ps-symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value as SymbolCode); setPriceInput(null); }} className={cn(inputClass, "latin")}>
              {TICKER_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`حد ضرر (${unit})`} hint="Stop Loss" htmlFor="ps-sl">
            <input id="ps-sl" inputMode="decimal" value={sl} onChange={(e) => setSl(e.target.value)} aria-invalid={errors.sl} className={inputClass} />
          </Field>
          <Field label={`حد سود (${unit})`} hint="Take Profit" htmlFor="ps-tp">
            <input id="ps-tp" inputMode="decimal" value={tp} onChange={(e) => setTp(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="قیمت فعلی" hint="برای محاسبه ارزش پیپ" htmlFor="ps-price">
          <input id="ps-price" inputMode="decimal" value={price} onChange={(e) => setPriceInput(e.target.value)} className={inputClass} />
        </Field>
        <p className="text-xs leading-6 text-muted">
          ارزش هر {unit} برای یک لات استاندارد: <span className="num font-medium text-fg">{result ? formatMoney(result.pv, "USD", 2) : "—"}</span>
          {SYMBOLS[symbol].assetClass === "metal" && " (هر پیپ طلا = ۰٫۱ دلار حرکت قیمت)"}
        </p>
      </form>

      <div className="relative border-t border-line bg-surface/30 p-5 md:p-6 lg:border-s lg:border-t-0">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Output label="حجم پیشنهادی" labelEn="Suggested Position Size" value={result ? `${formatNumber(result.lots, 2)} lot` : "—"} tone="accent" big />
          </div>
          <Output label="مبلغ ریسک" labelEn="Risk Amount" value={result ? formatMoney(result.riskAmount) : "—"} />
          <Output label="زیان احتمالی" labelEn="Potential Loss" value={result ? formatMoney(-result.loss) : "—"} tone="neg" />
          <Output label="سود احتمالی" labelEn="Potential Profit" value={result && result.profit ? formatMoney(result.profit) : "—"} tone="pos" />
          <Output label="نسبت ریسک به ریوارد" labelEn="R:R" value={result && result.rr ? `1 : ${formatNumber(result.rr, 2)}` : "—"} />
        </div>
        {result && (
          <p className="relative mt-4 text-xs leading-6 text-muted">
            معادل <span className="num text-fg">{formatNumber(result.units, 2)}</span> واحد. حجم به پایین (۰٫۰۱ لات) گرد شده تا ریسک از مقدار تعیین‌شده بیشتر نشود.
          </p>
        )}
      </div>
    </div>
  );
}
