import { z } from 'zod';

export const salesByDayQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const topProductsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(5),
  days: z.coerce.number().int().positive().max(365).default(30),
});
