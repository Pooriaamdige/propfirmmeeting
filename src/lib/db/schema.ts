import { boolean, date, doublePrecision, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import type { PropFirm } from "@/lib/types";
import type { LotteryWinner } from "@/lib/lottery-winners";

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

/** Sequential giveaway weeks; sponsor/account labels remain historical snapshots. */
export const lotteryWeeks = pgTable("lottery_weeks", {
  id: serial("id").primaryKey(),
  week: integer("week").notNull().unique(),
  drawnOn: date("drawn_on"),
  published: boolean("published").default(false).notNull(),
  winners: jsonb("winners").$type<LotteryWinner[]>().default([]).notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
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

/* ------------------------------ Site users ------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  name: varchar("name", { length: 120 }).default("").notNull(),
  passwordHash: text("password_hash").notNull(),
  disabled: boolean("disabled").default(false).notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  lastLoginAt: ts("last_login_at"),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // sha256(token)
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});

/* -------------------------------- Journal -------------------------------- */

export interface JournalRules {
  dailyDrawdownPct: number | null;
  maxDrawdownPct: number | null;
  maxDrawdownType: "static" | "trailing";
  profitTargetPct: number | null;
  minTradingDays: number | null;
  /** Max share (%) of total profit allowed from the single best day. */
  consistencyPct: number | null;
}

export const journalAccounts = pgTable(
  "journal_accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    type: varchar("type", { length: 20 }).default("challenge").notNull(), // challenge | funded | personal | demo
    firmId: integer("firm_id").references(() => propFirms.id, { onDelete: "set null" }),
    firmName: varchar("firm_name", { length: 120 }).default("").notNull(),
    broker: varchar("broker", { length: 120 }).default("").notNull(),
    platform: varchar("platform", { length: 40 }).default("").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    initialBalance: doublePrecision("initial_balance").notNull(),
    startedAt: date("started_at").notNull(),
    rules: jsonb("rules").$type<JournalRules>(),
    archived: boolean("archived").default(false).notNull(),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [index("journal_accounts_user_idx").on(t.userId)],
);

export const journalTrades = pgTable(
  "journal_trades",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => journalAccounts.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    side: varchar("side", { length: 4 }).notNull(), // buy | sell
    openedAt: ts("opened_at").notNull(),
    closedAt: ts("closed_at"), // null = still open
    entryPrice: doublePrecision("entry_price").notNull(),
    exitPrice: doublePrecision("exit_price"),
    lots: doublePrecision("lots").notNull(),
    stopLoss: doublePrecision("stop_loss"),
    takeProfit: doublePrecision("take_profit"),
    /** Gross P/L in account currency as shown by the platform (before commission/swap). */
    profit: doublePrecision("profit"),
    /** Commission as a positive cost. */
    commission: doublePrecision("commission").default(0).notNull(),
    /** Swap, signed (credit positive). */
    swap: doublePrecision("swap").default(0).notNull(),
    pips: doublePrecision("pips"),
    /** Money at risk at entry (from stop loss). Enables R-multiples. */
    riskAmount: doublePrecision("risk_amount"),
    setup: varchar("setup", { length: 80 }).default("").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    mistakes: jsonb("mistakes").$type<string[]>().default([]).notNull(),
    emotion: varchar("emotion", { length: 20 }).default("").notNull(),
    rating: integer("rating"),
    notes: text("notes").default("").notNull(),
    screenshotUrl: text("screenshot_url"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [index("journal_trades_account_idx").on(t.accountId, t.openedAt), index("journal_trades_user_idx").on(t.userId)],
);

export const journalTransactions = pgTable(
  "journal_transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => journalAccounts.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 12 }).notNull(), // deposit | withdrawal
    amount: doublePrecision("amount").notNull(),
    at: ts("at").notNull(),
    note: text("note").default("").notNull(),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("journal_tx_account_idx").on(t.accountId)],
);
