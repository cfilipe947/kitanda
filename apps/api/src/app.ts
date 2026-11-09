import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { salesRoutes } from './modules/sales/sales.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { generateOpenApiDocument } from './openapi.js';

export function createApp() {
  const app = express();

  // Em produção (Render/Railway) a API fica atrás de um único proxy reverso: sem isto,
  // o rate limit do login via a mesma IP para todos os pedidos (a do proxy, não a do
  // cliente). Fora de produção não há proxy nenhum — confiar no header na mesma deixava
  // qualquer cliente fingir a IP que quisesse via X-Forwarded-For.
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

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

  v1.use('/auth', authRoutes);
  v1.use('/users', usersRoutes);
  v1.use('/categories', categoriesRoutes);
  v1.use('/products', productsRoutes);
  v1.use('/sales', salesRoutes);
  v1.use('/reports', reportsRoutes);

  app.use('/api/v1', v1);

  const openApiDocument = generateOpenApiDocument();
  app.get('/api/docs.json', (_req, res) => res.json(openApiDocument));
  // O Swagger UI precisa de scripts/estilos inline: a CSP por omissão do helmet bloqueava a página.
  app.use('/api/docs', helmet({ contentSecurityPolicy: false }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada', details: [] } });
  });

  app.use(errorHandler);

  return app;
}
