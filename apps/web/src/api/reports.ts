import { apiRequest } from './http';
import type { ReportSummary, SalesByDayPoint, TopProduct } from './types';

export function getSummary(): Promise<ReportSummary> {
  return apiRequest('/reports/summary');
}

export function getSalesByDay(days: number): Promise<{ data: SalesByDayPoint[] }> {
  return apiRequest('/reports/sales-by-day', { query: { days } });
}

export function getTopProducts(limit: number, days: number): Promise<{ data: TopProduct[] }> {
  return apiRequest('/reports/top-products', { query: { limit, days } });
}
