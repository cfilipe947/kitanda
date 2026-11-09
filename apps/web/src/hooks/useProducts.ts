import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productsApi from '../api/products';
import type { ListProductsParams, ProductUpdateInput, StockMovementInput } from '../api/products';

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.listProducts(params),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getProduct(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductUpdateInput) => productsApi.updateProduct(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useAddStockMovement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StockMovementInput) => productsApi.addStockMovement(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
