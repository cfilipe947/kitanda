import { useParams } from 'react-router-dom';
import { ErrorState } from '../../components/ui/ErrorState';
import { Loading } from '../../components/ui/Loading';
import { Table } from '../../components/ui/Table';
import { useSale } from '../../hooks/useSales';
import { formatKz } from '../../lib/format';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const saleQuery = useSale(id);

  if (saleQuery.isLoading) return <Loading />;
  if (saleQuery.isError || !saleQuery.data) return <ErrorState onRetry={() => saleQuery.refetch()} />;

  const sale = saleQuery.data;

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-neutral-900">Venda</h1>
      <p className="mb-6 text-sm text-neutral-500">
        {new Date(sale.createdAt).toLocaleString('pt-AO')} · {sale.user?.name ?? '-'}
      </p>

      <Table
        rowKey={(item) => item.id}
        columns={[
          { header: 'Produto', cell: (item) => item.product?.name ?? item.productId },
          { header: 'Quantidade', cell: (item) => item.quantity, align: 'right' },
          { header: 'Preço unitário', cell: (item) => formatKz(item.unitPriceCents), align: 'right' },
          { header: 'Subtotal', cell: (item) => formatKz(item.unitPriceCents * item.quantity), align: 'right' },
        ]}
        rows={sale.items}
      />

      <div className="mt-4 text-right font-heading text-xl font-semibold tabular-nums text-neutral-900">
        Total: {formatKz(sale.totalCents)}
      </div>
    </div>
  );
}
