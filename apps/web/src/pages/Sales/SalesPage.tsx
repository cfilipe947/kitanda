import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Loading } from '../../components/ui/Loading';
import { Table } from '../../components/ui/Table';
import { useSales } from '../../hooks/useSales';
import { formatKz } from '../../lib/format';

const paymentLabels: Record<string, string> = { CASH: 'Dinheiro', MULTICAIXA: 'Multicaixa', TRANSFER: 'Transferência' };

export function SalesPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const salesQuery = useSales({ from: from || undefined, to: to || undefined, page, limit: 20 });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Vendas</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="mb-1 block text-sm text-slate-700">
            De
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm text-slate-700">
            Até
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {salesQuery.isLoading && <Loading />}
      {salesQuery.isError && <ErrorState onRetry={() => salesQuery.refetch()} />}
      {salesQuery.data?.data.length === 0 && <EmptyState message="Nenhuma venda encontrada." />}

      {salesQuery.data && salesQuery.data.data.length > 0 && (
        <>
          <Table
            rowKey={(sale) => sale.id}
            columns={[
              { header: 'Data', cell: (sale) => new Date(sale.createdAt).toLocaleString('pt-AO') },
              { header: 'Total', cell: (sale) => formatKz(sale.totalCents) },
              { header: 'Pagamento', cell: (sale) => paymentLabels[sale.paymentMethod] ?? sale.paymentMethod },
              {
                header: '',
                cell: (sale) => (
                  <Link to={`/sales/${sale.id}`} className="text-emerald-700 hover:underline">
                    Ver detalhe
                  </Link>
                ),
              },
            ]}
            rows={salesQuery.data.data}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Página {salesQuery.data.meta.page} de {salesQuery.data.meta.totalPages}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
