import { pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lottery_email_campaign_idx").on(t.email, t.campaignId), uniqueIndex("lottery_phone_campaign_idx").on(t.phone, t.campaignId)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  source: text("source").default("website").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
