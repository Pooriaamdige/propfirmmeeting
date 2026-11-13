import { test } from "node:test";
import assert from "node:assert/strict";
import { formatActual, mergeActuals } from "../src/lib/services/calendar/actuals.ts";
import type { EconomicEvent } from "../src/lib/types.ts";

const ev = (title: string, iso: string, forecast: string | null, previous: string | null, currency = "USD"): EconomicEvent => ({
  id: title, datetime: iso, allDay: false, currency: currency as EconomicEvent["currency"], impact: "high", title, actual: null, forecast, previous,
});
const now = Date.parse("2026-11-12T12:00:00Z");

test("formatActual follows the unit and decimals of previous/forecast", () => {
  assert.equal(formatActual(0.4, ev("CPI m/m", "2026-11-10T13:30:00Z", "0.3%", "0.2%")), "0.4%");
  assert.equal(formatActual("4.25", ev("Rate", "2026-11-10T13:30:00Z", "4.25%", "4.50%")), "4.25%");
  assert.equal(formatActual(256000, ev("NFP", "2026-11-10T13:30:00Z", "160K", "227K")), "256K");
  assert.equal(formatActual("1.2B", ev("x", "2026-11-10T13:30:00Z", null, null)), "1.2B");
  assert.equal(formatActual(null, ev("x", "2026-11-10T13:30:00Z", null, null)), null);
});

test("mergeActuals matches by title (any timezone offset) and by minute", () => {
  const events = [
    ev("CPI m/m", "2026-11-10T13:30:00Z", "0.3%", "0.2%"),
    ev("Core CPI m/m", "2026-11-10T13:30:00Z", "0.3%", "0.3%"),
    ev("Unemployment Claims", "2026-11-11T13:30:00Z", "220K", "218K"),
    ev("Retail Sales m/m", "2026-11-13T13:30:00Z", "0.4%", "0.1%"), // future
  ];
  const rows = [
    { title: "CPI m/m", currency: "USD", time: Date.parse("2026-11-10T16:30:00Z"), actual: 0.4 }, // source in GMT+3
    { title: "Core Inflation Rate MoM", currency: "USD", time: Date.parse("2026-11-10T13:30:00Z"), actual: "0.2%" },
    { title: "Inflation Rate MoM", currency: "USD", time: Date.parse("2026-11-10T13:30:00Z"), actual: "0.4%" },
    { title: "Initial Jobless Claims", currency: "USD", time: Date.parse("2026-11-11T13:30:00Z"), actual: 225000 },
    { title: "Retail Sales m/m", currency: "USD", time: Date.parse("2026-11-13T13:30:00Z"), actual: 0.5 },
  ];
  const out = mergeActuals(events, rows, now);
  assert.equal(out[0].actual, "0.4%");
  assert.equal(out[1].actual, "0.2%"); // "core" + "mom" wins over "Inflation Rate MoM"
  assert.equal(out[2].actual, "225K"); // only release that minute, shares "claims"
  assert.equal(out[3].actual, null); // not released yet
});

test("mergeActuals ignores an unrelated lone release at the same minute", () => {
  const out = mergeActuals([ev("Crude Oil Inventories", "2026-11-11T15:30:00Z", "-1.2M", "2.0M")], [{ title: "Fed Chair Speech", currency: "USD", time: Date.parse("2026-11-11T15:30:00Z"), actual: 1 }], now);
  assert.equal(out[0].actual, null);
});
