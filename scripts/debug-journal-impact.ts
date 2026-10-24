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
    // Step 1: Check fingerprint BEFORE journal creation
    const introspector1 = new SchemaIntrospector(db);
    const catalog1 = await introspector1.inspect();
    const normalizer1 = new CatalogNormalizer();
    const normalized1 = normalizer1.normalize(catalog1);
    const calculator1 = new SchemaFingerprintCalculator();
    const fingerprint1 = calculator1.calculate(normalized1);
    console.log('BEFORE journal:');
    console.log('  Tables:', catalog1.tables.map(t => t.name).join(', '));
    console.log('  Enums:', catalog1.enums.map(e => e.name).join(', '));
    console.log('  Sequences:', catalog1.sequences.map(s => s.name).join(', '));
    console.log('  Fingerprint:', fingerprint1.fingerprint);

    // Step 2: Create journal table
    await db.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at NUMERIC NOT NULL,
        name TEXT NOT NULL
      )
    `);
    console.log('Journal table created');

    // Step 3: Check fingerprint AFTER journal creation
    const introspector2 = new SchemaIntrospector(db);
    const catalog2 = await introspector2.inspect();
    const normalizer2 = new CatalogNormalizer();
    const normalized2 = normalizer2.normalize(catalog2);
    const calculator2 = new SchemaFingerprintCalculator();
    const fingerprint2 = calculator2.calculate(normalized2);
    console.log('AFTER journal:');
    console.log('  Tables:', catalog2.tables.map(t => t.name).join(', '));
    console.log('  Enums:', catalog2.enums.map(e => e.name).join(', '));
    console.log('  Sequences:', catalog2.sequences.map(s => s.name).join(', '));
    console.log('  Fingerprint:', fingerprint2.fingerprint);

    console.log('\nDifference analysis:');
    if (JSON.stringify(catalog1.tables) !== JSON.stringify(catalog2.tables)) {
      console.log('  Tables changed');
    }
    if (JSON.stringify(catalog1.enums) !== JSON.stringify(catalog2.enums)) {
      console.log('  Enums changed');
    }
    if (JSON.stringify(catalog1.sequences) !== JSON.stringify(catalog2.sequences)) {
      console.log('  Sequences changed');
    }
  } finally {
    await db.close();
  }
}

main().catch(console.error);
