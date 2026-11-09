import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Todos os ficheiros de teste partilham a mesma BD de teste (sem isolamento por
    // transacção/schema): correr em paralelo faz um ficheiro truncar tabelas a meio
    // de outro.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-com-pelo-menos-32-caracteres!!',
      DATABASE_URL_TEST: process.env.DATABASE_URL_TEST ?? '',
    },
  },
});
