import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import type { PaymentMethod } from '../../api/types';
import { Button } from '../../components/ui/Button';
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
      navigate(`/sales/${sale.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registar a venda.');
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-slate-900">Nova venda</h1>
        <input
          type="search"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Pesquisar produto"
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {productsQuery.data?.data.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-500">
                  {formatKz(product.priceCents)} · stock: {product.stockQuantity}
                </p>
              </div>
              <Button variant="secondary" disabled={product.stockQuantity <= 0} onClick={() => cart.addItem(product)}>
                Adicionar
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Carrinho</h2>
        {cart.items.length === 0 ? (
          <p className="text-sm text-slate-500">Carrinho vazio.</p>
        ) : (
          <ul className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatKz(item.unitPriceCents)} / un.</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={item.stockQuantity}
                  value={item.quantity}
                  aria-label={`Quantidade de ${item.name}`}
                  onChange={(event) => cart.setQuantity(item.productId, Number(event.target.value))}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
                <Button variant="danger" onClick={() => cart.removeItem(item.productId)}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mb-4 flex items-center justify-between text-lg font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatKz(cart.totalCents)}</span>
        </div>

        <div className="mb-4">
          <label htmlFor="payment-method" className="mb-1 block text-sm font-medium text-slate-700">
            Método de pagamento
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button disabled={cart.items.length === 0 || createSale.isPending} onClick={handleConfirm}>
          {createSale.isPending ? 'A confirmar...' : 'Confirmar venda'}
        </Button>
      </div>
    </div>
  );
}
