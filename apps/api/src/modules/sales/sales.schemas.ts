import { z } from 'zod';

export const saleParamsSchema = z.object({ id: z.string().uuid('Id inválido') });

export const createSaleSchema = z.object({
  paymentMethod: z.enum(['CASH', 'MULTICAIXA', 'TRANSFER']),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId inválido'),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'A venda precisa de pelo menos um item'),
});

export const listSalesQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
