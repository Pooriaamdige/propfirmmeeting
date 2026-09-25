"use client";

import { useState } from "react";
import { newsletterSchema } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useFormGuard } from "./useFormGuard";

export function NewsletterForm() {
  const guard = useFormGuard();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "loading" | "ok" | "error"; message?: string }>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) return setState({ kind: "error", message: "ایمیل معتبر نیست." });
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/newsletter/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: parsed.data.email, ...guard.meta() }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) return setState({ kind: "error", message: json.message ?? "عضویت ناموفق بود." });
      setState({ kind: "ok", message: json.message ?? "عضویت شما ثبت شد. اولین شماره خبرنامه به‌زودی ارسال می‌شود." });
      setEmail("");
    } catch {
      setState({ kind: "error", message: "ارتباط با سرور برقرار نشد." });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative w-full max-w-lg" aria-label="عضویت در خبرنامه">
      {guard.honeypotField}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">
          ایمیل
        </label>
        <input
          id="nl-email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={state.kind === "error"}
          aria-describedby="nl-status"
          className="h-12 flex-1 rounded-lg border border-line bg-card px-4 text-left text-sm outline-none transition placeholder:text-faint focus:border-accent/60"
        />
        <Button type="submit" size="lg" disabled={state.kind === "loading"} className="sm:w-32">
          {state.kind === "loading" ? "…" : "عضویت"}
        </Button>
      </div>
      <p id="nl-status" role="status" className={`mt-2 min-h-5 text-sm ${state.kind === "error" ? "text-neg" : "text-pos"}`}>
        {state.kind === "ok" && <Icon name="check" size={14} className="me-1 inline" />}
        {state.message}
      </p>
    </form>
  );
}
