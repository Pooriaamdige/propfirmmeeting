"use client";

import { TIMEZONES, useTimezone } from "@/components/Providers";
import { cn } from "@/lib/cn";

export function TimezoneSwitch() {
  const { tz, setTz } = useTimezone();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">منطقه زمانی:</span>
      <div className="flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="منطقه زمانی">
        {TIMEZONES.map((t) => (
          <button key={t.id} role="radio" aria-checked={tz === t.id} onClick={() => setTz(t.id)} className={cn("rounded-md px-2.5 py-1 text-xs transition", tz === t.id ? "bg-accent/10 font-medium text-accent" : "text-muted hover:text-fg")}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
