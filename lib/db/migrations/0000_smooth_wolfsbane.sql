CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"token_lookup" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "accounts_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "accounts_token_lookup_unique" UNIQUE("token_lookup")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_token_lookup_idx" ON "accounts" USING btree ("token_lookup");--> statement-breakpoint
CREATE INDEX "accounts_last_seen_at_idx" ON "accounts" USING btree ("last_seen_at");