import { apiRequest } from './http';
import type { AuthResponse, User } from './types';

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
}

// Repõe a loja de demonstração com os dados padrão e devolve a sessão do admin de demonstração.
export function startDemo(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/demo/start', { method: 'POST' });
}

export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } });
}

export function me(): Promise<User> {
  return apiRequest<User>('/auth/me');
}
