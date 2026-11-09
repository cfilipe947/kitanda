import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('documentação OpenAPI', () => {
  const app = createApp();

  it('GET /api/docs.json devolve um documento OpenAPI válido', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.paths['/api/v1/sales']).toBeDefined();
  });

  it('GET /api/docs serve o Swagger UI', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
