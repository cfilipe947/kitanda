import bcrypt from 'bcrypt';
import type { Prisma } from '../../generated/prisma/client.js';
import { signToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';
import { toSafeUser } from '../../lib/toSafeUser.js';

// Dados padrão da demonstração. Usados pelo seed (prisma/seed.ts) e pelo reset do
// POST /demo/start: um único sítio define o que é "a loja de demonstração".

export const DEMO_ADMIN = { name: 'Admin Kitanda', email: 'admin@kitanda.ao', password: 'admin123' } as const;

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

export const DEMO_COUNTS = { categories: CATEGORIES.length, products: PRODUCTS.length, sales: 15 } as const;

const PAYMENT_METHODS = ['CASH', 'MULTICAIXA', 'TRANSFER'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

// Número fixo para o lock de Postgres que serializa resets em simultâneo (ver resetDemoData).
const DEMO_RESET_LOCK_ID = 4_242_001;

// Gerador pseudo-aleatório com semente fixa (mulberry32): as vendas parecem variadas,
// mas são sempre as mesmas, por isso todos os visitantes vêem exactamente a mesma loja.
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

type PlannedSale = {
  createdAt: Date;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  items: Array<{ productIndex: number; quantity: number }>;
};

// Planeia as vendas em memória primeiro: assim sabemos o stock final de cada produto
// antes de o criar, e evitamos dezenas de UPDATEs à base de dados.
function planSales(now: number) {
  const random = seededRandom(2026);
  const remainingStock = PRODUCTS.map((product) => product.stockQuantity);
  const sales: PlannedSale[] = [];

  for (let i = 0; i < DEMO_COUNTS.sales; i++) {
    const available = PRODUCTS.map((_, index) => index).filter((index) => remainingStock[index]! > 0);
    if (available.length === 0) break;

    // A primeira venda é sempre da última hora, para o Painel nunca mostrar "hoje: 0 Kz".
    const daysAgo = i === 0 ? 0 : Math.floor(random() * 30);
    const offsetMs = i === 0 ? Math.floor(random() * 60 * 60 * 1000) : Math.floor(random() * DAY_MS);
    const createdAt = new Date(now - daysAgo * DAY_MS - offsetMs);

    const itemCount = Math.min(1 + Math.floor(random() * 3), available.length);
    const chosen = [...available].sort(() => random() - 0.5).slice(0, itemCount);
    const items = chosen.map((productIndex) => {
      const remaining = remainingStock[productIndex]!;
      const quantity = 1 + Math.floor(random() * Math.min(2, remaining));
      remainingStock[productIndex] = remaining - quantity;
      return { productIndex, quantity };
    });

    sales.push({ createdAt, paymentMethod: PAYMENT_METHODS[Math.floor(random() * PAYMENT_METHODS.length)]!, items });
  }

  return { sales, remainingStock };
}

/**
 * Repõe a loja de demonstração: apaga tudo o que os visitantes criaram e volta a criar
 * os dados padrão. Tem de correr dentro de uma transacção (tudo ou nada).
 *
 * O utilizador admin NÃO é apagado (só actualizado): mantém o mesmo id, por isso quem
 * já tem sessão iniciada continua com um token válido depois de outro visitante entrar.
 */
export async function resetDemoData(tx: Prisma.TransactionClient) {
  // Dois visitantes a entrar ao mesmo tempo correriam dois resets em paralelo (e um
  // falhava com SKU duplicado). Este lock faz o segundo esperar que o primeiro termine;
  // é libertado automaticamente no fim da transacção.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${DEMO_RESET_LOCK_ID}::bigint)`;

  // Ordem inversa das chaves estrangeiras.
  await tx.saleItem.deleteMany();
  await tx.sale.deleteMany();
  await tx.stockMovement.deleteMany();
  await tx.product.deleteMany();
  await tx.category.deleteMany();
  await tx.user.deleteMany({ where: { email: { not: DEMO_ADMIN.email } } });

  // Repõe também nome, papel e password, caso alguém os tenha alterado directamente na BD.
  const passwordHash = await bcrypt.hash(DEMO_ADMIN.password, 10);
  const admin = await tx.user.upsert({
    where: { email: DEMO_ADMIN.email },
    update: { name: DEMO_ADMIN.name, role: 'ADMIN', passwordHash },
    create: { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email, role: 'ADMIN', passwordHash },
  });

  const categoryIds = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category = await tx.category.create({ data: { name } });
    categoryIds.set(name, category.id);
  }

  const now = Date.now();
  const { sales, remainingStock } = planSales(now);

  const products: Array<{ id: string; priceCents: number; costCents: number }> = [];
  for (const [index, p] of PRODUCTS.entries()) {
    const product = await tx.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        categoryId: categoryIds.get(p.category)!,
        priceCents: p.priceCents,
        costCents: p.costCents,
        stockQuantity: remainingStock[index]!,
        minStock: p.minStock,
      },
    });
    products.push(product);
  }

  // Histórico de stock coerente com o stock final: entrada inicial + uma saída por item vendido.
  const stockInDate = new Date(now - 31 * DAY_MS);
  await tx.stockMovement.createMany({
    data: [
      ...products.map((product, index) => ({
        productId: product.id,
        type: 'IN' as const,
        quantity: PRODUCTS[index]!.stockQuantity,
        reason: 'Stock inicial',
        userId: admin.id,
        createdAt: stockInDate,
      })),
      ...sales.flatMap((sale) =>
        sale.items.map((item) => ({
          productId: products[item.productIndex]!.id,
          type: 'OUT' as const,
          quantity: item.quantity,
          reason: 'Venda',
          userId: admin.id,
          createdAt: sale.createdAt,
        })),
      ),
    ],
  });

  for (const sale of sales) {
    const items = sale.items.map((item) => {
      const product = products[item.productIndex]!;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        costCentsAtSale: product.costCents,
      };
    });
    await tx.sale.create({
      data: {
        userId: admin.id,
        totalCents: items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt,
        items: { create: items },
      },
    });
  }

  return admin;
}

// POST /demo/start: repõe os dados padrão e devolve uma sessão do admin de demonstração.
export async function startDemo() {
  // timeout maior do que os 5s por omissão: são ~30 queries numa só transacção.
  const admin = await prisma.$transaction((tx) => resetDemoData(tx), { timeout: 20_000, maxWait: 20_000 });
  return { token: signToken({ sub: admin.id, role: admin.role }), user: toSafeUser(admin) };
}
