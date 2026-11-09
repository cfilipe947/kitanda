import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, getAuthUser } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import * as authService from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRoutes = Router();

const loginRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas tentativas, tenta novamente dentro de instantes', details: [] },
  },
});

authRoutes.post('/register', validate({ body: registerSchema }), async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

authRoutes.post('/login', loginRateLimit, validate({ body: loginSchema }), async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

authRoutes.get('/me', authenticate, async (req, res) => {
  const user = await authService.me(getAuthUser(req).id);
  res.json(user);
});
