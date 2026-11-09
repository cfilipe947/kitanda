import { z } from 'zod';

export const productParamsSchema = z.object({ id: z.string().uuid('Id inválido') });

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  sku: z.string().trim().min(1, 'SKU é obrigatório').max(50),
  categoryId: z.string().uuid('categoryId inválido'),
  priceCents: z.number().int().nonnegative(),
  costCents: z.number().int().nonnegative().default(0),
  stockQuantity: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(5),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  sku: z.string().trim().min(1).max(50).optional(),
  categoryId: z.string().uuid('categoryId inválido').optional(),
  priceCents: z.number().int().nonnegative().optional(),
  costCents: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
});

// Querystring chega sempre como string: "true"/"false" explícitos evitam o typo
// clássico do z.coerce.boolean(), que trata QUALQUER string não-vazia (incluindo "false") como true.
const booleanQueryParam = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : value),
  z.boolean().optional(),
);

export const listProductsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  categoryId: z.string().uuid('categoryId inválido').optional(),
  lowStock: booleanQueryParam,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const stockMovementSchema = z
  .object({
    type: z.enum(['IN', 'ADJUSTMENT']),
    quantity: z.number().int(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => (data.type === 'IN' ? data.quantity > 0 : data.quantity !== 0), {
    message: 'quantity deve ser positiva para IN, ou diferente de zero para ADJUSTMENT',
    path: ['quantity'],
  });
