export const SITE = {
  name: "پراپ‌میتینگ",
  nameEn: "PropFirm Meeting",
  tagline: "مرجع فارسی بررسی پراپ‌فرم‌ها و ابزارهای موردنیاز تریدر",
  description: "بررسی، مقایسه و تحلیل پراپ‌فرم‌های فارکس به زبان فارسی؛ همراه با داده‌های بازار، تقویم اقتصادی به وقت تهران، اخبار مهم و ابزارهای محاسبه ریسک و دراداون.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "fa_IR",
  social: {
    telegram: "https://t.me/",
    instagram: "https://instagram.com/",
    x: "https://x.com/",
    email: "mailto:hello@example.com",
  },
};

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
