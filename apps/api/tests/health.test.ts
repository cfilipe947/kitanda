import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('responde 200 com status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('responde 404 no formato padrão para rotas inexistentes', async () => {
    const res = await request(app).get('/api/v1/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
