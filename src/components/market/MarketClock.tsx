"use client";

import { useNow } from "@/lib/hooks/useNow";
import { SESSIONS, activeSessions, isForexWeekend, sessionStatus } from "@/lib/sessions";
import { formatClock, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

const CITIES = [
  { tz: "Asia/Tehran", label: "تهران" },
  { tz: "Europe/London", label: "لندن" },
  { tz: "America/New_York", label: "نیویورک" },
  { tz: "Asia/Tokyo", label: "توکیو" },
];

function duration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return toFaDigits(`${h}:${String(m).padStart(2, "0")}`);
}

/** Compact variant for the header. */
export function MarketClockCompact() {
  const now = useNow(1000);
  const active = now ? activeSessions(now) : [];
  return (
    <div className="hidden items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-card/60 px-2.5 py-1.5 text-xs 2xl:flex" aria-label="ساعت بازار">
      <span className="text-muted">تهران</span>
      <span className="num min-w-[4.2rem] font-semibold text-fg" suppressHydrationWarning>
        {now ? formatClock(now) : "--:--:--"}
      </span>
      <span className="h-3 w-px bg-line-strong" aria-hidden />
      {now && isForexWeekend(now) ? (
        <span className="text-warn">بازار بسته</span>
      ) : (
        <span className="latin inline-flex items-center gap-1.5 text-pos">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-pos" aria-hidden />
          {active.length ? active.map((s) => s.name).join(" · ") : "—"}
        </span>
      )}
    </div>
  );
}

/** Full widget: world clocks + session bars. */
export function MarketClock({ className }: { className?: string }) {
  const now = useNow(1000);
  const weekend = now ? isForexWeekend(now) : false;

  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="font-bold">ساعت بازار</h3>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", weekend ? "bg-warn/10 text-warn" : "bg-pos/10 text-pos")}>{weekend ? "بازار فارکس تعطیل است" : "بازار فارکس باز است"}</span>
      </div>
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
        {CITIES.map((c) => (
          <div key={c.tz} className="bg-card px-5 py-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="num mt-1 text-xl font-bold tracking-tight" suppressHydrationWarning>
              {now ? formatClock(now, c.tz) : "--:--:--"}
            </p>
          </div>
        ))}
      </div>
      <ul className="space-y-3 px-5 py-4">
        {SESSIONS.filter((s) => s.id !== "sydney").map((s) => {
          const st = now ? sessionStatus(now, s) : null;
          return (
            <li key={s.id} className="text-sm">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", st?.open ? "live-dot bg-pos" : "bg-line-strong")} aria-hidden />
                  <span className="latin font-medium">{s.name}</span>
                  <span className="text-xs text-faint">{s.faName}</span>
                </span>
                <span className={cn("text-xs", st?.open ? "text-pos" : "text-muted")}>
                  {!st ? "…" : st.open ? <>فعال · <span className="num">{duration(st.minutesToChange)}</span> تا پایان</> : weekend ? "تعطیل آخر هفته" : <><span className="num">{duration(st.minutesToChange)}</span> تا شروع</>}
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden>
                <div className={cn("absolute inset-y-0 start-0 rounded-full transition-[width] duration-1000", st?.open ? "bg-accent" : "bg-transparent")} style={{ width: `${Math.round((st?.progress ?? 0) * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
