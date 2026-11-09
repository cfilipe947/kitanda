import { apiRequest } from './http';
import type { Paginated, Product, ProductDetail } from './types';

export type ListProductsParams = {
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
};

export function listProducts(params: ListProductsParams = {}): Promise<Paginated<Product>> {
  return apiRequest('/products', { query: params });
}

export function getProduct(id: string): Promise<ProductDetail> {
  return apiRequest(`/products/${id}`);
}

export type ProductInput = {
  name: string;
  sku: string;
  categoryId: string;
  priceCents: number;
  costCents?: number;
  stockQuantity?: number;
  minStock?: number;
};

export function createProduct(input: ProductInput): Promise<Product> {
  return apiRequest('/products', { method: 'POST', body: input });
}

export type ProductUpdateInput = Partial<Omit<ProductInput, 'stockQuantity'>>;

export function updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
  return apiRequest(`/products/${id}`, { method: 'PATCH', body: input });
}

export function deleteProduct(id: string): Promise<void> {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
}

export type StockMovementInput = { type: 'IN' | 'ADJUSTMENT'; quantity: number; reason?: string };

export function addStockMovement(id: string, input: StockMovementInput): Promise<{ product: Product }> {
  return apiRequest(`/products/${id}/stock`, { method: 'POST', body: input });
}
