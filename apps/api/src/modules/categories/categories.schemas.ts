import { z } from 'zod';

export const categoryParamsSchema = z.object({ id: z.string().uuid('Id inválido') });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100),
});

export const updateCategorySchema = createCategorySchema;
