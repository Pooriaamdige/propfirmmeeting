"use client";

import { useActionState } from "react";
import type { SiteSettings } from "@/lib/settings-defaults";
import { saveSettingsAction } from "@/app/admin/actions";
import { Check, Field, Input, Panel, TextArea } from "./ui";
import { SubmitButton } from "./client";

export function SettingsForm({ settings: s }: { settings: SiteSettings }) {
  const [state, action] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="space-y-4">
      <Panel title="بخش اصلی صفحه نخست (Hero)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="تیتر — خط اول">
            <Input name="hero.title" defaultValue={s.hero.title} required />
          </Field>
          <Field label="تیتر — بخش رنگی">
            <Input name="hero.highlight" defaultValue={s.hero.highlight} required />
          </Field>
          <Field label="زیرتیتر" className="md:col-span-2">
            <TextArea name="hero.subtitle" defaultValue={s.hero.subtitle} rows={2} />
          </Field>
        </div>
      </Panel>
      <Panel title="نوار اطلاعیه بالای سایت">
        <div className="grid gap-4 md:grid-cols-2">
          <Check name="announcement.enabled" label="نمایش نوار اطلاعیه" defaultChecked={s.announcement.enabled} />
          <div />
          <Field label="متن اطلاعیه">
            <Input name="announcement.text" defaultValue={s.announcement.text} placeholder="مثلاً: کد تخفیف ۲۰٪ جدید اضافه شد" />
          </Field>
          <Field label="لینک" hint="مثلاً /coupons/">
            <Input name="announcement.href" defaultValue={s.announcement.href} dir="ltr" />
          </Field>
        </div>
      </Panel>
      <Panel title="شبکه‌های اجتماعی و تماس">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telegram">
            <Input name="social.telegram" defaultValue={s.social.telegram} dir="ltr" />
          </Field>
          <Field label="Instagram">
            <Input name="social.instagram" defaultValue={s.social.instagram} dir="ltr" />
          </Field>
          <Field label="X">
            <Input name="social.x" defaultValue={s.social.x} dir="ltr" />
          </Field>
          <Field label="لینک ایمیل" hint="mailto:…">
            <Input name="social.email" defaultValue={s.social.email} dir="ltr" />
          </Field>
          <Field label="ایمیل پشتیبانی">
            <Input name="contact.email" defaultValue={s.contact.email} dir="ltr" />
          </Field>
          <Field label="آیدی تلگرام پشتیبانی">
            <Input name="contact.telegramSupport" defaultValue={s.contact.telegramSupport} dir="ltr" />
          </Field>
        </div>
      </Panel>
      <div className="flex items-center justify-between gap-3">
        {state?.error ? <p className="text-sm text-neg">{state.error}</p> : <span />}
        <SubmitButton>ذخیره تنظیمات</SubmitButton>
      </div>
    </form>
  );
}
