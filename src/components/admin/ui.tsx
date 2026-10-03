import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

export function PageTitle({ title, subtitle, action, back }: { title: string; subtitle?: string; action?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
            <Icon name="arrow-right" size={13} />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("card p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg border border-line bg-surface/60 px-3 text-sm outline-none transition placeholder:text-faint focus:border-accent/60 focus:bg-card aria-[invalid=true]:border-neg/60";

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-[11px] font-normal text-faint">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-neg">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputCls, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputCls, "h-auto min-h-24 py-2 leading-7", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputCls, className)} {...props}>
      {children}
    </select>
  );
}

export function Check({ label, hint, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 transition hover:border-line-strong">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--accent)]" {...props} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "pos" | "neg" | "warn" | "accent" | "muted"; children: ReactNode }) {
  const t = { pos: "text-pos bg-pos/10 border-pos/25", neg: "text-neg bg-neg/10 border-neg/25", warn: "text-warn bg-warn/10 border-warn/25", accent: "text-accent bg-accent/10 border-accent/25", muted: "text-muted bg-surface border-line" }[tone];
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium", t)}>{children}</span>;
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="card scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {empty ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-10 text-center text-muted">
                موردی ثبت نشده است.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value, icon, href, tone }: { label: string; value: ReactNode; icon: IconName; href?: string; tone?: "accent" | "gold" }) {
  const body = (
    <div className="card group relative overflow-hidden p-5 transition hover:border-line-strong">
      <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition group-hover:bg-accent/20" />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone === "gold" ? "bg-accent-2/10 text-accent-2" : "bg-accent/10 text-accent")}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <p className="num mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Flash({ saved, error }: { saved?: boolean; error?: string | null }) {
  if (!saved && !error) return null;
  return (
    <p role="status" className={cn("mb-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", error ? "border-neg/30 bg-neg/5 text-neg" : "border-pos/30 bg-pos/5 text-pos")}>
      <Icon name={error ? "alert" : "check"} size={16} />
      {error ?? "تغییرات ذخیره شد."}
    </p>
  );
}

export const isPast = (d: Date | null) => !!d && d.getTime() < Date.now();

export const fmtDate = (d: Date | string | null) => (d ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date(d)) : "—");
