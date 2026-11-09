import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 deixou de carregar o .env automaticamente: fazemo-lo nós, tal como no "dev" script.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
