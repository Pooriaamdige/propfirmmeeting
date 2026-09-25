import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { themeScript } from "@/components/layout/ThemeToggle";
import { SearchModal } from "@/components/search/SearchModal";
import { Providers } from "@/components/Providers";
import { CompareTray } from "@/components/propfirms/CompareTray";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE, absoluteUrl } from "@/lib/site";

const vazir = localFont({
  src: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn[wght].woff2",
  variable: "--font-vazir",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | بررسی و مقایسه پراپ‌فرم‌های فارکس`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: SITE.locale, siteName: SITE.name, url: "/", title: SITE.name, description: SITE.description },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  robots: { index: true, follow: true },
  keywords: ["پراپ فرم", "Prop Firm", "فارکس", "مقایسه پراپ فرم", "FTMO", "تقویم اقتصادی", "دراداون", "Forex Factory"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070B14" },
    { media: "(prefers-color-scheme: light)", color: "#F4F5F7" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark" className={vazir.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <JsonLd
          data={[
            { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, alternateName: SITE.nameEn, url: SITE.url, logo: absoluteUrl("/icon.svg") },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE.name,
              url: SITE.url,
              inLanguage: "fa-IR",
              potentialAction: { "@type": "SearchAction", target: `${SITE.url}/prop-firms/?q={search_term_string}`, "query-input": "required name=search_term_string" },
            },
          ]}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CompareTray />
          <SearchModal />
        </Providers>
      </body>
    </html>
  );
}
