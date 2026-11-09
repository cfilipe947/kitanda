import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = env.NODE_ENV === 'test' ? env.DATABASE_URL_TEST : env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está definida');
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
