import type { Impact } from "@/lib/types";
import { cn } from "@/lib/cn";

export const IMPACT_META: Record<Impact, { label: string; fa: string; bars: number; color: string }> = {
  high: { label: "High", fa: "اثر بالا", bars: 3, color: "bg-neg" },
  medium: { label: "Medium", fa: "اثر متوسط", bars: 2, color: "bg-warn" },
  low: { label: "Low", fa: "اثر کم", bars: 1, color: "bg-[#EAB308]" },
  holiday: { label: "Holiday", fa: "تعطیلی", bars: 0, color: "bg-faint" },
};

export function ImpactBadge({ impact, showLabel = false }: { impact: Impact; showLabel?: boolean }) {
  const m = IMPACT_META[impact];
  return (
    <span className="inline-flex items-center gap-1.5" title={`${m.label} Impact`}>
      <span className="flex items-end gap-[2px]" aria-hidden dir="ltr">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-sm", i <= m.bars ? m.color : "bg-line-strong")} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      <span className={showLabel ? "latin text-xs text-muted" : "sr-only"}>{m.label} Impact</span>
    </span>
  );
}
