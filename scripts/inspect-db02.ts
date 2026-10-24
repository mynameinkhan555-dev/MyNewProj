import { PostgresDatabase } from '../packages/platform-database/dist/database.js';
import { SchemaIntrospector } from '../packages/platform-database/dist/introspection.js';
import { CatalogNormalizer } from '../packages/platform-database/dist/normalizer.js';
import { SchemaFingerprintCalculator } from '../packages/platform-database/dist/fingerprint.js';
import { config } from 'dotenv';

config();

async function main() {
  const db = new PostgresDatabase({ url: 'postgresql://postgres:postgres@localhost:5432/l1_db02_new' });

  try {
    const introspector = new SchemaIntrospector(db);
    const catalog = await introspector.inspect();
    console.log('Tables in DB-02 database:', catalog.tables.map(t => t.name).join(', '));
    console.log('Total tables:', catalog.tables.length);

    const normalizer = new CatalogNormalizer();
    const normalized = normalizer.normalize(catalog);
    const calculator = new SchemaFingerprintCalculator();
    const fingerprint = calculator.calculate(normalized);
    console.log('Actual fingerprint:', fingerprint.fingerprint);
  } finally {
    await db.close();
  }
}

main().catch(console.error);
