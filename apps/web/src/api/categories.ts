import { apiRequest } from './http';
import type { Category } from './types';

export function listCategories(): Promise<{ data: Category[] }> {
  return apiRequest('/categories');
}

export function createCategory(name: string): Promise<Category> {
  return apiRequest('/categories', { method: 'POST', body: { name } });
}
