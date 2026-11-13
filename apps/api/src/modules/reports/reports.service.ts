import { prisma } from '../../lib/prisma.js';

export type ProfitPeriod = 'week' | 'month' | 'year';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Semana ISO: começa à segunda-feira.
function startOfIsoWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(start, diffToMonday);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

/** Intervalo [from, to) correspondente ao período que contém `referenceDate`. */
function periodRange(period: ProfitPeriod, referenceDate: Date): { from: Date; to: Date } {
  if (period === 'week') {
    const from = startOfIsoWeek(referenceDate);
    return { from, to: addDays(from, 7) };
  }
  if (period === 'month') {
    const from = startOfMonth(referenceDate);
    return { from, to: new Date(from.getFullYear(), from.getMonth() + 1, 1) };
  }
  const from = startOfYear(referenceDate);
  return { from, to: new Date(from.getFullYear() + 1, 0, 1) };
}

function marginPct(revenueCents: number, profitCents: number) {
  if (revenueCents === 0) return 0;
  return Math.round((profitCents / revenueCents) * 1000) / 10;
}

// Os limites do período (from/to) são calculados com os getters locais (ver startOfMonth, etc.),
// por isso a serialização tem de usar os mesmos getters — `toISOString()` converteria para UTC e,
// num fuso à frente de UTC (ex.: Africa/Luanda, UTC+1), a meia-noite local "recuaria" para o dia
// anterior em UTC, desalinhando o rótulo e os buckets do gráfico.
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

async function profitTotals(from: Date, to: Date) {
  const rows = await prisma.$queryRaw<{ revenueCents: bigint; costCents: bigint; salesCount: bigint }[]>`
    SELECT COALESCE(SUM(si.quantity * si."unitPriceCents"), 0)::bigint as "revenueCents",
           COALESCE(SUM(si.quantity * si."costCentsAtSale"), 0)::bigint as "costCents",
           COUNT(DISTINCT s.id)::bigint as "salesCount"
    FROM "SaleItem" si
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."createdAt" >= ${from} AND s."createdAt" < ${to}
  `;
  const row = rows[0]!;
  const revenueCents = Number(row.revenueCents);
  const costCents = Number(row.costCents);
  const profitCents = revenueCents - costCents;

  return { revenueCents, costCents, profitCents, marginPct: marginPct(revenueCents, profitCents), salesCount: Number(row.salesCount) };
}

async function profitSeries(period: ProfitPeriod, from: Date, to: Date) {
  const bucketUnit = period === 'year' ? 'month' : 'day';

  const rows = await prisma.$queryRaw<{ bucket: Date; revenueCents: bigint; costCents: bigint; count: bigint }[]>`
    SELECT date_trunc(${bucketUnit}, s."createdAt") as bucket,
           COALESCE(SUM(si.quantity * si."unitPriceCents"), 0)::bigint as "revenueCents",
           COALESCE(SUM(si.quantity * si."costCentsAtSale"), 0)::bigint as "costCents",
           COUNT(DISTINCT s.id)::bigint as count
    FROM "SaleItem" si
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."createdAt" >= ${from} AND s."createdAt" < ${to}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const byBucket = new Map(rows.map((row) => [toDateKey(row.bucket), row]));

  // Preenche os períodos sem vendas com zero, para o gráfico não ter buracos.
  const buckets: string[] = [];
  if (bucketUnit === 'day') {
    for (let d = new Date(from); d < to; d = addDays(d, 1)) {
      buckets.push(toDateKey(d));
    }
  } else {
    for (let d = new Date(from); d < to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      buckets.push(toDateKey(d));
    }
  }

  return buckets.map((bucket) => {
    const row = byBucket.get(bucket);
    const revenueCents = Number(row?.revenueCents ?? 0);
    const costCents = Number(row?.costCents ?? 0);
    return { bucket, revenueCents, costCents, profitCents: revenueCents - costCents, count: Number(row?.count ?? 0) };
  });
}

async function profitTopProducts(from: Date, to: Date, limit: number) {
  const rows = await prisma.$queryRaw<
    { productId: string; name: string; totalQuantity: bigint; revenueCents: bigint; costCents: bigint }[]
  >`
    SELECT si."productId" as "productId",
           p.name as name,
           SUM(si.quantity)::bigint as "totalQuantity",
           SUM(si.quantity * si."unitPriceCents")::bigint as "revenueCents",
           SUM(si.quantity * si."costCentsAtSale")::bigint as "costCents"
    FROM "SaleItem" si
    JOIN "Sale" s ON s.id = si."saleId"
    JOIN "Product" p ON p.id = si."productId"
    WHERE s."createdAt" >= ${from} AND s."createdAt" < ${to}
    GROUP BY si."productId", p.name
    ORDER BY "revenueCents" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => {
    const revenueCents = Number(row.revenueCents);
    const costCents = Number(row.costCents);
    return {
      productId: row.productId,
      name: row.name,
      totalQuantity: Number(row.totalQuantity),
      revenueCents,
      costCents,
      profitCents: revenueCents - costCents,
    };
  });
}

export async function profitReport(period: ProfitPeriod, referenceDate: Date) {
  const { from, to } = periodRange(period, referenceDate);

  const [totals, series, topProducts] = await Promise.all([
    profitTotals(from, to),
    profitSeries(period, from, to),
    profitTopProducts(from, to, 5),
  ]);

  return {
    period,
    from: toDateKey(from),
    to: toDateKey(addDays(to, -1)),
    ...totals,
    series,
    topProducts,
  };
}
