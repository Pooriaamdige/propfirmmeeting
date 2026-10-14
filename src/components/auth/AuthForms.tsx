"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, updateProfileAction } from "@/app/(site)/login/actions";
import { Field, Input } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" data-auth-error className="rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-sm text-neg">
      {message}
    </p>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="ایمیل">
        <Input key={state?.email ?? ""} name="email" type="email" dir="ltr" autoComplete="email" defaultValue={state?.email} required />
      </Field>
      <Field label="رمز عبور">
        <Input name="password" type="password" dir="ltr" autoComplete="current-password" required />
      </Field>
      <ErrorBox message={state?.error} />
      <SubmitButton className="w-full" pendingLabel="در حال ورود…">
        ورود
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        حساب نداری؟{" "}
        <Link href={`/register/?next=${encodeURIComponent(next)}`} className="font-medium text-accent hover:underline">
          ثبت‌نام رایگان
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(registerAction, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="نام" error={err("name")}>
        <Input key={`n${state?.name ?? ""}`} name="name" autoComplete="name" defaultValue={state?.name} required />
      </Field>
      <Field label="ایمیل" error={err("email")}>
        <Input key={`e${state?.email ?? ""}`} name="email" type="email" dir="ltr" autoComplete="email" defaultValue={state?.email} required />
      </Field>
      <Field label="رمز عبور" hint="حداقل ۸ کاراکتر" error={err("password")}>
        <Input name="password" type="password" dir="ltr" autoComplete="new-password" minLength={8} required />
      </Field>
      <ErrorBox message={state?.fieldErrors ? undefined : state?.error} />
      <SubmitButton className="w-full" pendingLabel="در حال ساخت حساب…">
        ساخت حساب
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        قبلاً ثبت‌نام کرده‌ای؟{" "}
        <Link href={`/login/?next=${encodeURIComponent(next)}`} className="font-medium text-accent hover:underline">
          ورود
        </Link>
      </p>
    </form>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateProfileAction, null);
  return (
    <form action={action} className="space-y-4">
      <Field label="نام">
        <Input name="name" defaultValue={name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="رمز فعلی" hint="فقط برای تغییر رمز">
          <Input name="current" type="password" dir="ltr" autoComplete="current-password" />
        </Field>
        <Field label="رمز جدید">
          <Input name="next" type="password" dir="ltr" autoComplete="new-password" />
        </Field>
      </div>
      <ErrorBox message={state?.error} />
      {state?.ok && <p className="text-sm text-pos">ذخیره شد.</p>}
      <SubmitButton>ذخیره</SubmitButton>
    </form>
  );
}
