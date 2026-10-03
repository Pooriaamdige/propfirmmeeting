"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { Field, Input } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="ایمیل">
        <Input key={state?.email ?? ""} name="email" type="email" dir="ltr" autoComplete="username" defaultValue={state?.email} required />
      </Field>
      <Field label="رمز عبور">
        <Input name="password" type="password" dir="ltr" autoComplete="current-password" required />
      </Field>
      {state?.error && (
        <p role="alert" data-login-error className="rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-sm text-neg">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="در حال ورود…">
        ورود
      </SubmitButton>
    </form>
  );
}
