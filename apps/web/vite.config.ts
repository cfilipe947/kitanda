/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../..', // lê o .env da raiz (só variáveis VITE_*)
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // Login + lazy-load do Painel (Recharts) pode ultrapassar os 5s por omissão numa máquina ocupada.
    testTimeout: 15000,
  },
});
