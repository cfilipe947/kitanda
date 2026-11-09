import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

// Express 5: erros lançados (ou rejeitados) em handlers async chegam aqui sem try/catch nas rotas.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', details: [] },
  });
}
