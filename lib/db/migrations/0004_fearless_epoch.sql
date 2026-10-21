CREATE TABLE "pastes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"account_id" uuid,
	"content" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pastes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pastes_account_id_idx" ON "pastes" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "pastes_expires_at_idx" ON "pastes" USING btree ("expires_at");