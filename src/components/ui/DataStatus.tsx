import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";

/**
 * Source + timestamp line required next to every data-driven widget.
 * Mock data is explicitly labelled so it can never be mistaken for live data.
 */
export function DataStatus({ fetchedAt, source, isMock, stale, className, timeZone }: { fetchedAt?: string | null; source?: string; isMock?: boolean; stale?: boolean; className?: string; timeZone?: string }) {
  if (!fetchedAt) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted", className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", isMock ? "bg-warn" : stale ? "bg-neg" : "live-dot bg-pos")} aria-hidden />
        آخرین بروزرسانی: <time className="num text-fg/80" dateTime={fetchedAt}>{formatClock(fetchedAt, timeZone)}</time>
      </span>
      {source && (
        <span>
          منبع: <span className="latin">{source}</span>
        </span>
      )}
      {isMock && <span className="rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[11px] font-medium text-warn">داده نمایشی — غیر زنده</span>}
      {stale && !isMock && <span className="text-neg">اتصال قطع است</span>}
    </p>
  );
}
