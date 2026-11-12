import { clearToken, getToken } from '../lib/authStorage';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1';

// A AuthProvider ouve este evento para limpar a sessão e navegar para /login
// sem recarregar a página (ver src/hooks/useAuth.tsx).
export const UNAUTHORIZED_EVENT = 'kitanda:unauthorized';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | undefined>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
};

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // Só é "sessão expirada" se íamos autenticados: um 401 sem token é um erro normal
  // (ex.: credenciais erradas no login), não uma sessão a expirar.
  if (res.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const body = data as { error?: { code?: string; message?: string; details?: unknown[] } } | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? 'Erro inesperado, tenta novamente',
      body?.error?.details ?? [],
    );
  }

  return data as T;
}
