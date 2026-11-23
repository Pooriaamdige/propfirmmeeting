CREATE TABLE "lottery_weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"week" integer NOT NULL,
	"drawn_on" date,
	"published" boolean DEFAULT false NOT NULL,
	"winners" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lottery_weeks_week_unique" UNIQUE("week")
);
