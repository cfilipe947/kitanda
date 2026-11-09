import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  const v1 = Router();

  v1.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', uptime: process.uptime() });
    } catch {
      res.status(503).json({ status: 'error', uptime: process.uptime() });
    }
  });

  // Fases seguintes: v1.use('/auth', authRoutes), v1.use('/products', productRoutes), ...

  app.use('/api/v1', v1);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada', details: [] } });
  });

  app.use(errorHandler);

  return app;
}
