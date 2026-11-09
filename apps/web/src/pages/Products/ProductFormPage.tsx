import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { Table } from '../../components/ui/Table';
import { useCategories } from '../../hooks/useCategories';
import { useCreateProduct, useProduct, useUpdateProduct } from '../../hooks/useProducts';
import { parseKzToCents } from '../../lib/format';
import { StockMovementModal } from './StockMovementModal';

const movementLabels: Record<string, string> = { IN: 'Entrada', OUT: 'Venda', ADJUSTMENT: 'Ajuste' };

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const categoriesQuery = useCategories();
  const productQuery = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(id ?? '');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceKz, setPriceKz] = useState('');
  const [costKz, setCostKz] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const product = productQuery.data;
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategoryId(product.categoryId);
      setPriceKz((product.priceCents / 100).toFixed(2));
      setCostKz((product.costCents / 100).toFixed(2));
      setMinStock(String(product.minStock));
    }
  }, [productQuery.data]);

  if (isEditing && productQuery.isLoading) return <Loading />;
  if (isEditing && productQuery.isError) return <ErrorState onRetry={() => productQuery.refetch()} />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim() || !categoryId) {
      setError('Preenche o nome, o SKU e a categoria.');
      return;
    }
    const priceCents = parseKzToCents(priceKz);
    if (!(priceCents > 0)) {
      setError('O preço tem de ser maior que zero.');
      return;
    }

    try {
      if (isEditing && id) {
        await updateProduct.mutateAsync({
          name,
          sku,
          categoryId,
          priceCents,
          costCents: parseKzToCents(costKz),
          minStock: Number.parseInt(minStock, 10) || 0,
        });
      } else {
        await createProduct.mutateAsync({
          name,
          sku,
          categoryId,
          priceCents,
          costCents: parseKzToCents(costKz),
          minStock: Number.parseInt(minStock, 10) || 0,
          stockQuantity: Number.parseInt(stockQuantity, 10) || 0,
        });
      }
      navigate('/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível guardar o produto.');
    }
  }

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{isEditing ? 'Editar produto' : 'Novo produto'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="SKU" value={sku} onChange={(event) => setSku(event.target.value)} required />

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
            Categoria
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Selecciona uma categoria</option>
            {categoriesQuery.data?.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Preço (Kz)"
            type="number"
            step="0.01"
            min="0"
            value={priceKz}
            onChange={(event) => setPriceKz(event.target.value)}
            required
          />
          <Input
            label="Custo (Kz)"
            type="number"
            step="0.01"
            min="0"
            value={costKz}
            onChange={(event) => setCostKz(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Stock mínimo"
            type="number"
            min="0"
            value={minStock}
            onChange={(event) => setMinStock(event.target.value)}
          />
          {isEditing ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Stock actual</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {productQuery.data?.stockQuantity ?? '-'}
              </span>
            </div>
          ) : (
            <Input
              label="Stock inicial"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
            />
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'A guardar...' : 'Guardar'}
          </Button>
          {isEditing && (
            <Button type="button" variant="secondary" onClick={() => setIsStockModalOpen(true)}>
              Entrada de stock
            </Button>
          )}
        </div>
      </form>

      {isEditing && productQuery.data && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Histórico de movimentos</h2>
          {productQuery.data.movements.length === 0 ? (
            <p className="text-sm text-slate-500">Sem movimentos.</p>
          ) : (
            <Table
              rowKey={(movement) => movement.id}
              columns={[
                { header: 'Data', cell: (movement) => new Date(movement.createdAt).toLocaleString('pt-AO') },
                { header: 'Tipo', cell: (movement) => movementLabels[movement.type] ?? movement.type },
                { header: 'Quantidade', cell: (movement) => movement.quantity },
                { header: 'Motivo', cell: (movement) => movement.reason ?? '-' },
                { header: 'Utilizador', cell: (movement) => movement.user?.name ?? '-' },
              ]}
              rows={productQuery.data.movements}
            />
          )}
        </div>
      )}

      {isEditing && id && (
        <StockMovementModal productId={id} isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} />
      )}
    </div>
  );
}
