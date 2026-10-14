"use client";

import { useActionState, useState } from "react";
import { saveAccountAction } from "@/app/(site)/journal/actions";
import { Check, Field, Input, Panel, Select } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { ACCOUNT_TYPES, RESET_TIMEZONES } from "@/lib/journal/instruments";

export interface FirmPreset {
  id: number;
  name: string;
  daily: number;
  max: number;
  maxType: "static" | "trailing";
  target: number | null;
  minDays: number | null;
}

export interface AccountFormValue {
  id?: number;
  name: string;
  type: string;
  firmId: number | null;
  firmName: string;
  broker: string;
  platform: string;
  currency: string;
  initialBalance: number | "";
  startedAt: string;
  rules: { dailyDrawdownPct: number | null; maxDrawdownPct: number | null; maxDrawdownType: "static" | "trailing"; profitTargetPct: number | null; minTradingDays: number | null; consistencyPct: number | null; resetTz?: string } | null;
}

export function AccountForm({ value, firms }: { value: AccountFormValue; firms: FirmPreset[] }) {
  const [state, action] = useActionState(saveAccountAction, null);
  const [type, setType] = useState(value.type);
  const [useRules, setUseRules] = useState(value.rules !== null || value.type === "challenge" || value.type === "funded");
  const [rules, setRules] = useState(value.rules ?? { dailyDrawdownPct: 5, maxDrawdownPct: 10, maxDrawdownType: "static" as const, profitTargetPct: 10, minTradingDays: null, consistencyPct: null, resetTz: "Europe/Athens" });
  const [firmId, setFirmId] = useState<string>(value.firmId ? String(value.firmId) : "");
  const [firmName, setFirmName] = useState(value.firmName);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  const pickFirm = (id: string) => {
    setFirmId(id);
    const f = firms.find((x) => String(x.id) === id);
    if (!f) return;
    setFirmName(f.name);
    setUseRules(true);
    setRules((r) => ({ ...r, dailyDrawdownPct: f.daily, maxDrawdownPct: f.max, maxDrawdownType: f.maxType, profitTargetPct: type === "funded" ? null : f.target, minTradingDays: f.minDays }));
  };
  const n = (v: number | null) => (v === null ? "" : v);

  return (
    <form action={action} className="space-y-4">
      {value.id && <input type="hidden" name="id" value={value.id} />}
      <Panel title="مشخصات حساب">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نام حساب" hint="مثلاً FTMO 100K فاز ۱" error={err("name")}>
            <Input name="name" defaultValue={value.name} required />
          </Field>
          <Field label="نوع حساب">
            <Select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="پراپ‌فرم" hint="انتخاب از لیست، قوانین را پر می‌کند">
            <Select name="firmId" value={firmId} onChange={(e) => pickFirm(e.target.value)}>
              <option value="">— بدون پراپ / سایر —</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="نام پراپ‌فرم یا بروکر (اختیاری)">
            <Input name="firmName" value={firmName} onChange={(e) => setFirmName(e.target.value)} dir="ltr" />
          </Field>
          <Field label="بالانس اولیه" error={err("initialBalance")}>
            <Input name="initialBalance" inputMode="decimal" defaultValue={value.initialBalance} required dir="ltr" placeholder="100000" />
          </Field>
          <Field label="ارز حساب">
            <Select name="currency" defaultValue={value.currency}>
              {["USD", "EUR", "GBP"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="تاریخ شروع" error={err("startedAt")}>
            <Input name="startedAt" type="date" defaultValue={value.startedAt} required dir="ltr" />
          </Field>
          <Field label="پلتفرم">
            <Select name="platform" defaultValue={value.platform}>
              {["", "MT5", "MT4", "cTrader", "DXtrade", "Match-Trader", "TradeLocker", "TradingView"].map((p) => (
                <option key={p} value={p}>
                  {p || "—"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="بروکر (اختیاری)" className="md:col-span-2">
            <Input name="broker" defaultValue={value.broker} dir="ltr" />
          </Field>
        </div>
      </Panel>

      <Panel title="قوانین پراپ (برای پایش خودکار)">
        <Check name="useRules" label="پایش قوانین فعال باشد" hint="دراداون روزانه و کلی، تارگت سود، حداقل روز و قانون ثبات را بررسی می‌کند" checked={useRules} onChange={(e) => setUseRules(e.target.checked)} />
        {useRules && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="دراداون روزانه ٪" error={err("dailyDrawdownPct")}>
              <Input name="dailyDrawdownPct" inputMode="decimal" value={n(rules.dailyDrawdownPct)} onChange={(e) => setRules({ ...rules, dailyDrawdownPct: e.target.value === "" ? null : Number(e.target.value) })} dir="ltr" />
            </Field>
            <Field label="دراداون کلی ٪" error={err("maxDrawdownPct")}>
              <Input name="maxDrawdownPct" inputMode="decimal" value={n(rules.maxDrawdownPct)} onChange={(e) => setRules({ ...rules, maxDrawdownPct: e.target.value === "" ? null : Number(e.target.value) })} dir="ltr" />
            </Field>
            <Field label="نوع دراداون کلی">
              <Select name="maxDrawdownType" value={rules.maxDrawdownType} onChange={(e) => setRules({ ...rules, maxDrawdownType: e.target.value as "static" | "trailing" })}>
                <option value="static">ثابت (Static)</option>
                <option value="trailing">دنباله‌دار (Trailing)</option>
              </Select>
            </Field>
            <Field label="تارگت سود ٪" hint="خالی = بدون تارگت" error={err("profitTargetPct")}>
              <Input name="profitTargetPct" inputMode="decimal" value={n(rules.profitTargetPct)} onChange={(e) => setRules({ ...rules, profitTargetPct: e.target.value === "" ? null : Number(e.target.value) })} dir="ltr" />
            </Field>
            <Field label="حداقل روز معاملاتی" error={err("minTradingDays")}>
              <Input name="minTradingDays" inputMode="numeric" value={n(rules.minTradingDays)} onChange={(e) => setRules({ ...rules, minTradingDays: e.target.value === "" ? null : Number(e.target.value) })} dir="ltr" />
            </Field>
            <Field label="قانون ثبات ٪" hint="سقف سهم بهترین روز از کل سود" error={err("consistencyPct")}>
              <Input name="consistencyPct" inputMode="decimal" value={n(rules.consistencyPct)} onChange={(e) => setRules({ ...rules, consistencyPct: e.target.value === "" ? null : Number(e.target.value) })} dir="ltr" />
            </Field>
            <Field label="ساعت ریست روزانه" className="md:col-span-3">
              <Select name="resetTz" value={rules.resetTz ?? "Europe/Athens"} onChange={(e) => setRules({ ...rules, resetTz: e.target.value })}>
                {RESET_TIMEZONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between gap-3">
        {state?.error ? <p className="text-sm text-neg">{state.error}</p> : <span />}
        <SubmitButton>{value.id ? "ذخیره تغییرات" : "ساخت حساب"}</SubmitButton>
      </div>
    </form>
  );
}
