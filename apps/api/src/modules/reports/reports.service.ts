import { prisma } from '../../lib/prisma.js';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function summary() {
  const now = new Date();

  const [todayAgg, monthAgg, lowStockRows] = await Promise.all([
    prisma.sale.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: startOfDay(now) } } }),
    prisma.sale.aggregate({ _sum: { totalCents: true }, _count: true, where: { createdAt: { gte: startOfMonth(now) } } }),
    prisma.$queryRaw<
      { count: bigint }[]
    >`SELECT COUNT(*) as count FROM "Product" WHERE "active" = true AND "stockQuantity" <= "minStock"`,
  ]);

  return {
    today: { totalCents: todayAgg._sum.totalCents ?? 0, count: todayAgg._count },
    month: { totalCents: monthAgg._sum.totalCents ?? 0, count: monthAgg._count },
    lowStockCount: Number(lowStockRows[0]?.count ?? 0),
  };
}

export async function salesByDay(days: number) {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));

  const rows = await prisma.$queryRaw<{ day: Date; totalCents: bigint; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt") as day,
           COALESCE(SUM("totalCents"), 0)::bigint as "totalCents",
           COUNT(*)::bigint as count
    FROM "Sale"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((row) => ({
    day: row.day.toISOString().slice(0, 10),
    totalCents: Number(row.totalCents),
    count: Number(row.count),
  }));
}

export async function topProducts(limit: number, days: number) {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - days);

  const rows = await prisma.$queryRaw<
    { productId: string; name: string; totalQuantity: bigint; totalCents: bigint }[]
  >`
    SELECT si."productId" as "productId",
           p.name as name,
           SUM(si.quantity)::bigint as "totalQuantity",
           SUM(si.quantity * si."unitPriceCents")::bigint as "totalCents"
    FROM "SaleItem" si
    JOIN "Sale" s ON s.id = si."saleId"
    JOIN "Product" p ON p.id = si."productId"
    WHERE s."createdAt" >= ${since}
    GROUP BY si."productId", p.name
    ORDER BY "totalQuantity" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    productId: row.productId,
    name: row.name,
    totalQuantity: Number(row.totalQuantity),
    totalCents: Number(row.totalCents),
  }));
}
