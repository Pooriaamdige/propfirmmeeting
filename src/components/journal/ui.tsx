import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export function StatTile({ label, value, sub, tone, hint }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "pos" | "neg" | "muted"; hint?: string }) {
  return (
    <div className="card p-4" title={hint}>
      <p className="flex items-center gap-1 text-xs text-muted">
        {label}
        {hint && <Icon name="info" size={12} className="text-faint" />}
      </p>
      <p className={cn("num mt-1.5 text-xl font-bold", tone === "pos" && "text-pos", tone === "neg" && "text-neg")}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-faint">{sub}</p>}
    </div>
  );
}

export function Card({ title, children, action, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cn("card p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="مسیر" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.href ? (
            <Link href={it.href} className="hover:text-fg">
              {it.label}
            </Link>
          ) : (
            <span className="text-fg">{it.label}</span>
          )}
          {i < items.length - 1 && <span aria-hidden>/</span>}
        </span>
      ))}
    </nav>
  );
}

export function RuleStatusBadge({ status }: { status: "passed" | "breached" | "in-progress" | null }) {
  if (!status) return null;
  const m = { passed: ["قبول شده", "text-pos border-pos/30 bg-pos/10"], breached: ["نقض قانون", "text-neg border-neg/30 bg-neg/10"], "in-progress": ["در حال انجام", "text-accent-2 border-accent-2/30 bg-accent-2/10"] }[status];
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", m[1])}>{m[0]}</span>;
}
