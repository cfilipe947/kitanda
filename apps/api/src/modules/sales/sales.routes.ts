import { Router } from 'express';
import type { z } from 'zod';
import { authenticate, getAuthUser } from '../../middlewares/authenticate.js';
import { getParam } from '../../lib/getParam.js';
import { validate } from '../../middlewares/validate.js';
import * as salesService from './sales.service.js';
import { createSaleSchema, listSalesQuerySchema, saleParamsSchema } from './sales.schemas.js';

export const salesRoutes = Router();

type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;

salesRoutes.use(authenticate);

salesRoutes.get('/', validate({ query: listSalesQuerySchema }), async (req, res) => {
  const result = await salesService.list(req.query as unknown as ListSalesQuery);
  res.json(result);
});

salesRoutes.get('/:id', validate({ params: saleParamsSchema }), async (req, res) => {
  const sale = await salesService.getById(getParam(req, 'id'));
  res.json(sale);
});

salesRoutes.post('/', validate({ body: createSaleSchema }), async (req, res) => {
  const sale = await salesService.create(getAuthUser(req).id, req.body);
  res.status(201).json(sale);
});
