CREATE TABLE "lottery_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"telegram_id" varchar(40) NOT NULL,
	"campaign_id" varchar(64) NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "lottery_email_campaign_idx" ON "lottery_registrations" USING btree ("email","campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lottery_phone_campaign_idx" ON "lottery_registrations" USING btree ("phone","campaign_id");