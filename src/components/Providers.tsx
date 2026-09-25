"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

/* ----------------------------- Timezone ----------------------------- */

export const TIMEZONES = [
  { id: "Asia/Tehran", label: "تهران" },
  { id: "UTC", label: "UTC" },
  { id: "America/New_York", label: "نیویورک" },
  { id: "Europe/London", label: "لندن" },
] as const;
export type TimeZoneId = (typeof TIMEZONES)[number]["id"];

const TimezoneCtx = createContext<{ tz: TimeZoneId; setTz: (tz: TimeZoneId) => void }>({ tz: "Asia/Tehran", setTz: () => {} });
export const useTimezone = () => useContext(TimezoneCtx);

/* ------------------------------ Compare ----------------------------- */

export const MAX_COMPARE = 4;
interface CompareState {
  selected: string[];
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  set: (slugs: string[]) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  ready: boolean;
}
const CompareCtx = createContext<CompareState | null>(null);
export function useCompare() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompare must be used inside <Providers>");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [tz, setTz] = useLocalStorage<TimeZoneId>("pfm:tz", "Asia/Tehran");
  const [selected, setSelected, ready] = useLocalStorage<string[]>("pfm:compare", []);

  const toggle = useCallback(
    (slug: string) => setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= MAX_COMPARE ? prev : [...prev, slug])),
    [setSelected],
  );
  const compare = useMemo<CompareState>(
    () => ({
      selected,
      toggle,
      remove: (slug) => setSelected((prev) => prev.filter((s) => s !== slug)),
      set: (slugs) => setSelected(slugs.slice(0, MAX_COMPARE)),
      clear: () => setSelected([]),
      has: (slug) => selected.includes(slug),
      ready,
    }),
    [selected, toggle, setSelected, ready],
  );

  return (
    <TimezoneCtx.Provider value={{ tz, setTz }}>
      <CompareCtx.Provider value={compare}>{children}</CompareCtx.Provider>
    </TimezoneCtx.Provider>
  );
}
