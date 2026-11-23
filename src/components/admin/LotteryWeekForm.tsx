"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { schema } from "@/lib/db/schema-types";
import { saveLotteryWeekAction } from "@/app/admin/actions";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import { Check, Field, Input, Panel } from "./ui";
import { SubmitButton } from "./client";

type Week = typeof schema.lotteryWeeks.$inferSelect;

export function LotteryWeekForm({ week, nextWeek, firms }: { week: Week | null; nextWeek: number; firms: string[] }) {
  const [state, action, pending] = useActionState(saveLotteryWeekAction, null);
  const [number, setNumber] = useState(String(week?.week ?? nextWeek));
  const [drawnOn, setDrawnOn] = useState(week?.drawnOn ?? "");
  const [published, setPublished] = useState(week?.published ?? false);
  const [winners, setWinners] = useState(() => (week?.winners.length ? week.winners : [{ email: "", account: "", firmName: "" }]).map((w, i) => ({ ...w, key: String(i) })));
  const update = (key: string, field: "email" | "account" | "firmName", value: string) => setWinners((rows) => rows.map((r) => r.key === key ? { ...r, [field]: value } : r));

  return (
    <Panel title={week ? `ویرایش هفته ${week.week.toLocaleString("fa-IR")}` : "هفته جدید"}>
      <form action={action}>
        {week && <input type="hidden" name="id" value={week.id} />}
        <input type="hidden" name="payload" value={JSON.stringify({ week: Number(number), drawnOn, published, winners: winners.map(({ email, account, firmName }) => ({ email, account, firmName })) })} />
        <fieldset disabled={pending} className="min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="شماره هفته" hint="شماره دوره قرعه‌کشی">
              <Input type="number" min={1} max={2147483647} step={1} required value={number} onChange={(e) => setNumber(e.target.value)} dir="ltr" />
            </Field>
            <Field label="تاریخ قرعه‌کشی" hint="اختیاری، میلادی">
              <Input type="date" value={drawnOn} onChange={(e) => setDrawnOn(e.target.value)} dir="ltr" />
            </Field>
          </div>
          <div>
            <h3 className="font-bold">برندگان این هفته <span className="text-sm font-normal text-muted">({winners.length.toLocaleString("fa-IR")} نفر)</span></h3>
            <p className="mt-1 text-xs leading-6 text-muted">برای هر برنده، ایمیل، حساب جایزه و پراپ‌فرم اهداکننده را وارد کنید.</p>
          </div>
          <datalist id="giveaway-firms">{firms.map((name) => <option key={name} value={name} />)}</datalist>
          <div className="space-y-3">
            {winners.map((winner, i) => (
              <fieldset key={winner.key} className="min-w-0 rounded-xl border border-line bg-surface/40 p-4">
                <legend className="px-2 text-sm font-semibold">برنده {(i + 1).toLocaleString("fa-IR")}</legend>
                <div className="grid items-end gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
                  <Field label="ایمیل برنده">
                    <Input type="email" required maxLength={254} value={winner.email} onChange={(e) => update(winner.key, "email", e.target.value)} dir="ltr" placeholder="winner@example.com" />
                  </Field>
                  <Field label="حساب جایزه">
                    <Input required maxLength={100} value={winner.account} onChange={(e) => update(winner.key, "account", e.target.value)} placeholder="$5K" dir="auto" />
                  </Field>
                  <Field label="پراپ‌فرم اهداکننده">
                    <Input required maxLength={120} list="giveaway-firms" value={winner.firmName} onChange={(e) => update(winner.key, "firmName", e.target.value)} dir="auto" placeholder="نام پراپ‌فرم" />
                  </Field>
                  <button type="button" aria-label={`حذف برنده ${(i + 1).toLocaleString("fa-IR")}`} onClick={() => setWinners((rows) => rows.filter((r) => r.key !== winner.key))} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm text-neg hover:bg-neg/10">
                    <Icon name="trash" size={16} /><span className="lg:sr-only">حذف برنده</span>
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
          <button type="button" className={buttonClass("secondary", "md", "w-full border-dashed")} onClick={() => setWinners((rows) => [...rows, { key: crypto.randomUUID(), email: "", account: "", firmName: "" }])}>
            <Icon name="plus" size={18} /> افزودن برنده
          </button>
          <Check label="انتشار نتایج این هفته" hint="با انتشار، ایمیل کامل برندگان، حساب جایزه و نام پراپ‌فرم برای همه بازدیدکنندگان نمایش داده می‌شود." checked={published} onChange={(e) => setPublished(e.target.checked)} />
        </fieldset>
        {state?.error && <p role="alert" className="mt-4 rounded-lg border border-neg/30 bg-neg/5 p-3 text-sm text-neg">{state.error}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Link href="/admin/lottery-winners/" className={buttonClass("ghost")}>انصراف</Link>
          <SubmitButton>ذخیره نتایج</SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
