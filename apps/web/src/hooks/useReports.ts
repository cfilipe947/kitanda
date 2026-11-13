import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';
import type { ProfitPeriod } from '../api/types';

export function useSummary() {
  return useQuery({ queryKey: ['reports', 'summary'], queryFn: reportsApi.getSummary });
}

export function useSalesByDay(days: number) {
  return useQuery({ queryKey: ['reports', 'sales-by-day', days], queryFn: () => reportsApi.getSalesByDay(days) });
}

export function useTopProducts(limit: number, days: number) {
  return useQuery({
    queryKey: ['reports', 'top-products', limit, days],
    queryFn: () => reportsApi.getTopProducts(limit, days),
  });
}

export function useProfitReport(period: ProfitPeriod, date?: string) {
  return useQuery({
    queryKey: ['reports', 'profit', period, date],
    queryFn: () => reportsApi.getProfitReport(period, date),
  });
}
