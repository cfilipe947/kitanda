import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validate } from '../../middlewares/validate.js';
import * as usersService from './users.service.js';
import { createUserSchema } from './users.schemas.js';

export const usersRoutes = Router();

usersRoutes.use(authenticate, requireRole('ADMIN'));

usersRoutes.get('/', async (_req, res) => {
  const users = await usersService.list();
  res.json({ data: users });
});

usersRoutes.post('/', validate({ body: createUserSchema }), async (req, res) => {
  const user = await usersService.create(req.body);
  res.status(201).json(user);
});
