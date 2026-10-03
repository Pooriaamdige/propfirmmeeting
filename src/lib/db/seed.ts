import "server-only";
import { count } from "drizzle-orm";
import type { DB } from "./index";
import * as schema from "./schema";
import { seedPropFirms } from "@/data/seed-prop-firms";
import { seedArticles, sectionsToMarkdown } from "@/data/seed-articles";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { hashPassword } from "@/lib/auth/password";

const isProd = process.env.NODE_ENV === "production";

/** Idempotent: each table is only seeded while it is empty. */
export async function seed(db: DB) {
  const [[firms], [arts], [camps], [settings], [admins], [coupons]] = await Promise.all([
    db.select({ n: count() }).from(schema.propFirms),
    db.select({ n: count() }).from(schema.articles),
    db.select({ n: count() }).from(schema.lotteryCampaigns),
    db.select({ n: count() }).from(schema.siteSettings),
    db.select({ n: count() }).from(schema.adminUsers),
    db.select({ n: count() }).from(schema.coupons),
  ]);

  if (firms.n === 0) {
    await db.insert(schema.propFirms).values(
      seedPropFirms.map((firm, i) => {
        const { id, slug, name, ...data } = firm;
        void id; // database assigns ids
        return { slug, name, data, sortOrder: i, featured: i < 3 };
      }),
    );
  }

  if (arts.n === 0) {
    await db.insert(schema.articles).values(
      seedArticles.map((a) => ({
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        category: a.category,
        body: sectionsToMarkdown(a.sections),
        author: a.author,
        readingMinutes: a.readingMinutes,
        publishedAt: new Date(a.publishedAt),
        updatedAt: new Date(a.updatedAt),
      })),
    );
  }

  if (camps.n === 0) {
    await db.insert(schema.lotteryCampaigns).values({
      slug: process.env.LOTTERY_CAMPAIGN_ID ?? "2026-autumn",
      title: "قرعه‌کشی پاییز ۱۴۰۵",
      description: "با ثبت اطلاعاتت، در قرعه‌کشی‌های دوره‌ای شرکت کن.",
      prize: "یک حساب چالش پراپ‌فرم",
      active: true,
    });
  }

  if (settings.n === 0) {
    await db.insert(schema.siteSettings).values(Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })));
  }

  if (coupons.n === 0) {
    // Example coupons so the structure is visible. Inactive in production: replace them from the admin panel.
    const rows = await db.select({ id: schema.propFirms.id, slug: schema.propFirms.slug }).from(schema.propFirms);
    const idOf = (slug: string) => rows.find((r) => r.slug === slug)?.id ?? null;
    await db.insert(schema.coupons).values([
      { firmId: idOf("fundingpips"), title: "تخفیف چالش FundingPips", code: "SAMPLE-FP10", discountLabel: "۱۰٪ تخفیف", discountPercent: 10, description: "کد نمونه — از پنل مدیریت با کد واقعی جایگزین کنید.", terms: "برای همه سایزهای حساب 2-Step.", featured: true, active: !isProd, sortOrder: 0 },
      { firmId: idOf("the5ers"), title: "تخفیف The5ers High Stakes", code: "SAMPLE-5ERS", discountLabel: "۵٪ تخفیف", discountPercent: 5, description: "کد نمونه — از پنل مدیریت با کد واقعی جایگزین کنید.", terms: "فقط برای خرید اول.", active: !isProd, sortOrder: 1 },
      { firmId: idOf("fundednext"), title: "تخفیف FundedNext Stellar", code: "SAMPLE-FN15", discountLabel: "۱۵٪ تخفیف", discountPercent: 15, description: "کد نمونه — از پنل مدیریت با کد واقعی جایگزین کنید.", terms: "قابل استفاده تا پایان ماه.", active: !isProd, sortOrder: 2 },
    ]);
  }

  if (admins.n === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      await db.insert(schema.adminUsers).values({ email, name: "Admin", passwordHash: await hashPassword(password), role: "admin" });
      console.info(`[admin] created initial admin ${email}`);
    } else if (!isProd) {
      await db.insert(schema.adminUsers).values({ email: "admin@propfirm.local", name: "Dev Admin", passwordHash: await hashPassword("admin1234"), role: "admin" });
      console.warn("[admin] development admin created: admin@propfirm.local / admin1234");
    } else {
      console.warn("[admin] no admin users — set ADMIN_EMAIL and ADMIN_PASSWORD, or run `npm run admin:create`");
    }
  }
}
