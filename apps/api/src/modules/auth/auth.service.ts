import bcrypt from 'bcrypt';
import { AppError } from '../../lib/AppError.js';
import { signToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';
import { toSafeUser } from '../../lib/toSafeUser.js';

const BCRYPT_COST = 10;

export async function register(input: { name: string; email: string; password: string }) {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    throw new AppError(403, 'REGISTRATION_CLOSED', 'Já existe um administrador registado');
  }

  const email = input.email.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { name: input.name, email, passwordHash, role: 'ADMIN' },
  });

  return { token: signToken({ sub: user.id, role: user.role }), user: toSafeUser(user) };
}

export async function login(input: { email: string; password: string }) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou password incorrectos');
  }

  return { token: signToken({ sub: user.id, role: user.role }), user: toSafeUser(user) };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Utilizador não encontrado');
  }
  return toSafeUser(user);
}
