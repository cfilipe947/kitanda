import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

const CATEGORIES = ['Mercearia', 'Higiene e Limpeza'] as const;

const PRODUCTS: Array<{
  name: string;
  sku: string;
  category: (typeof CATEGORIES)[number];
  priceCents: number;
  costCents: number;
  stockQuantity: number;
  minStock: number;
}> = [
  { name: 'Arroz 1kg', sku: 'MER-001', category: 'Mercearia', priceCents: 85000, costCents: 65000, stockQuantity: 40, minStock: 10 },
  { name: 'Feijão 1kg', sku: 'MER-002', category: 'Mercearia', priceCents: 95000, costCents: 72000, stockQuantity: 35, minStock: 10 },
  { name: 'Óleo de palma 1L', sku: 'MER-003', category: 'Mercearia', priceCents: 120000, costCents: 95000, stockQuantity: 8, minStock: 10 },
  { name: 'Açúcar 1kg', sku: 'MER-004', category: 'Mercearia', priceCents: 70000, costCents: 52000, stockQuantity: 50, minStock: 15 },
  { name: 'Farinha de milho 1kg', sku: 'MER-005', category: 'Mercearia', priceCents: 60000, costCents: 45000, stockQuantity: 30, minStock: 10 },
  { name: 'Massa esparguete 500g', sku: 'MER-006', category: 'Mercearia', priceCents: 45000, costCents: 32000, stockQuantity: 25, minStock: 8 },
  { name: 'Sabão em barra', sku: 'HIG-001', category: 'Higiene e Limpeza', priceCents: 35000, costCents: 24000, stockQuantity: 3, minStock: 10 },
  { name: 'Detergente da loiça 500ml', sku: 'HIG-002', category: 'Higiene e Limpeza', priceCents: 55000, costCents: 40000, stockQuantity: 20, minStock: 8 },
  { name: 'Pasta de dentes', sku: 'HIG-003', category: 'Higiene e Limpeza', priceCents: 65000, costCents: 48000, stockQuantity: 18, minStock: 6 },
  { name: 'Papel higiénico (pack 4)', sku: 'HIG-004', category: 'Higiene e Limpeza', priceCents: 90000, costCents: 68000, stockQuantity: 5, minStock: 10 },
];

async function main() {
  // Idempotente: limpa tudo antes de voltar a semear (ordem inversa das FKs).
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Kitanda',
      email: 'admin@kitanda.ao',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const categoriesByName = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category = await prisma.category.create({ data: { name } });
    categoriesByName.set(name, category.id);
  }

  const products = [];
  for (const p of PRODUCTS) {
    const categoryId = categoriesByName.get(p.category);
    if (!categoryId) throw new Error(`Categoria "${p.category}" não encontrada`);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        categoryId,
        priceCents: p.priceCents,
        costCents: p.costCents,
        stockQuantity: p.stockQuantity,
        minStock: p.minStock,
      },
    });
    products.push(product);

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: 'IN',
        quantity: p.stockQuantity,
        reason: 'Stock inicial',
        userId: admin.id,
      },
    });
  }

  // Algumas vendas distribuídas pelos últimos 30 dias, reduzindo o stock recém-criado
  // (nunca abaixo de zero: cada venda só escolhe produtos com stock restante).
  const paymentMethods = ['CASH', 'MULTICAIXA', 'TRANSFER'] as const;
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const remainingStock = new Map(products.map((product) => [product.id, product.stockQuantity]));

  for (let i = 0; i < 15; i++) {
    const available = products.filter((product) => (remainingStock.get(product.id) ?? 0) > 0);
    if (available.length === 0) break;

    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now - daysAgo * DAY_MS - Math.floor(Math.random() * DAY_MS));
    const itemCount = Math.min(1 + Math.floor(Math.random() * 3), available.length);

    const chosen = [...available].sort(() => Math.random() - 0.5).slice(0, itemCount);
    const items = chosen.map((product) => {
      const remaining = remainingStock.get(product.id) ?? 0;
      const quantity = 1 + Math.floor(Math.random() * Math.min(2, remaining));
      remainingStock.set(product.id, remaining - quantity);
      return { productId: product.id, quantity, unitPriceCents: product.priceCents };
    });
    const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

    await prisma.sale.create({
      data: {
        userId: admin.id,
        totalCents,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]!,
        createdAt,
        items: { create: items },
      },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: 'Venda',
          userId: admin.id,
          createdAt,
        },
      });
    }
  }

  console.log('Seed concluído: 1 admin, 2 categorias, 10 produtos, 15 vendas.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
