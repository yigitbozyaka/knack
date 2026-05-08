CREATE TABLE "abuse_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"reporter_email" text,
	"reporter_ip_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "abuse_reports_resource_type_check" CHECK ("abuse_reports"."resource_type" in ('paste','short','upload','note')),
	CONSTRAINT "abuse_reports_reason_check" CHECK ("abuse_reports"."reason" in ('spam','malware','phishing','illegal','csam','other')),
	CONSTRAINT "abuse_reports_status_check" CHECK ("abuse_reports"."status" in ('pending','reviewed','actioned','dismissed'))
);
--> statement-breakpoint
CREATE INDEX "abuse_reports_resource_idx" ON "abuse_reports" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "abuse_reports_status_created_idx" ON "abuse_reports" USING btree ("status","created_at");