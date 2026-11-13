import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import { Table } from '../../components/ui/Table';
import { useCategories } from '../../hooks/useCategories';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useProducts } from '../../hooks/useProducts';
import { formatKz } from '../../lib/format';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const categoriesQuery = useCategories();
  const productsQuery = useProducts({
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    lowStock: lowStockOnly || undefined,
    page,
    limit: 20,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold text-neutral-900">Produtos</h1>
        <Link to="/app/products/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Novo produto</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Input
            label="Pesquisar"
            type="search"
            placeholder="Pesquisar por nome..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full max-w-xs">
          <Select
            label="Categoria"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas as categorias</option>
            {categoriesQuery.data?.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(event) => {
              setLowStockOnly(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
          />
          Só stock baixo
        </label>
      </div>

      {productsQuery.isLoading && <SkeletonTableRows columns={5} />}
      {productsQuery.isError && <ErrorState onRetry={() => productsQuery.refetch()} />}
      {productsQuery.data?.data.length === 0 && <EmptyState message="Nenhum produto encontrado." />}

      {productsQuery.data && productsQuery.data.data.length > 0 && (
        <>
          <Table
            rowKey={(product) => product.id}
            columns={[
              {
                header: 'Nome',
                cell: (product) => (
                  <Link to={`/app/products/${product.id}`} className="font-medium text-green-700 hover:underline">
                    {product.name}
                  </Link>
                ),
              },
              { header: 'SKU', cell: (product) => product.sku },
              { header: 'Categoria', cell: (product) => product.category?.name ?? '-' },
              { header: 'Preço', cell: (product) => formatKz(product.priceCents), align: 'right' },
              {
                header: 'Margem',
                align: 'right',
                cell: (product) =>
                  product.priceCents > 0
                    ? `${(((product.priceCents - product.costCents) / product.priceCents) * 100).toFixed(1)}%`
                    : '-',
              },
              {
                header: 'Stock',
                align: 'right',
                cell: (product) =>
                  product.stockQuantity <= product.minStock ? (
                    <Badge tone="warning">{product.stockQuantity}</Badge>
                  ) : (
                    product.stockQuantity
                  ),
              },
            ]}
            rows={productsQuery.data.data}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
            <span>
              Página {productsQuery.data.meta.page} de {productsQuery.data.meta.totalPages} ({productsQuery.data.meta.total}{' '}
              produtos)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={page >= productsQuery.data.meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Seguinte
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
