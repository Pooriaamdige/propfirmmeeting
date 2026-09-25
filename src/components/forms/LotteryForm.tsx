"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lotterySchema, type LotteryFormValues } from "@/lib/validation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useFormGuard } from "./useFormGuard";
import { Turnstile, captchaEnabled } from "./Turnstile";

type FieldName = keyof LotteryFormValues;

const FIELDS: { name: FieldName; label: string; placeholder: string; type: string; dir?: "ltr"; autoComplete: string; inputMode?: "email" | "tel" | "text" }[] = [
  { name: "name", label: "نام و نام خانوادگی", placeholder: "مثلاً علی رضایی", type: "text", autoComplete: "name" },
  { name: "email", label: "ایمیل", placeholder: "you@example.com", type: "email", dir: "ltr", autoComplete: "email", inputMode: "email" },
  { name: "telegramId", label: "آیدی تلگرام", placeholder: "@username", type: "text", dir: "ltr", autoComplete: "off" },
  { name: "phone", label: "شماره تماس", placeholder: "09123456789", type: "tel", dir: "ltr", autoComplete: "tel", inputMode: "tel" },
];

export function LotteryForm() {
  const guard = useFormGuard();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LotteryFormValues>({ resolver: zodResolver(lotterySchema), mode: "onTouched" });

  const onSubmit = handleSubmit(async (values) => {
    setStatus("idle");
    if (captchaEnabled && !token) {
      setServerMessage("لطفاً تأیید امنیتی را کامل کنید.");
      setStatus("error");
      return;
    }
    try {
      const res = await fetch("/api/lottery/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...guard.meta(), turnstileToken: token || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setStatus("success");
        reset();
        return;
      }
      if (json.fieldErrors) {
        for (const [k, v] of Object.entries(json.fieldErrors as Record<string, string[]>)) if (v?.[0]) setError(k as FieldName, { message: v[0] });
      }
      setServerMessage(json.message ?? "ثبت‌نام ناموفق بود. دوباره تلاش کنید.");
      setStatus("error");
    } catch {
      setServerMessage("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
      setStatus("error");
    }
  });

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center" role="status">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pos/15 text-pos">
          <Icon name="check" size={30} strokeWidth={2.4} />
        </span>
        <p className="text-lg font-bold">ثبت‌نام شما با موفقیت انجام شد.</p>
        <p className="max-w-xs text-sm leading-6 text-muted">نتیجه قرعه‌کشی از طریق ایمیل و تلگرام اطلاع‌رسانی می‌شود.</p>
        <button onClick={() => setStatus("idle")} className="text-sm text-accent hover:underline">
          ثبت‌نام فرد دیگر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4" aria-label="فرم ثبت‌نام قرعه‌کشی">
      {guard.honeypotField}
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const err = errors[f.name]?.message;
          return (
            <div key={f.name}>
              <label htmlFor={`lot-${f.name}`} className="mb-1.5 block text-sm font-medium">
                {f.label} <span className="text-neg" aria-hidden>*</span>
              </label>
              <input
                id={`lot-${f.name}`}
                type={f.type}
                dir={f.dir}
                inputMode={f.inputMode}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                aria-invalid={!!err}
                aria-describedby={err ? `lot-${f.name}-err` : undefined}
                aria-required="true"
                className={cn(
                  "h-12 w-full rounded-lg border bg-surface/60 px-3.5 text-sm outline-none transition placeholder:text-faint focus:bg-card",
                  f.dir === "ltr" && "text-left placeholder:text-left",
                  err ? "border-neg/60 focus:border-neg" : "border-line focus:border-accent/60",
                )}
                {...register(f.name)}
              />
              {err && (
                <p id={`lot-${f.name}-err`} className="mt-1.5 text-xs text-neg">
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Turnstile onToken={setToken} />
      {status === "error" && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-sm text-neg">
          <Icon name="alert" size={16} />
          {serverMessage}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "در حال ثبت…" : "ثبت‌نام در قرعه‌کشی"}
        {!isSubmitting && <Icon name="gift" size={18} />}
      </Button>
      <p className="text-center text-[11px] leading-5 text-faint">
        با ثبت‌نام، با استفاده از اطلاعاتت صرفاً برای اطلاع‌رسانی قرعه‌کشی موافقت می‌کنی. اطلاعات در اختیار شخص ثالث قرار نمی‌گیرد.
      </p>
    </form>
  );
}
