"use client";

import { useActionState } from "react";
import type { schema } from "@/lib/db/schema-types";
import { saveCampaignAction } from "@/app/admin/actions";
import { Check, Field, Input, Panel, TextArea } from "./ui";
import { SubmitButton } from "./client";

type Row = typeof schema.lotteryCampaigns.$inferSelect;
const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function CampaignForm({ campaign }: { campaign: Row | null }) {
  const [state, action] = useActionState(saveCampaignAction, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <Panel title={campaign ? `ویرایش «${campaign.title}»` : "کمپین جدید"}>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        {campaign && <input type="hidden" name="id" value={campaign.id} />}
        <Field label="عنوان" error={err("title")}>
          <Input name="title" defaultValue={campaign?.title} required />
        </Field>
        <Field label="شناسه کمپین" hint="انگلیسی، مثلاً 2026-winter" error={err("slug")}>
          <Input name="slug" defaultValue={campaign?.slug} required dir="ltr" />
        </Field>
        <Field label="جایزه">
          <Input name="prize" defaultValue={campaign?.prize} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="شروع" error={err("startsAt")}>
            <Input name="startsAt" type="datetime-local" defaultValue={local(campaign?.startsAt)} dir="ltr" />
          </Field>
          <Field label="پایان" error={err("endsAt")}>
            <Input name="endsAt" type="datetime-local" defaultValue={local(campaign?.endsAt)} dir="ltr" />
          </Field>
        </div>
        <Field label="توضیحات" className="md:col-span-2">
          <TextArea name="description" defaultValue={campaign?.description} rows={2} />
        </Field>
        <Check name="active" label="کمپین فعال" hint="فعال کردن این کمپین، بقیه را غیرفعال می‌کند" defaultChecked={campaign?.active ?? true} />
        <div className="flex items-end justify-end gap-3">
          {state?.error && <p className="text-sm text-neg">{state.error}</p>}
          <SubmitButton>ذخیره کمپین</SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
