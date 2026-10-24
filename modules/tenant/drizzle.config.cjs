const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './src/infrastructure/persistence/drizzle/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
