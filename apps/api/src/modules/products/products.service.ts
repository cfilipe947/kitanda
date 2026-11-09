import { AppError } from '../../lib/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

type ListParams = {
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  page: number;
  limit: number;
};

export async function list(params: ListParams) {
  const where: Prisma.ProductWhereInput = { active: true };

  if (params.search) {
    where.name = { contains: params.search, mode: 'insensitive' };
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }
  if (params.lowStock) {
    // O Prisma não compara duas colunas da mesma linha num `where` normal
    // (stockQuantity <= minStock), por isso vai-se buscar os ids por SQL.
    const rows = await prisma.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "Product" WHERE "stockQuantity" <= "minStock"`;
    where.id = { in: rows.map((row) => row.id) };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return {
    data: products,
    meta: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  };
}

export async function getById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      movements: { orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
  }
  return product;
}

export async function create(input: {
  name: string;
  sku: string;
  categoryId: string;
  priceCents: number;
  costCents: number;
  stockQuantity: number;
  minStock: number;
}) {
  await assertCategoryExists(input.categoryId);

  try {
    return await prisma.product.create({ data: input });
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function update(
  id: string,
  input: Partial<{
    name: string;
    sku: string;
    categoryId: string;
    priceCents: number;
    costCents: number;
    minStock: number;
  }>,
) {
  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  try {
    return await prisma.product.update({ where: { id }, data: input });
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function softDelete(id: string) {
  try {
    await prisma.product.update({ where: { id }, data: { active: false } });
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function addStockMovement(
  productId: string,
  userId: string,
  input: { type: 'IN' | 'ADJUSTMENT'; quantity: number; reason?: string },
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
    }

    const newStock = product.stockQuantity + input.quantity;
    if (newStock < 0) {
      throw new AppError(409, 'INVALID_STOCK_ADJUSTMENT', 'O ajuste deixaria o stock negativo');
    }

    const updated = await tx.product.update({ where: { id: productId }, data: { stockQuantity: newStock } });
    const movement = await tx.stockMovement.create({
      data: { productId, type: input.type, quantity: input.quantity, reason: input.reason, userId },
    });

    return { product: updated, movement };
  });
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Categoria não encontrada');
  }
}

function toFriendlyError(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return new AppError(409, 'SKU_IN_USE', 'Já existe um produto com este SKU');
    if (err.code === 'P2025') return new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado');
  }
  return err;
}
