import { apiRequest } from './http';
import type { Role, User } from './types';

export function listUsers(): Promise<{ data: User[] }> {
  return apiRequest('/users');
}

export type CreateUserInput = { name: string; email: string; password: string; role?: Role };

export function createUser(input: CreateUserInput): Promise<User> {
  return apiRequest('/users', { method: 'POST', body: input });
}
