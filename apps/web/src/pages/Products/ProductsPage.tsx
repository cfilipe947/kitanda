import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Loading } from '../../components/ui/Loading';
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Produtos</h1>
        <Link to="/products/new">
          <Button>Novo produto</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Pesquisar por nome..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Pesquisar produtos"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          aria-label="Filtrar por categoria"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categoriesQuery.data?.data.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(event) => {
              setLowStockOnly(event.target.checked);
              setPage(1);
            }}
          />
          Só stock baixo
        </label>
      </div>

      {productsQuery.isLoading && <Loading />}
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
                  <Link to={`/products/${product.id}`} className="text-emerald-700 hover:underline">
                    {product.name}
                  </Link>
                ),
              },
              { header: 'SKU', cell: (product) => product.sku },
              { header: 'Categoria', cell: (product) => product.category?.name ?? '-' },
              { header: 'Preço', cell: (product) => formatKz(product.priceCents) },
              {
                header: 'Stock',
                cell: (product) => (
                  <span className={product.stockQuantity <= product.minStock ? 'font-semibold text-red-600' : ''}>
                    {product.stockQuantity}
                  </span>
                ),
              },
            ]}
            rows={productsQuery.data.data}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              Página {productsQuery.data.meta.page} de {productsQuery.data.meta.totalPages} ({productsQuery.data.meta.total}{' '}
              produtos)
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={page >= productsQuery.data.meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Seguinte
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
