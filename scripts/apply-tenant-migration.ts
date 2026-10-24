import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

async function main() {
  console.log('Applying tenant migration...');

  const client = postgres(connectionString);

  try {
    await client.begin(async (sql) => {
      // Create tenants table
      await sql`
        CREATE TABLE IF NOT EXISTS "tenants" (
          "id" uuid PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "status" text NOT NULL,
          "created_at" timestamp with time zone NOT NULL,
          "updated_at" timestamp with time zone NOT NULL,
          CONSTRAINT "chk_tenants_status" CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))
        )
      `;
      console.log('Created tenants table');

      // Create memberships table
      await sql`
        CREATE TABLE IF NOT EXISTS "memberships" (
          "id" uuid PRIMARY KEY NOT NULL,
          "user_id" uuid NOT NULL,
          "tenant_id" uuid NOT NULL,
          "status" text NOT NULL,
          "joined_at" timestamp with time zone NOT NULL,
          "created_at" timestamp with time zone NOT NULL,
          "updated_at" timestamp with time zone NOT NULL
        )
      `;
      console.log('Created memberships table');

      // Add FK constraints
      await sql`
        DO $$ BEGIN
          ALTER TABLE "memberships" ADD CONSTRAINT "fk_memberships_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$
      `;
      console.log('Added FK: memberships.user_id → users.id');

      await sql`
        DO $$ BEGIN
          ALTER TABLE "memberships" ADD CONSTRAINT "fk_memberships_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$
      `;
      console.log('Added FK: memberships.tenant_id → tenants.id');

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS "idx_memberships_user_id" ON "memberships"("user_id")`;
      console.log('Created index: idx_memberships_user_id');

      await sql`CREATE INDEX IF NOT EXISTS "idx_memberships_tenant_id" ON "memberships"("tenant_id")`;
      console.log('Created index: idx_memberships_tenant_id');

      await sql`CREATE UNIQUE INDEX IF NOT EXISTS "uq_memberships_active_user_tenant" ON "memberships"("user_id", "tenant_id") WHERE status = 'ACTIVE'`;
      console.log('Created unique index: uq_memberships_active_user_tenant');

      // Add unique constraint on tenant name
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS "uq_tenants_name" ON "tenants"("name")`;
      console.log('Created unique index: uq_tenants_name');
    });

    console.log('Tenant migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
