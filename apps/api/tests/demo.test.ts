import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { DEMO_ADMIN, DEMO_COUNTS } from '../src/modules/demo/demo.service.js';

async function countAll() {
  const [users, categories, products, sales] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.sale.count(),
  ]);
  return { users, categories, products, sales };
}

const defaultCounts = {
  users: 1,
  categories: DEMO_COUNTS.categories,
  products: DEMO_COUNTS.products,
  sales: DEMO_COUNTS.sales,
};

describe('POST /api/v1/demo/start', () => {
  it('não existe quando DEMO_MODE está desligado', async () => {
    const app = createApp({ demoMode: false });
    const res = await request(app).post('/api/v1/demo/start');
    expect(res.status).toBe(404);
    expect(await countAll()).toEqual({ users: 0, categories: 0, products: 0, sales: 0 });
  });

  it('cria a loja de demonstração e devolve uma sessão do admin', async () => {
    const app = createApp({ demoMode: true });
    const res = await request(app).post('/api/v1/demo/start');

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: DEMO_ADMIN.email, role: 'ADMIN' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(await countAll()).toEqual(defaultCounts);

    // O token devolvido funciona nas rotas protegidas.
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
  });

  it('apaga o que outro visitante criou e repõe os dados padrão', async () => {
    const app = createApp({ demoMode: true });
    const first = await request(app).post('/api/v1/demo/start');
    const token = first.body.token as string;
    const auth = { Authorization: `Bearer ${token}` };

    // Visitante A: cria categoria, produto e utilizador, e faz uma venda.
    const category = await request(app).post('/api/v1/categories').set(auth).send({ name: 'Bebidas' });
    const product = await request(app).post('/api/v1/products').set(auth).send({
      name: 'Sumo 1L',
      sku: 'BEB-001',
      categoryId: category.body.id,
      priceCents: 50000,
      minStock: 1,
    });
    await request(app).post(`/api/v1/products/${product.body.id}/stock`).set(auth).send({ type: 'IN', quantity: 5 });
    await request(app)
      .post('/api/v1/sales')
      .set(auth)
      .send({ paymentMethod: 'CASH', items: [{ productId: product.body.id, quantity: 1 }] });
    await request(app)
      .post('/api/v1/users')
      .set(auth)
      .send({ name: 'Vendedor', email: 'vendedor@kitanda.ao', password: 'password123', role: 'CASHIER' });
    expect(await countAll()).not.toEqual(defaultCounts);

    // Visitante B entra na demo.
    const second = await request(app).post('/api/v1/demo/start');
    expect(second.status).toBe(200);

    expect(await countAll()).toEqual(defaultCounts);
    expect(await prisma.product.findUnique({ where: { sku: 'BEB-001' } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { email: 'vendedor@kitanda.ao' } })).toBeNull();

    // O admin mantém o mesmo id: a sessão do visitante A continua válida.
    expect(second.body.user.id).toBe(first.body.user.id);
    const me = await request(app).get('/api/v1/auth/me').set(auth);
    expect(me.status).toBe(200);
  });

  it('os dados padrão são sempre os mesmos e o stock bate certo com o histórico', async () => {
    const app = createApp({ demoMode: true });

    await request(app).post('/api/v1/demo/start');
    const firstSnapshot = await prisma.product.findMany({
      select: { sku: true, stockQuantity: true },
      orderBy: { sku: 'asc' },
    });
    const firstTotals = await prisma.sale.findMany({ select: { totalCents: true }, orderBy: { createdAt: 'asc' } });

    await request(app).post('/api/v1/demo/start');
    const secondSnapshot = await prisma.product.findMany({
      select: { sku: true, stockQuantity: true },
      orderBy: { sku: 'asc' },
    });
    const secondTotals = await prisma.sale.findMany({ select: { totalCents: true }, orderBy: { createdAt: 'asc' } });

    expect(secondSnapshot).toEqual(firstSnapshot);
    expect(secondTotals).toEqual(firstTotals);

    // stock actual = entradas - saídas, para cada produto
    const products = await prisma.product.findMany({ include: { movements: true } });
    for (const product of products) {
      const fromHistory = product.movements.reduce(
        (sum, movement) => sum + (movement.type === 'IN' ? movement.quantity : -movement.quantity),
        0,
      );
      expect(product.stockQuantity).toBe(fromHistory);
      expect(product.stockQuantity).toBeGreaterThanOrEqual(0);
    }

    // Há sempre uma venda recente (última hora), para o Painel não abrir com "hoje: 0 Kz".
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(await prisma.sale.count({ where: { createdAt: { gte: oneHourAgo } } })).toBeGreaterThan(0);
  });

  it('dois visitantes a entrar ao mesmo tempo não se atropelam', async () => {
    const app = createApp({ demoMode: true });
    const [a, b] = await Promise.all([
      request(app).post('/api/v1/demo/start'),
      request(app).post('/api/v1/demo/start'),
    ]);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(await countAll()).toEqual(defaultCounts);
  });

  it('limita a 10 pedidos por minuto', async () => {
    const app = createApp({ demoMode: true });
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/v1/demo/start');
      expect(res.status).toBe(200);
    }

    const res = await request(app).post('/api/v1/demo/start');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  }, 30_000);
});
