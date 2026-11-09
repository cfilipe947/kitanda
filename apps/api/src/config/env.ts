import { z } from 'zod';

// Valida as variáveis de ambiente no arranque. Se faltar alguma, a app falha logo
// com uma mensagem clara, em vez de rebentar mais tarde num sítio difícil de encontrar.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa de pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // DATABASE_URL passa a obrigatória na Fase 1.
  DATABASE_URL: z.string().optional(),
  DATABASE_URL_TEST: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
