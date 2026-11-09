import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../lib/AppError.js';

type Schemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        // Express 5: req.query só tem getter, reatribuir directamente rebenta.
        Object.defineProperty(req, 'query', { value: schemas.query.parse(req.query), writable: true });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', err.issues));
        return;
      }
      next(err);
    }
  };
}
