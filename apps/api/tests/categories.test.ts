import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

async function registerAdmin(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

async function registerCashier(app: ReturnType<typeof createApp>, adminToken: string) {
  await request(app)
    .post('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Vendedor', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'vendedor@kitanda.ao', password: 'password123' });
  return res.body.token as string;
}

describe('categorias', () => {
  it('ADMIN cria uma categoria', async () => {
    const app = createApp();
    const adminToken = await registerAdmin(app);

    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mercearia' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Mercearia');
  });

  it('CASHIER consegue listar mas não criar', async () => {
    const app = createApp();
    const adminToken = await registerAdmin(app);
    const cashierToken = await registerCashier(app, adminToken);
    await request(app).post('/api/v1/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Mercearia' });

    const list = await request(app).get('/api/v1/categories').set('Authorization', `Bearer ${cashierToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const create = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'Higiene' });
    expect(create.status).toBe(403);
  });

  it('rejeita nome duplicado', async () => {
    const app = createApp();
    const adminToken = await registerAdmin(app);
    await request(app).post('/api/v1/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Mercearia' });

    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mercearia' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_NAME_IN_USE');
  });

  it('ADMIN edita uma categoria', async () => {
    const app = createApp();
    const adminToken = await registerAdmin(app);
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mercearia' });

    const res = await request(app)
      .patch(`/api/v1/categories/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mercearia Seca' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Mercearia Seca');
  });

  it('não apaga categoria com produtos associados', async () => {
    const app = createApp();
    const adminToken = await registerAdmin(app);
    const category = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mercearia' });

    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Arroz', sku: 'MER-001', categoryId: category.body.id, priceCents: 1000 });

    const res = await request(app)
      .delete(`/api/v1/categories/${category.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_NOT_EMPTY');
  });

  it('apaga categoria vazia', async () => {
    const app = createApp();
    const adminToken = await registerAdmin(app);
    const category = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mercearia' });

    const res = await request(app)
      .delete(`/api/v1/categories/${category.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});
