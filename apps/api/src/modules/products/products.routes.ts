import { Router } from 'express';
import type { z } from 'zod';
import { authenticate, getAuthUser } from '../../middlewares/authenticate.js';
import { getParam } from '../../lib/getParam.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validate } from '../../middlewares/validate.js';
import * as productsService from './products.service.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  productParamsSchema,
  stockMovementSchema,
  updateProductSchema,
} from './products.schemas.js';

export const productsRoutes = Router();

type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

productsRoutes.use(authenticate);

productsRoutes.get('/', validate({ query: listProductsQuerySchema }), async (req, res) => {
  const result = await productsService.list(req.query as unknown as ListProductsQuery);
  res.json(result);
});

productsRoutes.get('/:id', validate({ params: productParamsSchema }), async (req, res) => {
  const product = await productsService.getById(getParam(req, 'id'));
  res.json(product);
});

productsRoutes.post('/', requireRole('ADMIN'), validate({ body: createProductSchema }), async (req, res) => {
  const product = await productsService.create(req.body);
  res.status(201).json(product);
});

productsRoutes.patch(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: productParamsSchema, body: updateProductSchema }),
  async (req, res) => {
    const product = await productsService.update(getParam(req, 'id'), req.body);
    res.json(product);
  },
);

productsRoutes.delete(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: productParamsSchema }),
  async (req, res) => {
    await productsService.softDelete(getParam(req, 'id'));
    res.status(204).end();
  },
);

productsRoutes.post(
  '/:id/stock',
  requireRole('ADMIN'),
  validate({ params: productParamsSchema, body: stockMovementSchema }),
  async (req, res) => {
    const result = await productsService.addStockMovement(getParam(req, 'id'), getAuthUser(req).id, req.body);
    res.status(201).json(result);
  },
);
