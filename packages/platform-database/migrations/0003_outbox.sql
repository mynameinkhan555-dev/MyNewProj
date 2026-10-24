CREATE TABLE IF NOT EXISTS "outbox_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"event_version" integer NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"claimed_by" text,
	"claim_expires_at" timestamp with time zone,
	CONSTRAINT "chk_outbox_events_event_version" CHECK (event_version >= 1),
	CONSTRAINT "chk_outbox_events_attempts" CHECK (attempts >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_consumption" (
	"event_id" uuid NOT NULL,
	"consumer_id" text NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_event_consumption" PRIMARY KEY ("event_id", "consumer_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_consumption" ADD CONSTRAINT "fk_event_consumption_event_id" FOREIGN KEY ("event_id") REFERENCES "public"."outbox_events"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_events_aggregate" ON "outbox_events"("aggregate_id", "aggregate_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_events_occurred_at" ON "outbox_events"("occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_events_retry" ON "outbox_events"("next_attempt_at", "created_at") WHERE "published_at" IS NULL;
