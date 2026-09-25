"use client";

import { useSearchParams } from "next/navigation";
import { isSymbol } from "@/lib/symbols";
import { ForexChart } from "./ForexChart";

/** Reads ?symbol= so search results can deep-link into the chart. */
export function MarketsChart() {
  const s = useSearchParams().get("symbol");
  return <ForexChart initialSymbol={isSymbol(s) ? s : "XAUUSD"} />;
}
