import { PostgresDatabase } from '../packages/platform-database/dist/database.js';
import { SchemaIntrospector } from '../packages/platform-database/dist/introspection.js';
import { CatalogNormalizer } from '../packages/platform-database/dist/normalizer.js';
import { SchemaFingerprintCalculator } from '../packages/platform-database/dist/fingerprint.js';
import { config } from 'dotenv';

config();

async function main() {
  const dbUrl = 'postgresql://postgres:postgres@localhost:5432/l1_db02_new';
  const db = new PostgresDatabase({ url: dbUrl });

  try {
    // Create journal table (simulating what MigrationRunner does)
    await db.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at NUMERIC NOT NULL,
        name TEXT NOT NULL
      )
    `);
    console.log('Migration journal table created');

    // Now introspect (simulating what MigrationRunner does)
    const introspector = new SchemaIntrospector(db);
    const catalog = await introspector.inspect();
    console.log('Tables after journal creation:', catalog.tables.map(t => t.name).join(', '));
    console.log('Total tables:', catalog.tables.length);

    const normalizer = new CatalogNormalizer();
    const normalized = normalizer.normalize(catalog);
    const calculator = new SchemaFingerprintCalculator();
    const fingerprint = calculator.calculate(normalized);
    console.log('Fingerprint with journal table:', fingerprint.fingerprint);
  } finally {
    await db.close();
  }
}

main().catch(console.error);
