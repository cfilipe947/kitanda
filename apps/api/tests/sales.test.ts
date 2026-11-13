import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

async function registerAdmin(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

async function createCategory(app: ReturnType<typeof createApp>, token: string) {
  const res = await request(app).post('/api/v1/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Mercearia' });
  return res.body.id as string;
}

async function createProduct(
  app: ReturnType<typeof createApp>,
  token: string,
  categoryId: string,
  overrides: Partial<{ name: string; sku: string; priceCents: number; costCents: number; stockQuantity: number }> = {},
) {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Arroz 1kg', sku: 'MER-001', categoryId, priceCents: 85000, stockQuantity: 10, ...overrides });
  return res.body as { id: string; stockQuantity: number; priceCents: number };
}

describe('vendas', () => {
  describe('POST /api/v1/sales', () => {
    it('regista a venda, reduz o stock e guarda o preço do momento', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryId = await createCategory(app, adminToken);
      const product = await createProduct(app, adminToken, categoryId, { stockQuantity: 10, priceCents: 85000 });

      const res = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentMethod: 'CASH', items: [{ productId: product.id, quantity: 3 }] });

      expect(res.status).toBe(201);
      expect(res.body.totalCents).toBe(255000);
      expect(res.body.items[0].unitPriceCents).toBe(85000);

      const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updated.stockQuantity).toBe(7);

      const movements = await prisma.stockMovement.findMany({ where: { productId: product.id, type: 'OUT' } });
      expect(movements).toHaveLength(1);
      expect(movements[0]?.quantity).toBe(3);
    });

    it('muda o preço do produto depois e confirma que vendas antigas guardam o preço antigo', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryId = await createCategory(app, adminToken);
      const product = await createProduct(app, adminToken, categoryId, { priceCents: 85000, stockQuantity: 10 });

      await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentMethod: 'CASH', items: [{ productId: product.id, quantity: 1 }] });

      await request(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priceCents: 99000 });

      const sales = await request(app).get('/api/v1/sales').set('Authorization', `Bearer ${adminToken}`);
      const saleDetail = await request(app)
        .get(`/api/v1/sales/${sales.body.data[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(saleDetail.body.items[0].unitPriceCents).toBe(85000);
    });

    it('guarda o custo do momento (costCentsAtSale) e mantém-no depois de o custo do produto mudar', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryId = await createCategory(app, adminToken);
      const product = await createProduct(app, adminToken, categoryId, { priceCents: 85000, costCents: 65000, stockQuantity: 10 });

      const sale = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentMethod: 'CASH', items: [{ productId: product.id, quantity: 2 }] });

      expect(sale.body.items[0].costCentsAtSale).toBe(65000);

      await request(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ costCents: 70000 });

      const saleDetail = await request(app)
        .get(`/api/v1/sales/${sale.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(saleDetail.body.items[0].costCentsAtSale).toBe(65000);
    });

    it('409 INSUFFICIENT_STOCK e não grava nada se um item falhar', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryId = await createCategory(app, adminToken);
      const okProduct = await createProduct(app, adminToken, categoryId, { sku: 'MER-001', stockQuantity: 10 });
      const shortProduct = await createProduct(app, adminToken, categoryId, { sku: 'MER-002', stockQuantity: 2 });

      const res = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'CASH',
          items: [
            { productId: okProduct.id, quantity: 1 },
            { productId: shortProduct.id, quantity: 5 },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      const okAfter = await prisma.product.findUniqueOrThrow({ where: { id: okProduct.id } });
      expect(okAfter.stockQuantity).toBe(10);

      const salesCount = await prisma.sale.count();
      expect(salesCount).toBe(0);
      const movementsCount = await prisma.stockMovement.count({ where: { type: 'OUT' } });
      expect(movementsCount).toBe(0);
    });

    it('rejeita venda sem itens', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const res = await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentMethod: 'CASH', items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/sales', () => {
    it('filtra por datas', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryId = await createCategory(app, adminToken);
      const product = await createProduct(app, adminToken, categoryId, { stockQuantity: 10 });

      await request(app)
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentMethod: 'CASH', items: [{ productId: product.id, quantity: 1 }] });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const future = await request(app)
        .get('/api/v1/sales')
        .query({ from: tomorrow.toISOString() })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(future.body.data).toHaveLength(0);

      const all = await request(app).get('/api/v1/sales').set('Authorization', `Bearer ${adminToken}`);
      expect(all.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/sales/:id', () => {
    it('responde 404 para venda inexistente', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const res = await request(app)
        .get('/api/v1/sales/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SALE_NOT_FOUND');
    });
  });
});
