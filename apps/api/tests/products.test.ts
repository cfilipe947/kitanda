import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

async function registerAdmin(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

async function createCategory(app: ReturnType<typeof createApp>, token: string, name = 'Mercearia') {
  const res = await request(app).post('/api/v1/categories').set('Authorization', `Bearer ${token}`).send({ name });
  return res.body.id as string;
}

async function createProduct(
  app: ReturnType<typeof createApp>,
  token: string,
  overrides: Partial<{ name: string; sku: string; categoryId: string; priceCents: number; stockQuantity: number; minStock: number }> = {},
) {
  const categoryId = overrides.categoryId ?? (await createCategory(app, token));
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Arroz 1kg',
      sku: 'MER-001',
      priceCents: 85000,
      ...overrides,
      categoryId,
    });
  return res.body as { id: string; stockQuantity: number };
}

describe('produtos', () => {
  describe('POST /api/v1/products', () => {
    it('ADMIN cria um produto', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken);
      expect(product.id).toEqual(expect.any(String));
    });

    it('rejeita categoria inexistente', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Arroz', sku: 'MER-001', categoryId: '00000000-0000-0000-0000-000000000000', priceCents: 1000 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('rejeita SKU duplicado', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryId = await createCategory(app, adminToken);
      await createProduct(app, adminToken, { categoryId });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Outro', sku: 'MER-001', categoryId, priceCents: 1000 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SKU_IN_USE');
    });

    it('bloqueia CASHIER', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Vendedor', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });
      const login = await request(app).post('/api/v1/auth/login').send({ email: 'vendedor@kitanda.ao', password: 'password123' });

      const categoryId = await createCategory(app, adminToken);
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({ name: 'Arroz', sku: 'MER-001', categoryId, priceCents: 1000 });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/products', () => {
    it('pagina, pesquisa e filtra por categoria e lowStock', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const categoryA = await createCategory(app, adminToken, 'Mercearia');
      const categoryB = await createCategory(app, adminToken, 'Higiene');

      await createProduct(app, adminToken, { name: 'Arroz 1kg', sku: 'MER-001', categoryId: categoryA, stockQuantity: 40, minStock: 10 });
      await createProduct(app, adminToken, { name: 'Feijão 1kg', sku: 'MER-002', categoryId: categoryA, stockQuantity: 2, minStock: 10 });
      await createProduct(app, adminToken, { name: 'Sabão', sku: 'HIG-001', categoryId: categoryB, stockQuantity: 30, minStock: 5 });

      const page = await request(app)
        .get('/api/v1/products')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(page.body.data).toHaveLength(2);
      expect(page.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });

      const search = await request(app)
        .get('/api/v1/products')
        .query({ search: 'arroz' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(search.body.data).toHaveLength(1);
      expect(search.body.data[0].name).toBe('Arroz 1kg');

      const byCategory = await request(app)
        .get('/api/v1/products')
        .query({ categoryId: categoryB })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(byCategory.body.data).toHaveLength(1);
      expect(byCategory.body.data[0].sku).toBe('HIG-001');

      const lowStock = await request(app)
        .get('/api/v1/products')
        .query({ lowStock: 'true' })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(lowStock.body.data).toHaveLength(1);
      expect(lowStock.body.data[0].sku).toBe('MER-002');
    });

    it('esconde produtos inactivos', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken);
      await request(app).delete(`/api/v1/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app).get('/api/v1/products').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('devolve o produto com os últimos movimentos', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken, { stockQuantity: 10 });

      await request(app)
        .post(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'IN', quantity: 5, reason: 'Reposição' });

      const res = await request(app).get(`/api/v1/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.movements).toHaveLength(1);
      expect(res.body.movements[0]).toMatchObject({ type: 'IN', quantity: 5 });
    });

    it('responde 404 para id inexistente', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const res = await request(app)
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('edita campos sem mexer no stock', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken, { stockQuantity: 10 });

      const res = await request(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priceCents: 90000 });

      expect(res.status).toBe(200);
      expect(res.body.priceCents).toBe(90000);
      expect(res.body.stockQuantity).toBe(10);
    });
  });

  describe('POST /api/v1/products/:id/stock', () => {
    it('IN soma ao stock', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken, { stockQuantity: 10 });

      const res = await request(app)
        .post(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'IN', quantity: 5 });

      expect(res.status).toBe(201);
      expect(res.body.product.stockQuantity).toBe(15);
    });

    it('ADJUSTMENT negativo reduz o stock', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken, { stockQuantity: 10 });

      const res = await request(app)
        .post(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'ADJUSTMENT', quantity: -4, reason: 'Quebra' });

      expect(res.status).toBe(201);
      expect(res.body.product.stockQuantity).toBe(6);
    });

    it('nunca deixa o stock ficar negativo', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken, { stockQuantity: 3 });

      const res = await request(app)
        .post(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'ADJUSTMENT', quantity: -10 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INVALID_STOCK_ADJUSTMENT');
    });

    it('rejeita IN com quantity negativa', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken);

      const res = await request(app)
        .post(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'IN', quantity: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('faz soft delete (produto continua a existir)', async () => {
      const app = createApp();
      const adminToken = await registerAdmin(app);
      const product = await createProduct(app, adminToken);

      const del = await request(app).delete(`/api/v1/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(del.status).toBe(204);

      const get = await request(app).get(`/api/v1/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(get.status).toBe(200);
      expect(get.body.active).toBe(false);
    });
  });
});
