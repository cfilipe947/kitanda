import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/AppError.js';
import type { Role } from '../generated/prisma/enums.js';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', 'Sem permissão para esta operação'));
      return;
    }
    next();
  };
}
