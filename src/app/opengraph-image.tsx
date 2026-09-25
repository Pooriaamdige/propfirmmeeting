import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/vazirmatn/fonts/ttf/Vazirmatn-Black.ttf")),
    readFile(join(process.cwd(), "node_modules/vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf")),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#070B14",
          backgroundImage: "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#F8FAFC",
          fontFamily: "Vazirmatn",
          direction: "rtl",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#00D4A8" }}>{SITE.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.3 }}>قبل از خرید چالش، پراپ‌فرم را دقیق بررسی کن</div>
          <div style={{ fontSize: 30, color: "#94A3B8" }}>مقایسه قوانین، دراداون، تقسیم سود و هزینه پراپ‌فرم‌ها</div>
        </div>
        <div style={{ display: "flex", gap: 36, fontSize: 26, color: "#94A3B8" }}>
          <span>XAUUSD</span>
          <span>EURUSD</span>
          <span>GBPUSD</span>
          <span>BTCUSD</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Vazirmatn", data: bold, weight: 900, style: "normal" },
        { name: "Vazirmatn", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
