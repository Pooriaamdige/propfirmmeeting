"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useHydrated } from "./useHydrated";

const EVENT = "pfm:storage";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** JSON value persisted in localStorage, synced across components and tabs. */
export function useLocalStorage<T>(key: string, initial: T) {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(EVENT, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(EVENT, cb);
    };
  }, []);
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const ready = useHydrated();

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
    // `initial` is intentionally ignored after first render (callers pass literals).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = (() => {
        const r = read(key);
        try {
          return r === null ? initial : (JSON.parse(r) as T);
        } catch {
          return initial;
        }
      })();
      const v = typeof next === "function" ? (next as (p: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* storage unavailable */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, update, ready] as const;
}
