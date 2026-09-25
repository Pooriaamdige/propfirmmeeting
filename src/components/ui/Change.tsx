import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";

export function Change({ value, className, arrow = true }: { value: number; className?: string; arrow?: boolean }) {
  const up = value >= 0;
  return (
    <span className={cn("num inline-flex items-center gap-0.5 font-medium", up ? "text-pos" : "text-neg", className)}>
      {arrow && <span aria-hidden className="text-[0.7em]">{up ? "▲" : "▼"}</span>}
      {formatPercent(value)}
      <span className="sr-only">{up ? "افزایش" : "کاهش"}</span>
    </span>
  );
}
