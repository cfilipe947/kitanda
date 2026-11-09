import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

async function registerAdmin(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

async function createCashier(app: ReturnType<typeof createApp>, adminToken: string) {
  const res = await request(app)
    .post('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Vendedor', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });
  return res.body as { token?: string };
}

async function loginCashier(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'vendedor@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

describe('utilizadores', () => {
  describe('POST /api/v1/users', () => {
    it('ADMIN cria um vendedor', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Vendedor', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: 'vendedor@kitanda.ao', role: 'CASHIER' });
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('rejeita email duplicado', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await createCashier(app, adminToken);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Outro', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_IN_USE');
    });

    it('bloqueia CASHIER', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await createCashier(app, adminToken);
      const cashierToken = await loginCashier(app);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ name: 'Outro', email: 'outro@kitanda.ao', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('bloqueia sem token', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/v1/users')
        .send({ name: 'Outro', email: 'outro@kitanda.ao', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users', () => {
    it('ADMIN lista os utilizadores sem expor passwordHash', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await createCashier(app, adminToken);

      const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((u: { passwordHash?: unknown }) => u.passwordHash === undefined)).toBe(true);
    });

    it('bloqueia CASHIER', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await createCashier(app, adminToken);
      const cashierToken = await loginCashier(app);

      const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${cashierToken}`);
      expect(res.status).toBe(403);
    });
  });
});
