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
    // Add migration journal table manually to match the expected state
    await db.query(`
      CREATE TABLE __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Migration journal table created');

    const introspector = new SchemaIntrospector(db);
    const catalog = await introspector.inspect();
    console.log('Tables with journal:', catalog.tables.map(t => t.name).join(', '));
    console.log('Total tables:', catalog.tables.length);

    const normalizer = new CatalogNormalizer();
    const normalized = normalizer.normalize(catalog);
    const calculator = new SchemaFingerprintCalculator();
    const fingerprint = calculator.calculate(normalized);
    console.log('Actual fingerprint with journal:', fingerprint.fingerprint);
  } finally {
    await db.close();
  }
}

main().catch(console.error);
