import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError.js';
import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(new AppError(401, 'UNAUTHORIZED', 'Token em falta'));
    return;
  }

  try {
    const payload = verifyToken(token);
    // Vai à BD em vez de confiar só no payload: um utilizador apagado perde o acesso de imediato.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Utilizador não encontrado'));
      return;
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'TOKEN_EXPIRED', 'Sessão expirada, inicia sessão novamente'));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'INVALID_TOKEN', 'Token inválido'));
      return;
    }
    next(err);
  }
}

export function getAuthUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Não autenticado');
  }
  return req.user;
}
