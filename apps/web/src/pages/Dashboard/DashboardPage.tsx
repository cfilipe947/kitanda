import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Loading } from '../../components/ui/Loading';
import { useProducts } from '../../hooks/useProducts';
import { useSalesByDay, useSummary, useTopProducts } from '../../hooks/useReports';
import { formatKz } from '../../lib/format';

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function DashboardPage() {
  const summaryQuery = useSummary();
  const salesByDayQuery = useSalesByDay(30);
  const topProductsQuery = useTopProducts(5, 30);
  const lowStockQuery = useProducts({ lowStock: true, limit: 5 });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Painel</h1>

      {summaryQuery.isLoading && <Loading />}
      {summaryQuery.isError && <ErrorState onRetry={() => summaryQuery.refetch()} />}
      {summaryQuery.data && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Vendas de hoje"
            value={formatKz(summaryQuery.data.today.totalCents)}
            hint={`${summaryQuery.data.today.count} venda(s)`}
          />
          <SummaryCard
            label="Vendas do mês"
            value={formatKz(summaryQuery.data.month.totalCents)}
            hint={`${summaryQuery.data.month.count} venda(s)`}
          />
          <SummaryCard label="Produtos em stock baixo" value={String(summaryQuery.data.lowStockCount)} />
        </div>
      )}

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Vendas dos últimos 30 dias</h2>
        {salesByDayQuery.isLoading && <Loading />}
        {salesByDayQuery.isError && <ErrorState onRetry={() => salesByDayQuery.refetch()} />}
        {salesByDayQuery.data && salesByDayQuery.data.data.length === 0 && (
          <EmptyState message="Sem vendas nos últimos 30 dias." />
        )}
        {salesByDayQuery.data && salesByDayQuery.data.data.length > 0 && (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDayQuery.data.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => formatKz(value)} width={90} />
                <Tooltip formatter={(value) => formatKz(Number(value))} />
                <Bar dataKey="totalCents" name="Vendas" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Top 5 produtos</h2>
          {topProductsQuery.isLoading && <Loading />}
          {topProductsQuery.isError && <ErrorState onRetry={() => topProductsQuery.refetch()} />}
          {topProductsQuery.data && topProductsQuery.data.data.length === 0 && (
            <EmptyState message="Sem vendas nos últimos 30 dias." />
          )}
          {topProductsQuery.data && topProductsQuery.data.data.length > 0 && (
            <ol className="divide-y divide-slate-100">
              {topProductsQuery.data.data.map((product, index) => (
                <li key={product.productId} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {index + 1}. {product.name}
                  </span>
                  <span className="text-slate-500">{product.totalQuantity} un.</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Stock baixo</h2>
          {lowStockQuery.isLoading && <Loading />}
          {lowStockQuery.isError && <ErrorState onRetry={() => lowStockQuery.refetch()} />}
          {lowStockQuery.data && lowStockQuery.data.data.length === 0 && <EmptyState message="Nenhum produto em stock baixo." />}
          {lowStockQuery.data && lowStockQuery.data.data.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {lowStockQuery.data.data.map((product) => (
                <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/products/${product.id}`} className="text-emerald-700 hover:underline">
                    {product.name}
                  </Link>
                  <span className="font-semibold text-red-600">{product.stockQuantity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
