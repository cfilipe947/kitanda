import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  const v1 = Router();

  v1.get('/health', (_req, res) => {
    // Fase 1: verificar também a ligação à base de dados.
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Fases seguintes: v1.use('/auth', authRoutes), v1.use('/products', productRoutes), ...

  app.use('/api/v1', v1);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
  });

  // Fase 1: substituir por middlewares/errorHandler.ts
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
  });

  return app;
}
