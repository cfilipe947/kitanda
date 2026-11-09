import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { validate } from '../src/middlewares/validate.js';

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get(
    '/items',
    validate({ query: z.object({ page: z.coerce.number().int().positive().default(1) }) }),
    (req, res) => {
      res.json({ page: req.query.page });
    },
  );

  app.post('/items', validate({ body: z.object({ name: z.string().min(1) }) }), (req, res) => {
    res.status(201).json(req.body);
  });

  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  const app = buildApp();

  it('deixa passar query válida e aplica os defaults do schema', async () => {
    const res = await request(app).get('/items');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });

  it('deixa passar body válido', async () => {
    const res = await request(app).post('/items').send({ name: 'Arroz' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Arroz');
  });

  it('responde 400 com VALIDATION_ERROR quando o body é inválido', async () => {
    const res = await request(app).post('/items').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('responde 400 quando a query é inválida', async () => {
    const res = await request(app).get('/items').query({ page: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
