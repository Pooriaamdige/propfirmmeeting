import type { EconomicEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

export function EventValues({ e, className }: { e: EconomicEvent; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-3 gap-3 text-xs", className)}>
      <div>
        <dt className="text-faint">Actual</dt>
        <dd className="num mt-0.5 font-semibold text-fg">{e.actual ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-faint">Forecast</dt>
        <dd className="num mt-0.5">{e.forecast ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-faint">Previous</dt>
        <dd className="num mt-0.5 text-muted">{e.previous ?? "—"}</dd>
      </div>
    </dl>
  );
}
