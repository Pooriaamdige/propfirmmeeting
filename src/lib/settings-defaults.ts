export interface SiteSettings {
  hero: { title: string; highlight: string; subtitle: string };
  announcement: { enabled: boolean; text: string; href: string };
  social: { telegram: string; instagram: string; x: string; email: string };
  contact: { email: string; telegramSupport: string };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    title: "قبل از خرید چالش،",
    highlight: "پراپ‌فرم را دقیق بررسی کن",
    subtitle: "شرایط، قوانین، هزینه، دراداون، تقسیم سود و اعتبار پراپ‌فرم‌ها را در یکجا مقایسه کن — و با کدهای تخفیف اختصاصی ارزان‌تر بخر.",
  },
  announcement: { enabled: false, text: "", href: "" },
  social: { telegram: "https://t.me/", instagram: "https://instagram.com/", x: "https://x.com/", email: "mailto:hello@example.com" },
  contact: { email: "hello@example.com", telegramSupport: "" },
};
