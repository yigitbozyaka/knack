CREATE TABLE "expirable_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"resource_id" text NOT NULL,
	"storage_key" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expirable_objects_kind_check" CHECK ("expirable_objects"."kind" in ('upload','paste','note','short'))
);
--> statement-breakpoint
CREATE INDEX "expirable_objects_expires_at_idx" ON "expirable_objects" USING btree ("expires_at");