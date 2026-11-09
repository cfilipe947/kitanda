import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as salesApi from '../api/sales';
import type { CreateSaleInput, ListSalesParams } from '../api/sales';

export function useSales(params: ListSalesParams) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => salesApi.listSales(params),
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => salesApi.getSale(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
