import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import type { PaymentMethod } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../hooks/useCart';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useProducts } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useSales';
import { formatKz } from '../../lib/format';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'MULTICAIXA', label: 'Multicaixa' },
  { value: 'TRANSFER', label: 'Transferência' },
];

export function NewSalePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const productsQuery = useProducts({ search: debouncedSearch || undefined, limit: 10 });
  const cart = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [error, setError] = useState<string | null>(null);
  const createSale = useCreateSale();

  async function handleConfirm() {
    setError(null);
    try {
      const sale = await createSale.mutateAsync({
        paymentMethod,
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      cart.clear();
      showToast('Venda registada com sucesso.');
      navigate(`/app/sales/${sale.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registar a venda.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-neutral-900">Nova venda</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Produtos">
          <Input
            type="search"
            label="Pesquisar produto"
            placeholder="Pesquisar produto..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-4"
          />
          {productsQuery.data?.data.length === 0 ? (
            <EmptyState message="Nenhum produto encontrado." />
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
              {productsQuery.data?.data.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                    <p className="text-xs tabular-nums text-neutral-500">
                      {formatKz(product.priceCents)} · stock: {product.stockQuantity}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={product.stockQuantity <= 0}
                    onClick={() => cart.addItem(product)}
                  >
                    Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Carrinho" action={<ShoppingCart aria-hidden="true" className="h-5 w-5 text-neutral-400" />}>
          {cart.items.length === 0 ? (
            <EmptyState message="Carrinho vazio." />
          ) : (
            <ul className="mb-4 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                    <p className="text-xs tabular-nums text-neutral-500">{formatKz(item.unitPriceCents)} / un.</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={item.stockQuantity}
                    value={item.quantity}
                    aria-label={`Quantidade de ${item.name}`}
                    onChange={(event) => cart.setQuantity(item.productId, Number(event.target.value))}
                    className="w-16 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.productId)}
                    aria-label={`Remover ${item.name}`}
                    className="rounded-md p-2 text-danger-500 transition-colors hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-4 flex items-center justify-between font-heading text-xl font-semibold text-neutral-900">
            <span>Total</span>
            <span className="tabular-nums">{formatKz(cart.totalCents)}</span>
          </div>

          <Select
            label="Método de pagamento"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            className="mb-4"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>

          {error && (
            <p role="alert" className="mb-3 text-sm text-danger-600">
              {error}
            </p>
          )}

          <Button
            disabled={cart.items.length === 0}
            isLoading={createSale.isPending}
            onClick={handleConfirm}
            className="w-full"
          >
            {createSale.isPending ? 'A confirmar...' : 'Confirmar venda'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
