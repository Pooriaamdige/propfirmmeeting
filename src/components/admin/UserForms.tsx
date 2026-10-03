"use client";

import { useActionState } from "react";
import { changePasswordAction, createUserAction } from "@/app/admin/actions";
import { Field, Input, Select } from "./ui";
import { SubmitButton } from "./client";

export function UserForms() {
  const [createState, create] = useActionState(createUserAction, null);
  const [pwState, changePw] = useActionState(changePasswordAction, null);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={create} className="space-y-3">
        <h2 className="font-bold">افزودن مدیر</h2>
        <Field label="ایمیل" error={createState?.fieldErrors?.email?.[0]}>
          <Input name="email" type="email" required dir="ltr" />
        </Field>
        <Field label="نام">
          <Input name="name" />
        </Field>
        <Field label="رمز عبور" hint="حداقل ۸ کاراکتر" error={createState?.fieldErrors?.password?.[0]}>
          <Input name="password" type="password" required minLength={8} dir="ltr" autoComplete="new-password" />
        </Field>
        <Field label="نقش">
          <Select name="role" defaultValue="editor">
            <option value="editor">ویرایشگر</option>
            <option value="admin">مدیر کل</option>
          </Select>
        </Field>
        {createState?.error && <p className="text-sm text-neg">{createState.error}</p>}
        <SubmitButton>افزودن</SubmitButton>
      </form>
      <form action={changePw} className="space-y-3">
        <h2 className="font-bold">تغییر رمز عبور من</h2>
        <Field label="رمز فعلی">
          <Input name="current" type="password" required dir="ltr" autoComplete="current-password" />
        </Field>
        <Field label="رمز جدید" hint="حداقل ۸ کاراکتر">
          <Input name="next" type="password" required minLength={8} dir="ltr" autoComplete="new-password" />
        </Field>
        {pwState?.error && <p className="text-sm text-neg">{pwState.error}</p>}
        {pwState?.ok && <p className="text-sm text-pos">رمز عبور تغییر کرد.</p>}
        <SubmitButton variant="secondary">تغییر رمز</SubmitButton>
      </form>
    </div>
  );
}
