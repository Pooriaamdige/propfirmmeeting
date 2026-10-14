"use client";

import { useActionState, useState } from "react";
import { saveTransactionAction } from "@/app/(site)/journal/actions";
import { Field, Input, Select } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { useHydrated } from "@/lib/hooks/useHydrated";

const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function TransactionForm({ accountId }: { accountId: number }) {
  const [state, action] = useActionState(saveTransactionAction, null);
  const hydrated = useHydrated();
  const [local, setLocal] = useState<string | null>(null);
  const now = hydrated ? nowLocal() : "";
  const value = local ?? now;
  return (
    <form action={action} key={state?.nonce ?? 0} className="grid gap-3 sm:grid-cols-[130px_1fr_1fr_1.4fr_auto] sm:items-end">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="at" value={value ? new Date(value).toISOString() : ""} />
      <Field label="نوع">
        <Select name="type" defaultValue="deposit">
          <option value="deposit">واریز</option>
          <option value="withdrawal">برداشت</option>
        </Select>
      </Field>
      <Field label="مبلغ" error={state?.fieldErrors?.amount?.[0]}>
        <Input name="amount" inputMode="decimal" required dir="ltr" />
      </Field>
      <Field label="تاریخ">
        <Input type="datetime-local" value={value} onChange={(e) => setLocal(e.target.value)} dir="ltr" />
      </Field>
      <Field label="توضیح">
        <Input name="note" placeholder="مثلاً برداشت سود اول" />
      </Field>
      <SubmitButton>ثبت</SubmitButton>
      {state?.error && <p className="text-sm text-neg sm:col-span-5">{state.error}</p>}
    </form>
  );
}
