import { apiRequest } from './http';
import type { Paginated, PaymentMethod, Sale, SaleDetail } from './types';

export type ListSalesParams = { from?: string; to?: string; page?: number; limit?: number };

export function listSales(params: ListSalesParams = {}): Promise<Paginated<Sale>> {
  return apiRequest('/sales', { query: params });
}

export function getSale(id: string): Promise<SaleDetail> {
  return apiRequest(`/sales/${id}`);
}

export type CreateSaleInput = { paymentMethod: PaymentMethod; items: { productId: string; quantity: number }[] };

export function createSale(input: CreateSaleInput): Promise<SaleDetail> {
  return apiRequest('/sales', { method: 'POST', body: input });
}
