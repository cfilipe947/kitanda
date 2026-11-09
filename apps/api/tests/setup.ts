import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "SaleItem", "Sale", "StockMovement", "Product", "Category", "User" CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
