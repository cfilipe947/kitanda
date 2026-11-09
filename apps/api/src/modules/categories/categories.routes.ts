import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { getParam } from '../../lib/getParam.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validate } from '../../middlewares/validate.js';
import * as categoriesService from './categories.service.js';
import { categoryParamsSchema, createCategorySchema, updateCategorySchema } from './categories.schemas.js';

export const categoriesRoutes = Router();

categoriesRoutes.use(authenticate);

categoriesRoutes.get('/', async (_req, res) => {
  const categories = await categoriesService.list();
  res.json({ data: categories });
});

categoriesRoutes.post('/', requireRole('ADMIN'), validate({ body: createCategorySchema }), async (req, res) => {
  const category = await categoriesService.create(req.body);
  res.status(201).json(category);
});

categoriesRoutes.patch(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: categoryParamsSchema, body: updateCategorySchema }),
  async (req, res) => {
    const category = await categoriesService.update(getParam(req, 'id'), req.body);
    res.json(category);
  },
);

categoriesRoutes.delete(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: categoryParamsSchema }),
  async (req, res) => {
    await categoriesService.remove(getParam(req, 'id'));
    res.status(204).end();
  },
);
