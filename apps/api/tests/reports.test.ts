import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

async function registerAdmin(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

async function loginCashier(app: ReturnType<typeof createApp>, adminToken: string) {
  await request(app)
    .post('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Vendedor', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'vendedor@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

async function sellOne(app: ReturnType<typeof createApp>, adminToken: string) {
  const category = await request(app).post('/api/v1/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Mercearia' });
  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Arroz 1kg', sku: 'MER-001', categoryId: category.body.id, priceCents: 85000, costCents: 65000, stockQuantity: 10, minStock: 20 });
  await request(app)
    .post('/api/v1/sales')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ paymentMethod: 'CASH', items: [{ productId: product.body.id, quantity: 2 }] });
  return product.body as { id: string; name: string };
}

describe('relatórios', () => {
  describe('GET /api/v1/reports/summary', () => {
    it('conta vendas de hoje e produtos em stock baixo', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await sellOne(app, adminToken);

      const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.today.count).toBe(1);
      expect(res.body.today.totalCents).toBe(170000);
      expect(res.body.lowStockCount).toBeGreaterThanOrEqual(1);
    });

    it('bloqueia CASHIER', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const cashierToken = await loginCashier(app, adminToken);
      const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${cashierToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/reports/sales-by-day', () => {
    it('devolve a série com a venda de hoje', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await sellOne(app, adminToken);

      const res = await request(app)
        .get('/api/v1/reports/sales-by-day')
        .query({ days: 7 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].totalCents).toBe(170000);
    });
  });

  describe('GET /api/v1/reports/top-products', () => {
    it('ordena por quantidade vendida', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await sellOne(app, adminToken);

      const res = await request(app)
        .get('/api/v1/reports/top-products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toMatchObject({ productId: product.id, totalQuantity: 2 });
    });
  });

  describe('GET /api/v1/reports/profit', () => {
    it('calcula receita, custo, lucro e margem da semana actual', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await sellOne(app, adminToken);

      const res = await request(app)
        .get('/api/v1/reports/profit')
        .query({ period: 'week' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('week');
      expect(res.body.revenueCents).toBe(170000);
      expect(res.body.costCents).toBe(130000);
      expect(res.body.profitCents).toBe(40000);
      expect(res.body.salesCount).toBe(1);
      expect(res.body.topProducts[0]).toMatchObject({ productId: product.id, totalQuantity: 2, profitCents: 40000 });
      expect(Array.isArray(res.body.series)).toBe(true);
      expect(res.body.series.length).toBeGreaterThan(0);
    });

    it('aceita period=month e period=year', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await sellOne(app, adminToken);

      const month = await request(app)
        .get('/api/v1/reports/profit')
        .query({ period: 'month' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(month.status).toBe(200);
      expect(month.body.revenueCents).toBe(170000);

      const year = await request(app)
        .get('/api/v1/reports/profit')
        .query({ period: 'year' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(year.status).toBe(200);
      expect(year.body.revenueCents).toBe(170000);
      // Série anual é agrupada por mês, não por dia.
      expect(year.body.series.length).toBeLessThanOrEqual(12);
    });

    it('bloqueia CASHIER', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const cashierToken = await loginCashier(app, adminToken);
      const res = await request(app).get('/api/v1/reports/profit').set('Authorization', `Bearer ${cashierToken}`);
      expect(res.status).toBe(403);
    });
  });
});
