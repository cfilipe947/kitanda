import { Router } from 'express';
import type { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validate } from '../../middlewares/validate.js';
import * as reportsService from './reports.service.js';
import { profitReportQuerySchema, salesByDayQuerySchema, topProductsQuerySchema } from './reports.schemas.js';

export const reportsRoutes = Router();

type SalesByDayQuery = z.infer<typeof salesByDayQuerySchema>;
type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
type ProfitReportQuery = z.infer<typeof profitReportQuerySchema>;

reportsRoutes.use(authenticate, requireRole('ADMIN'));

reportsRoutes.get('/summary', async (_req, res) => {
  res.json(await reportsService.summary());
});

reportsRoutes.get('/sales-by-day', validate({ query: salesByDayQuerySchema }), async (req, res) => {
  const { days } = req.query as unknown as SalesByDayQuery;
  res.json({ data: await reportsService.salesByDay(days) });
});

reportsRoutes.get('/top-products', validate({ query: topProductsQuerySchema }), async (req, res) => {
  const { limit, days } = req.query as unknown as TopProductsQuery;
  res.json({ data: await reportsService.topProducts(limit, days) });
});

reportsRoutes.get('/profit', validate({ query: profitReportQuerySchema }), async (req, res) => {
  const { period, date } = req.query as unknown as ProfitReportQuery;
  res.json(await reportsService.profitReport(period, date ?? new Date()));
});
