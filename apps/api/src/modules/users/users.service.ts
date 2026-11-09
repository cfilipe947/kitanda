import bcrypt from 'bcrypt';
import { AppError } from '../../lib/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { toSafeUser, type SafeUser } from '../../lib/toSafeUser.js';
import type { Role } from '../../generated/prisma/enums.js';

const BCRYPT_COST = 10;

export async function list(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(toSafeUser);
}

export async function create(input: { name: string; email: string; password: string; role: Role }) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_IN_USE', 'Já existe um utilizador com este email');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { name: input.name, email, passwordHash, role: input.role },
  });
  return toSafeUser(user);
}
