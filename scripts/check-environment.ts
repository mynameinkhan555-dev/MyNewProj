import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  console.log('=== ENVIRONMENT IDENTIFICATION ===\n');

  // Environment variables
  console.log('Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('APP_ENV:', process.env.APP_ENV);
  console.log('ENVIRONMENT:', process.env.ENVIRONMENT);
  console.log();

  // Database URL analysis
  console.log('Database URL Analysis:');
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const url = new URL(dbUrl);
    console.log('Host:', url.hostname);
    console.log('Port:', url.port);
    console.log('Database:', url.pathname);
    console.log('User:', url.username);
    console.log('Region:', url.hostname.includes('pooler.supabase.com') ? 'Supabase' : 'Unknown');
  }
  console.log();

  // Check real users
  console.log('Real Users Check:');
  const identityCount = await sql`
    SELECT COUNT(*) as count
    FROM identities
  `;
  console.log('Total identities:', identityCount[0].count);

  const recentIdentities = await sql`
    SELECT id, email, created_at
    FROM identities
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Recent identities:', recentIdentities);
  console.log();

  // Check sessions
  console.log('Sessions Check:');
  const sessionCount = await sql`
    SELECT COUNT(*) as count
    FROM iam_sessions
  `;
  console.log('Total sessions:', sessionCount[0].count);

  const recentSessions = await sql`
    SELECT id, identity_id, created_at, expires_at
    FROM iam_sessions
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Recent sessions:', recentSessions);
  console.log();

  // Migration history
  console.log('Migration History:');
  const migrations = await sql`
    SELECT *
    FROM __drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('Recent migrations:', migrations);
  console.log();

  // Conclusion
  console.log('=== CONCLUSION ===');
  const nodeEnv = process.env.NODE_ENV;
  const hasRealUsers = identityCount[0].count > 0;
  const hasRealSessions = sessionCount[0].count > 0;

  console.log('NODE_ENV:', nodeEnv);
  console.log('Has real users:', hasRealUsers);
  console.log('Has real sessions:', hasRealSessions);

  if (nodeEnv === 'development') {
    console.log('Environment: DEVELOPMENT');
  } else if (nodeEnv === 'staging') {
    console.log('Environment: STAGING');
  } else if (nodeEnv === 'production') {
    console.log('Environment: PRODUCTION');
  } else {
    console.log('Environment: UNKNOWN');
  }

  await sql.end();
}

main().catch(console.error);
