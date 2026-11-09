import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A password precisa de pelo menos 8 caracteres'),
  role: z.enum(['ADMIN', 'CASHIER']).default('CASHIER'),
});
