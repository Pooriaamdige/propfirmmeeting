import type { PropFirm, RuleDetail } from "@/lib/types";

/** Shared (server + client) shape and defaults for the admin prop firm editor. */
export type FirmData = Omit<PropFirm, "id" | "slug" | "name" | "dbId" | "published" | "featured">;
export interface FirmFormValue {
  slug: string;
  name: string;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  data: FirmData;
}

const rule = (): RuleDetail => ({ status: "unknown", note: "" });

export function emptyFirm(): FirmFormValue {
  return {
    slug: "",
    name: "",
    published: false,
    featured: false,
    sortOrder: 100,
    data: {
      logo: { monogram: "", color: "#EB7E2F" },
      website: "https://",
      country: null,
      foundedYear: null,
      description: "",
      program: "",
      platforms: ["MT5"],
      challengeFee: { accountSize: 100000, fee: 0, currency: "USD" },
      feeTiers: [],
      phases: [
        { name: "Phase 1", profitTarget: 8, dailyDrawdown: 5, maxDrawdown: 10, minTradingDays: 3, timeLimit: "نامحدود" },
        { name: "Phase 2", profitTarget: 5, dailyDrawdown: 5, maxDrawdown: 10, minTradingDays: 3, timeLimit: "نامحدود" },
        { name: "Funded", profitTarget: null, dailyDrawdown: 5, maxDrawdown: 10, minTradingDays: null, timeLimit: "—" },
      ],
      profitTarget: { phase1: 8, phase2: 5 },
      dailyDrawdown: { value: 5, basis: "" },
      maxDrawdown: { value: 10, type: "static", basis: "" },
      profitSplit: { base: 80, max: 90 },
      leverage: { forex: "1:100", metals: "1:30" },
      minimumTradingDays: 3,
      newsTrading: rule(),
      weekendHolding: rule(),
      overnightHolding: rule(),
      eaAllowed: rule(),
      copyTrading: rule(),
      hedging: rule(),
      consistencyRule: rule(),
      ipRules: rule(),
      vpnVps: rule(),
      payoutRules: { firstPayout: "", frequency: "", methods: [], note: "" },
      scalingRules: { available: false, note: "" },
      refundPolicy: { available: false, note: "" },
      accessNote: "به دلیل محدودیت‌های تحریمی، بسیاری از پراپ‌فرم‌ها ثبت‌نام یا پرداخت سود به ساکنان ایران را محدود می‌کنند. پیش از خرید، شرایط کشورهای مجاز را در صفحه رسمی شرکت بررسی کنید.",
      highlights: [],
      limitations: [],
      faq: [],
      sources: [],
      status: "in-review",
      lastReviewedAt: new Date().toISOString().slice(0, 10),
    },
  };
}

