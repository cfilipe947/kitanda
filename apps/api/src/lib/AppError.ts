// Erro de negócio com status HTTP e código próprios (ver formato de erro em docs/SPEC.md §4).
// Lançado dentro de services/rotas async: o errorHandler apanha-o e devolve o JSON padrão.
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(statusCode: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
