import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function ErrorState({ message, lastUpdated, onRetry, compact }: { message: string; lastUpdated?: string | null; onRetry?: () => void; compact?: boolean }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neg/30 bg-neg/[0.04] text-center", compact ? "p-4" : "p-8")}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neg/10 text-neg">
        <Icon name="alert" />
      </span>
      <p className="text-sm font-medium text-fg">{message}</p>
      {lastUpdated && (
        <p className="text-xs text-muted">
          آخرین دریافت موفق: <span className="num">{formatClock(lastUpdated)}</span>
        </p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="mt-1 inline-flex items-center gap-2 rounded-lg border border-line-strong px-3 py-1.5 text-sm transition hover:border-accent/60 hover:text-accent">
          <Icon name="refresh" size={15} />
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = "info", title, description, action }: { icon?: IconName; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
