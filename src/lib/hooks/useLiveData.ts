"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataEnvelope } from "@/lib/types";

interface State<T> {
  envelope: DataEnvelope<T> | null;
  error: string | null;
  loading: boolean;
}

/**
 * Fetches one of our own `/api/*` endpoints (never a provider directly), polls on an
 * interval while the tab is visible, and keeps the last good payload on failure so the
 * UI can show "last successful update" alongside the error.
 */
export function useLiveData<T>(url: string | null, refreshMs = 0) {
  const [state, setState] = useState<State<T>>({ envelope: null, error: null, loading: !!url });
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((s) => ({ ...s, loading: s.envelope === null }));
    try {
      const res = await fetch(url, { signal: controller.signal });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? "اطلاعات لحظه‌ای موقتاً در دسترس نیست.");
      setState({ envelope: json as DataEnvelope<T>, error: null, loading: false });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({ ...s, error: (err as Error).message || "خطا در دریافت اطلاعات", loading: false }));
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    // Reset when the resource changes (e.g. new symbol/timeframe) so skeletons show.
    setState({ envelope: null, error: null, loading: true });
    load();
    if (!refreshMs) return () => controllerRef.current?.abort();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, refreshMs);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      controllerRef.current?.abort();
    };
  }, [url, refreshMs, load]);

  return {
    data: state.envelope?.data ?? null,
    envelope: state.envelope,
    error: state.error,
    loading: state.loading,
    retry: load,
  };
}
