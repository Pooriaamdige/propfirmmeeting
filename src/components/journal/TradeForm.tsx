"use client";

import { useActionState, useMemo, useState } from "react";
import { saveTradeAction } from "@/app/(site)/journal/actions";
import { Field, Input, Panel, TextArea } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { COMMON_SYMBOLS, EMOTIONS, MISTAKES, estimateProfit, estimateRisk, normalizeSymbol, pipsBetween } from "@/lib/journal/instruments";
import { fmtMoney, fmtNum } from "@/lib/journal/format";

export interface TradeFormValue {
  id?: number;
  symbol: string;
  side: "buy" | "sell";
  openedAt: string | null; // ISO
  closedAt: string | null;
  entryPrice: number | null;
  exitPrice: number | null;
  lots: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number | null;
  commission: number;
  swap: number;
  pips: number | null;
  riskAmount: number | null;
  setup: string;
  tags: string[];
  mistakes: string[];
  emotion: string;
  rating: number | null;
  notes: string;
  screenshotUrl: string | null;
}

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");
const s = (v: number | null) => (v === null || Number.isNaN(v) ? "" : String(v));
const n = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[,٬\s]/g, "")));

function Chips({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((m) => {
        const on = selected.includes(m);
        return (
          <button key={m} type="button" onClick={() => onToggle(m)} aria-pressed={on} className={cn("rounded-full border px-3 py-1 text-xs transition", on ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
            {m}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({ value, onChange, suggestions, placeholder }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[]; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (t && !value.includes(t) && value.length < 20) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface/60 p-1.5 focus-within:border-accent/60">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-accent-2/10 px-2 py-1 text-xs text-accent-2">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`حذف ${t}`}>
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          list="tag-suggestions"
          placeholder={value.length ? "" : placeholder}
          className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-faint"
        />
      </div>
      <datalist id="tag-suggestions">
        {suggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}

export function TradeForm({ accountId, currency, value, vocabulary }: { accountId: number; currency: string; value: TradeFormValue; vocabulary: { setups: string[]; tags: string[]; symbols: string[] } }) {
  const [state, action] = useActionState(saveTradeAction, null);
  // Remount the fields after "save & add another" so the next trade starts clean.
  return (
    <div>
      {state?.ok && state.message && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-pos/30 bg-pos/5 px-3 py-2 text-sm text-pos">
          <Icon name="check" size={16} />
          {state.message}
        </p>
      )}
      <TradeFields key={state?.nonce ?? 0} accountId={accountId} currency={currency} value={state?.nonce ? { ...value, id: undefined, openedAt: null, closedAt: null, entryPrice: null, exitPrice: null, stopLoss: null, takeProfit: null, profit: null, pips: null, riskAmount: null, notes: "", mistakes: [], rating: null, screenshotUrl: null, commission: 0, swap: 0 } : value} vocabulary={vocabulary} action={action} state={state} />
    </div>
  );
}

function TradeFields({ accountId, currency, value: v, vocabulary, action, state }: { accountId: number; currency: string; value: TradeFormValue; vocabulary: { setups: string[]; tags: string[]; symbols: string[] }; action: (fd: FormData) => void; state: Awaited<ReturnType<typeof saveTradeAction>> }) {
  const hydrated = useHydrated();
  const [symbol, setSymbol] = useState(v.symbol);
  const [side, setSide] = useState(v.side);
  const [opened, setOpened] = useState<string | null>(null);
  const [closed, setClosed] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(v.id ? v.closedAt === null : false);
  const [entry, setEntry] = useState(s(v.entryPrice));
  const [exit, setExit] = useState(s(v.exitPrice));
  const [lots, setLots] = useState(s(v.lots));
  const [sl, setSl] = useState(s(v.stopLoss));
  const [tp, setTp] = useState(s(v.takeProfit));
  const [profit, setProfit] = useState(s(v.profit));
  const [commission, setCommission] = useState(s(v.commission || null));
  const [swap, setSwap] = useState(s(v.swap || null));
  const [pips, setPips] = useState(s(v.pips));
  const [risk, setRisk] = useState(s(v.riskAmount));
  const [tags, setTags] = useState(v.tags);
  const [mistakes, setMistakes] = useState(v.mistakes);
  const [emotion, setEmotion] = useState(v.emotion);
  const [rating, setRating] = useState<number | null>(v.rating);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  // Browser-local datetime inputs (only after hydration, so server and client agree).
  const openedLocal = opened ?? (hydrated ? toLocal(v.openedAt ?? new Date().toISOString()) : "");
  const closedLocal = closed ?? (hydrated ? toLocal(v.closedAt ?? (v.id ? null : new Date().toISOString())) : "");

  const sym = normalizeSymbol(symbol);
  const auto = useMemo(() => {
    const e = n(entry), x = n(exit), l = n(lots), stop = n(sl), take = n(tp);
    return {
      pips: e && x ? pipsBetween(sym, side, e, x) : null,
      profit: e && x && l && !isOpen ? estimateProfit(sym, side, e, x, l) : null,
      risk: e && stop && l ? estimateRisk(sym, e, stop, l) : null,
      plannedRR: e && stop && take && Math.abs(e - stop) > 0 ? Math.abs(take - e) / Math.abs(e - stop) : null,
    };
  }, [entry, exit, lots, sl, tp, sym, side, isOpen]);

  const grossValue = n(profit) ?? auto.profit;
  const net = grossValue !== null ? grossValue - Math.abs(n(commission) ?? 0) + (n(swap) ?? 0) : null;
  const riskValue = n(risk) ?? auto.risk;
  const r = net !== null && riskValue ? net / riskValue : null;

  const toggle = (list: string[], set: (v: string[]) => void, item: string) => set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <input type="hidden" name="accountId" value={accountId} />
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="openedAt" value={toIso(openedLocal)} />
      <input type="hidden" name="closedAt" value={isOpen ? "" : toIso(closedLocal)} />
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="mistakes" value={JSON.stringify(mistakes)} />
      <input type="hidden" name="emotion" value={emotion} />
      <input type="hidden" name="rating" value={rating ?? ""} />
      <input type="hidden" name="side" value={side} />

      <div className="space-y-4">
        <Panel title="معامله">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نماد" error={err("symbol")}>
              <Input name="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} list="symbol-list" required dir="ltr" placeholder="XAUUSD" />
              <datalist id="symbol-list">
                {[...new Set([...vocabulary.symbols, ...COMMON_SYMBOLS])].map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <Field label="جهت">
              <div className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-line p-1" role="radiogroup" aria-label="جهت معامله">
                {(["buy", "sell"] as const).map((x) => (
                  <button key={x} type="button" role="radio" aria-checked={side === x} onClick={() => setSide(x)} className={cn("latin rounded-md text-sm font-bold transition", side === x ? (x === "buy" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg") : "text-muted")}>
                    {x === "buy" ? "BUY" : "SELL"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="زمان باز شدن" hint="به وقت دستگاه شما" error={err("openedAt")}>
              <Input type="datetime-local" value={openedLocal} onChange={(e) => setOpened(e.target.value)} required dir="ltr" />
            </Field>
            <Field label="زمان بسته شدن" error={err("closedAt")}>
              <Input type="datetime-local" value={isOpen ? "" : closedLocal} onChange={(e) => setClosed(e.target.value)} disabled={isOpen} required={!isOpen} dir="ltr" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
              <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
              معامله هنوز باز است
            </label>
            <Field label="حجم (لات)" error={err("lots")}>
              <Input name="lots" inputMode="decimal" value={lots} onChange={(e) => setLots(e.target.value)} required dir="ltr" placeholder="1.00" />
            </Field>
            <Field label="قیمت ورود" error={err("entryPrice")}>
              <Input name="entryPrice" inputMode="decimal" value={entry} onChange={(e) => setEntry(e.target.value)} required dir="ltr" />
            </Field>
            <Field label="حد ضرر (SL)">
              <Input name="stopLoss" inputMode="decimal" value={sl} onChange={(e) => setSl(e.target.value)} dir="ltr" />
            </Field>
            <Field label="حد سود (TP)">
              <Input name="takeProfit" inputMode="decimal" value={tp} onChange={(e) => setTp(e.target.value)} dir="ltr" />
            </Field>
            {!isOpen && (
              <Field label="قیمت خروج" error={err("exitPrice")} className="sm:col-span-2">
                <Input name="exitPrice" inputMode="decimal" value={exit} onChange={(e) => setExit(e.target.value)} required dir="ltr" />
              </Field>
            )}
          </div>
        </Panel>

        {!isOpen && (
          <Panel title="نتیجه">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`سود/زیان (${currency})`} hint={auto.profit !== null && !profit ? `محاسبه خودکار: ${fmtNum(auto.profit)}` : "همان عدد Profit پلتفرم"} error={err("profit")}>
                <Input name="profit" inputMode="decimal" value={profit} onChange={(e) => setProfit(e.target.value)} placeholder={auto.profit !== null ? String(auto.profit) : "مثلاً -120.50"} dir="ltr" />
              </Field>
              <Field label="پیپ" hint={auto.pips !== null && !pips ? `خودکار: ${fmtNum(auto.pips, 1)}` : undefined}>
                <Input name="pips" inputMode="decimal" value={pips} onChange={(e) => setPips(e.target.value)} placeholder={auto.pips !== null ? String(auto.pips) : ""} dir="ltr" />
              </Field>
              <Field label="کمیسیون" hint="هزینه، عدد مثبت">
                <Input name="commission" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} dir="ltr" placeholder="0" />
              </Field>
              <Field label="سواپ" hint="منفی = هزینه">
                <Input name="swap" inputMode="decimal" value={swap} onChange={(e) => setSwap(e.target.value)} dir="ltr" placeholder="0" />
              </Field>
            </div>
            <p className="mt-3 text-xs text-muted">اگر سود/زیان یا پیپ را خالی بگذاری، برای جفت‌ارزهای دلاری و طلا به‌صورت خودکار محاسبه می‌شود. برای سایر نمادها عدد پلتفرم را وارد کن.</p>
          </Panel>
        )}

        <Panel title="تحلیل و یادداشت">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ستاپ / استراتژی">
                <Input name="setup" defaultValue={v.setup} list="setup-list" placeholder="مثلاً Breakout لندن" />
                <datalist id="setup-list">
                  {vocabulary.setups.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </Field>
              <Field label="ریسک (مبلغ)" hint={auto.risk !== null && !risk ? `از روی SL: ${fmtNum(auto.risk)}` : "برای محاسبه R"}>
                <Input name="riskAmount" inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)} placeholder={auto.risk !== null ? String(auto.risk) : ""} dir="ltr" />
              </Field>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">تگ‌ها</p>
              <TagInput value={tags} onChange={setTags} suggestions={vocabulary.tags} placeholder="تایپ کن و Enter بزن (مثلاً روند، پولبک، نقدینگی)" />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">اشتباهات این معامله</p>
              <Chips items={[...MISTAKES, ...mistakes.filter((m) => !(MISTAKES as readonly string[]).includes(m))]} selected={mistakes} onToggle={(m) => toggle(mistakes, setMistakes, m)} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">حس و حال هنگام معامله</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONS.map((e) => (
                  <button key={e.id} type="button" onClick={() => setEmotion(emotion === e.id ? "" : e.id)} aria-pressed={emotion === e.id} className={cn("rounded-full border px-3 py-1 text-xs transition", emotion === e.id ? "border-accent-2/60 bg-accent-2/10 text-accent-2" : "border-line text-muted hover:text-fg")}>
                    <span aria-hidden>{e.emoji}</span> {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">کیفیت اجرا (طبق پلن)</p>
              <div className="flex gap-1" role="radiogroup" aria-label="امتیاز اجرا">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} از ۵`} onClick={() => setRating(rating === i ? null : i)} className={cn("text-2xl leading-none transition", rating !== null && i <= rating ? "text-accent-2" : "text-line-strong hover:text-accent-2/60")}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Field label="یادداشت">
              <TextArea name="notes" defaultValue={v.notes} rows={4} placeholder="دلیل ورود، مدیریت معامله، درس‌ها…" />
            </Field>
            <Field label="لینک اسکرین‌شات چارت" hint="مثلاً لینک TradingView" error={err("screenshotUrl")}>
              <Input name="screenshotUrl" type="url" defaultValue={v.screenshotUrl ?? ""} dir="ltr" placeholder="https://www.tradingview.com/x/…" />
            </Field>
          </div>
        </Panel>
      </div>

      {/* Live summary */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card border-beam p-5">
          <p className="text-sm text-muted">خلاصه معامله</p>
          <p className={cn("num mt-2 text-3xl font-black", net === null ? "text-faint" : net >= 0 ? "text-pos" : "text-neg")}>{net === null ? (isOpen ? "باز" : "—") : fmtMoney(net, currency, true)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">پیپ</dt>
              <dd className="num">{fmtNum(n(pips) ?? auto.pips, 1)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">ریسک</dt>
              <dd className="num">{riskValue !== null ? fmtMoney(riskValue, currency) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">نتیجه به R</dt>
              <dd className={cn("num font-semibold", r === null ? "" : r >= 0 ? "text-pos" : "text-neg")}>{r === null ? "—" : `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">ریسک به ریوارد برنامه</dt>
              <dd className="num">{auto.plannedRR === null ? "—" : `1 : ${auto.plannedRR.toFixed(2)}`}</dd>
            </div>
          </dl>
        </div>
        {state?.error && (
          <p role="alert" className="rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-sm text-neg">
            {state.error}
          </p>
        )}
        <SubmitButton className="w-full">
          <Icon name="check" size={16} /> {v.id ? "ذخیره تغییرات" : "ثبت معامله"}
        </SubmitButton>
        {!v.id && (
          <button type="submit" name="intent" value="another" className="w-full rounded-lg border border-line-strong py-2.5 text-sm transition hover:border-accent/50">
            ثبت و وارد کردن معامله بعدی
          </button>
        )}
      </aside>
    </form>
  );
}
