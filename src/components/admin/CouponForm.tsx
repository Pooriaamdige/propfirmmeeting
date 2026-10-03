"use client";

import { useActionState } from "react";
import type { schema } from "@/lib/db/schema-types";
import { saveCouponAction } from "@/app/admin/actions";
import { Check, Field, Input, Panel, Select, TextArea } from "./ui";
import { SubmitButton } from "./client";
import { Icon } from "@/components/ui/Icon";

type CouponRow = typeof schema.coupons.$inferSelect;

/** Date → value for <input type="datetime-local"> in the browser's local time. */
const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function CouponForm({ firms, coupon }: { firms: { id: number; name: string }[]; coupon: CouponRow | null }) {
  const [state, action] = useActionState(saveCouponAction, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <Panel title="اطلاعات کد">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="عنوان" error={err("title")}>
            <Input name="title" defaultValue={coupon?.title} required />
          </Field>
          <Field label="پراپ‌فرم" hint="اختیاری">
            <Select name="firmId" defaultValue={coupon?.firmId ?? ""}>
              <option value="">— بدون پراپ‌فرم —</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="کد تخفیف" hint="همان چیزی که کاربر کپی می‌کند" error={err("code")}>
            <Input name="code" defaultValue={coupon?.code} required dir="ltr" className="font-mono uppercase" />
          </Field>
          <Field label="برچسب تخفیف" hint="مثلاً ۲۰٪ تخفیف یا ۵۰ دلار" error={err("discountLabel")}>
            <Input name="discountLabel" defaultValue={coupon?.discountLabel} required />
          </Field>
          <Field label="درصد تخفیف" hint="برای مرتب‌سازی و نمایش؛ اختیاری" error={err("discountPercent")}>
            <Input name="discountPercent" type="number" min={0} max={100} defaultValue={coupon?.discountPercent ?? ""} dir="ltr" />
          </Field>
          <Field label="لینک خرید / همکاری" hint="اختیاری" error={err("url")}>
            <Input name="url" type="url" defaultValue={coupon?.url ?? ""} dir="ltr" placeholder="https://" />
          </Field>
          <Field label="توضیح کوتاه" className="md:col-span-2">
            <TextArea name="description" defaultValue={coupon?.description} rows={2} />
          </Field>
          <Field label="شرایط استفاده" className="md:col-span-2">
            <TextArea name="terms" defaultValue={coupon?.terms} rows={2} />
          </Field>
        </div>
      </Panel>
      <Panel title="زمان‌بندی و نمایش">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="شروع" hint="خالی = از همین حالا" error={err("startsAt")}>
            <Input name="startsAt" type="datetime-local" defaultValue={local(coupon?.startsAt)} dir="ltr" />
          </Field>
          <Field label="انقضا" hint="خالی = بدون انقضا" error={err("expiresAt")}>
            <Input name="expiresAt" type="datetime-local" defaultValue={local(coupon?.expiresAt)} dir="ltr" />
          </Field>
          <Check name="active" label="فعال" hint="در سایت نمایش داده شود" defaultChecked={coupon?.active ?? true} />
          <Check name="featured" label="ویژه" hint="بالای لیست و در صفحه اصلی" defaultChecked={coupon?.featured ?? false} />
          <Field label="ترتیب نمایش" hint="عدد کمتر = بالاتر">
            <Input name="sortOrder" type="number" defaultValue={coupon?.sortOrder ?? 0} dir="ltr" />
          </Field>
        </div>
      </Panel>
      <div className="flex items-center justify-between gap-3">
        {state?.error ? <p className="text-sm text-neg">{state.error}</p> : <span />}
        <SubmitButton>
          <Icon name="check" size={16} /> ذخیره کد
        </SubmitButton>
      </div>
    </form>
  );
}
