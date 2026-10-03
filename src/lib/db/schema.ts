import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import type { PropFirm } from "@/lib/types";

const ts = (name: string) => timestamp(name, { withTimezone: true });

/* ------------------------------ Content ------------------------------ */

/** Prop firm review. The full nested record lives in `data`; indexed columns mirror what lists need. */
export const propFirms = pgTable("prop_firms", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  data: jsonb("data").$type<Omit<PropFirm, "id" | "slug" | "name">>().notNull(),
  published: boolean("published").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").references(() => propFirms.id, { onDelete: "set null" }),
  title: varchar("title", { length: 160 }).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  discountLabel: varchar("discount_label", { length: 60 }).notNull(),
  discountPercent: integer("discount_percent"),
  description: text("description").default("").notNull(),
  terms: text("terms").default("").notNull(),
  url: text("url"),
  startsAt: ts("starts_at"),
  expiresAt: ts("expires_at"),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  copyCount: integer("copy_count").default(0).notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  excerpt: text("excerpt").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  body: text("body").notNull(), // lightweight Markdown
  author: varchar("author", { length: 80 }).default("تیم تحریریه").notNull(),
  readingMinutes: integer("reading_minutes").default(5).notNull(),
  published: boolean("published").default(true).notNull(),
  publishedAt: ts("published_at").defaultNow().notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export const lotteryCampaigns = pgTable("lottery_campaigns", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(), // stored as campaign_id on registrations
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").default("").notNull(),
  prize: varchar("prize", { length: 200 }).default("").notNull(),
  startsAt: ts("starts_at"),
  endsAt: ts("ends_at"),
  active: boolean("active").default(false).notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export const lotteryRegistrations = pgTable(
  "lottery_registrations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    telegramId: varchar("telegram_id", { length: 40 }).notNull(),
    campaignId: varchar("campaign_id", { length: 64 }).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lottery_email_campaign_idx").on(t.email, t.campaignId), uniqueIndex("lottery_phone_campaign_idx").on(t.phone, t.campaignId)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  source: text("source").default("website").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

/* -------------------------------- Admin -------------------------------- */

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  name: varchar("name", { length: 120 }).default("").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).default("admin").notNull(), // admin | editor
  createdAt: ts("created_at").defaultNow().notNull(),
  lastLoginAt: ts("last_login_at"),
});

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // sha256(token)
  userId: integer("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});
