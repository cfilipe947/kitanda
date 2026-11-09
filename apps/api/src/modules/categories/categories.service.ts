import { AppError } from '../../lib/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

export async function list() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function create(input: { name: string }) {
  try {
    return await prisma.category.create({ data: input });
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function update(id: string, input: { name: string }) {
  try {
    return await prisma.category.update({ where: { id }, data: input });
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function remove(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new AppError(409, 'CATEGORY_NOT_EMPTY', 'Não é possível apagar uma categoria com produtos associados');
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (err) {
    throw toFriendlyError(err);
  }
}

function toFriendlyError(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return new AppError(409, 'CATEGORY_NAME_IN_USE', 'Já existe uma categoria com este nome');
    if (err.code === 'P2025') return new AppError(404, 'CATEGORY_NOT_FOUND', 'Categoria não encontrada');
  }
  return err;
}
