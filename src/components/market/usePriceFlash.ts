"use client";

import { useEffect, useRef, useState } from "react";

/** Returns "flash-up"/"flash-down" briefly when a value changes. */
export function usePriceFlash(value: number | undefined) {
  const prev = useRef<number | undefined>(value);
  const [cls, setCls] = useState("");
  useEffect(() => {
    if (value === undefined || prev.current === undefined || value === prev.current) {
      prev.current = value;
      return;
    }
    setCls(value > prev.current ? "flash-up" : "flash-down");
    prev.current = value;
    const t = setTimeout(() => setCls(""), 900);
    return () => clearTimeout(t);
  }, [value]);
  return cls;
}
