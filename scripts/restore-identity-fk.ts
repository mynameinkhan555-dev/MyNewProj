import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  // Identity schema FK constraints
  await sql`
    ALTER TABLE email_identities
    ADD CONSTRAINT fk_email_identities_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE external_identities
    ADD CONSTRAINT fk_external_identities_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE password_credentials
    ADD CONSTRAINT fk_password_credentials_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `;

  console.log('Identity schema FK constraints restored');
  await sql.end();
}

main().catch(console.error);
