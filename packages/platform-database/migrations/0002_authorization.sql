CREATE TABLE IF NOT EXISTS "permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"scope" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "uq_permissions_key" UNIQUE("key"),
	CONSTRAINT "chk_permissions_scope" CHECK (scope IN ('TENANT', 'PLATFORM')),
	CONSTRAINT "chk_permissions_status" CHECK (status IN ('ACTIVE', 'DELETED'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "uq_tenant_roles_tenant_key" UNIQUE("tenant_id", "key"),
	CONSTRAINT "chk_tenant_roles_status" CHECK (status IN ('ACTIVE', 'DELETED'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"membership_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "chk_role_assignments_status" CHECK (status IN ('ACTIVE', 'DELETED'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pk_role_permissions" PRIMARY KEY ("role_id", "permission_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_roles" ADD CONSTRAINT "fk_tenant_roles_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_assignments" ADD CONSTRAINT "fk_role_assignments_membership_id" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_assignments" ADD CONSTRAINT "fk_role_assignments_role_id" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_roles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_roles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_assignments_membership_id" ON "role_assignments"("membership_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_assignments_role_id" ON "role_assignments"("role_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_role_assignments_active_membership_role" ON "role_assignments"("membership_id", "role_id") WHERE status = 'ACTIVE';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
