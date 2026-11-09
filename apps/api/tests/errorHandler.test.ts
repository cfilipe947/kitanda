import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppError } from '../src/lib/AppError.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

function buildApp() {
  const app = express();

  app.get('/boom-negocio', () => {
    throw new AppError(409, 'INSUFFICIENT_STOCK', 'Stock insuficiente para "Arroz 1kg"');
  });

  app.get('/boom-inesperado', () => {
    throw new Error('falha qualquer');
  });

  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  const app = buildApp();

  it('devolve o status e o código de um AppError', async () => {
    const res = await request(app).get('/boom-negocio');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'INSUFFICIENT_STOCK', message: 'Stock insuficiente para "Arroz 1kg"', details: [] },
    });
  });

  it('esconde erros inesperados por detrás de INTERNAL_ERROR, sem expor detalhes internos', async () => {
    const res = await request(app).get('/boom-inesperado');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', details: [] },
    });
  });
});
