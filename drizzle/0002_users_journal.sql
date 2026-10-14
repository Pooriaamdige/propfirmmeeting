CREATE TABLE "journal_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" varchar(20) DEFAULT 'challenge' NOT NULL,
	"firm_id" integer,
	"firm_name" varchar(120) DEFAULT '' NOT NULL,
	"broker" varchar(120) DEFAULT '' NOT NULL,
	"platform" varchar(40) DEFAULT '' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"initial_balance" double precision NOT NULL,
	"started_at" date NOT NULL,
	"rules" jsonb,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"side" varchar(4) NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"entry_price" double precision NOT NULL,
	"exit_price" double precision,
	"lots" double precision NOT NULL,
	"stop_loss" double precision,
	"take_profit" double precision,
	"profit" double precision,
	"commission" double precision DEFAULT 0 NOT NULL,
	"swap" double precision DEFAULT 0 NOT NULL,
	"pips" double precision,
	"risk_amount" double precision,
	"setup" varchar(80) DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mistakes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emotion" varchar(20) DEFAULT '' NOT NULL,
	"rating" integer,
	"notes" text DEFAULT '' NOT NULL,
	"screenshot_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"type" varchar(12) NOT NULL,
	"amount" double precision NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"name" varchar(120) DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "journal_accounts" ADD CONSTRAINT "journal_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_accounts" ADD CONSTRAINT "journal_accounts_firm_id_prop_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."prop_firms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_trades" ADD CONSTRAINT "journal_trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_trades" ADD CONSTRAINT "journal_trades_account_id_journal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."journal_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_transactions" ADD CONSTRAINT "journal_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_transactions" ADD CONSTRAINT "journal_transactions_account_id_journal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."journal_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_accounts_user_idx" ON "journal_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "journal_trades_account_idx" ON "journal_trades" USING btree ("account_id","opened_at");--> statement-breakpoint
CREATE INDEX "journal_trades_user_idx" ON "journal_trades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "journal_tx_account_idx" ON "journal_transactions" USING btree ("account_id");