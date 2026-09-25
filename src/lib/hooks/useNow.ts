"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Current time, re-rendering every `intervalMs` (value is truncated to the interval).
 * Returns null during SSR/hydration to avoid mismatches.
 */
export function useNow(intervalMs = 1000): Date | null {
  const subscribe = useCallback(
    (cb: () => void) => {
      const id = window.setInterval(cb, intervalMs);
      return () => window.clearInterval(id);
    },
    [intervalMs],
  );
  const tick = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs),
    () => null,
  );
  return tick === null ? null : new Date(tick * intervalMs);
}
