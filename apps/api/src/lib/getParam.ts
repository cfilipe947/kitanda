import type { Request } from 'express';
import { AppError } from './AppError.js';

// req.params[key] é tipado "string | string[] | undefined" (ParamsDictionary + noUncheckedIndexedAccess).
// O validate(schema) já garante o formato em runtime; isto só estreita o tipo para o TypeScript.
export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', `Parâmetro "${key}" inválido`, []);
  }
  return value;
}
