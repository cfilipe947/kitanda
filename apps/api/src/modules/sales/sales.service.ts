import { AppError } from '../../lib/AppError.js';
import { prisma } from '../../lib/prisma.js';
import type { Prisma, PaymentMethod } from '../../generated/prisma/client.js';

type ListParams = { from?: Date; to?: Date; page: number; limit: number };

export async function list(params: ListParams) {
  const where: Prisma.SaleWhereInput = {};
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = params.from;
    if (params.to) where.createdAt.lte = params.to;
  }

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return {
    data: sales,
    meta: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  };
}

export async function getById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
  if (!sale) {
    throw new AppError(404, 'SALE_NOT_FOUND', 'Venda não encontrada');
  }
  return sale;
}

export async function create(
  userId: string,
  input: { paymentMethod: PaymentMethod; items: { productId: string; quantity: number }[] },
) {
  return prisma.$transaction(async (tx) => {
    let totalCents = 0;
    const itemsData: { productId: string; quantity: number; unitPriceCents: number; costCentsAtSale: number }[] = [];

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.active) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
      }
      if (product.stockQuantity < item.quantity) {
        throw new AppError(409, 'INSUFFICIENT_STOCK', `Stock insuficiente para "${product.name}"`);
      }

      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        costCentsAtSale: product.costCents,
      });
      totalCents += product.priceCents * item.quantity;

      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: { productId: product.id, type: 'OUT', quantity: item.quantity, reason: 'Venda', userId },
      });
    }

    return tx.sale.create({
      data: { userId, totalCents, paymentMethod: input.paymentMethod, items: { create: itemsData } },
      include: { items: true },
    });
  });
}
