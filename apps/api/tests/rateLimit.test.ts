import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('rate limit no login', () => {
  it('bloqueia a 6ª tentativa dentro da mesma janela', async () => {
    const app = createApp();
    const credentials = { email: 'ninguem@kitanda.ao', password: 'password-errada' };

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/v1/auth/login').send(credentials);
      expect(res.status).toBe(401);
    }

    const res = await request(app).post('/api/v1/auth/login').send(credentials);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
