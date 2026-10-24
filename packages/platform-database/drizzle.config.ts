import type { Config } from 'drizzle-kit';

export default {
  schema: ['./src/schema/index.ts', '../../modules/identity/infrastructure/persistence/drizzle/schema/index.ts', '../../modules/tenant/infrastructure/persistence/drizzle/schema/index.ts', '../../modules/access-control/infrastructure/persistence/drizzle/schema/index.ts'],
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
