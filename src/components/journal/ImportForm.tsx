"use client";

import { useActionState, useState } from "react";
import { importTradesAction } from "@/app/(site)/journal/actions";
import { Field, Panel, Select, TextArea } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { RESET_TIMEZONES } from "@/lib/journal/instruments";
import { Icon } from "@/components/ui/Icon";

export function ImportForm({ accountId }: { accountId: number }) {
  const [state, action] = useActionState(importTradesAction, null);
  const [mode, setMode] = useState<"file" | "text">("file");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="accountId" value={accountId} />
      <Panel title="فایل معاملات">
        <div className="mb-4 flex rounded-lg border border-line p-0.5 text-sm" role="tablist">
          {(["file", "text"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`flex-1 rounded-md px-3 py-1.5 ${mode === m ? "bg-surface font-semibold" : "text-muted"}`}>
              {m === "file" ? "آپلود فایل CSV" : "چسباندن متن"}
            </button>
          ))}
        </div>
        {mode === "file" ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line-strong p-8 text-center text-sm text-muted transition hover:border-accent/50">
            <Icon name="download" size={22} className="rotate-180 text-accent" />
            فایل CSV را انتخاب کن (حداکثر ۵ مگابایت)
            <input type="file" name="file" accept=".csv,text/csv,.txt" className="mt-2 text-xs" />
          </label>
        ) : (
          <TextArea name="text" rows={10} dir="ltr" className="font-mono text-xs" placeholder={"symbol,side,opened_at,closed_at,entry_price,exit_price,lots,profit\nXAUUSD,buy,2026-10-01 10:05,2026-10-01 12:40,2650.1,2661.4,0.5,565"} />
        )}
        <Field label="منطقه زمانی تاریخ‌های فایل" hint="تاریخ‌های بدون منطقه زمانی با این تفسیر می‌شوند" className="mt-4">
          <Select name="timeZone" defaultValue="Europe/Athens">
            {RESET_TIMEZONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </Panel>
      {state?.error && <p role="alert" className="rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-sm text-neg">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-lg border border-pos/30 bg-pos/5 px-3 py-2 text-sm text-pos">{state.message}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="submit" name="dryRun" value="1" className="rounded-lg border border-line-strong px-4 py-2 text-sm hover:border-accent/50">
          بررسی فایل (بدون ذخیره)
        </button>
        <SubmitButton pendingLabel="در حال وارد کردن…">وارد کردن معاملات</SubmitButton>
      </div>
    </form>
  );
}
