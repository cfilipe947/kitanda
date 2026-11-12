import { AlertTriangle, CalendarRange, CircleDollarSign, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useProducts } from '../../hooks/useProducts';
import { useSalesByDay, useSummary, useTopProducts } from '../../hooks/useReports';
import { formatKz } from '../../lib/format';

function SummaryCard({ label, value, hint, icon, tone = 'green' }: { label: string; value: string; hint?: string; icon: ReactNode; tone?: 'green' | 'warning' }) {
  const toneClasses = tone === 'warning' ? 'bg-warning-100 text-warning-600' : 'bg-green-100 text-green-700';
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1 font-heading text-3xl font-semibold tabular-nums text-neutral-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClasses}`}>{icon}</span>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const summaryQuery = useSummary();
  const salesByDayQuery = useSalesByDay(30);
  const topProductsQuery = useTopProducts(5, 30);
  const lowStockQuery = useProducts({ lowStock: true, limit: 5 });

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-neutral-900">Painel</h1>

      {summaryQuery.isLoading && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {summaryQuery.isError && <ErrorState onRetry={() => summaryQuery.refetch()} />}
      {summaryQuery.data && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Vendas de hoje"
            value={formatKz(summaryQuery.data.today.totalCents)}
            hint={`${summaryQuery.data.today.count} venda(s)`}
            icon={<CircleDollarSign aria-hidden="true" className="h-5 w-5" />}
          />
          <SummaryCard
            label="Vendas do mês"
            value={formatKz(summaryQuery.data.month.totalCents)}
            hint={`${summaryQuery.data.month.count} venda(s)`}
            icon={<CalendarRange aria-hidden="true" className="h-5 w-5" />}
          />
          <SummaryCard
            label="Produtos em stock baixo"
            value={String(summaryQuery.data.lowStockCount)}
            icon={<AlertTriangle aria-hidden="true" className="h-5 w-5" />}
            tone="warning"
          />
        </div>
      )}

      <Card title="Vendas dos últimos 30 dias" className="mb-8">
        {salesByDayQuery.isLoading && <div className="h-72 animate-pulse rounded-lg bg-neutral-100" />}
        {salesByDayQuery.isError && <ErrorState onRetry={() => salesByDayQuery.refetch()} />}
        {salesByDayQuery.data && salesByDayQuery.data.data.length === 0 && (
          <EmptyState message="Sem vendas nos últimos 30 dias." />
        )}
        {salesByDayQuery.data && salesByDayQuery.data.data.length > 0 && (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDayQuery.data.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde4e0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6e7e74' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6e7e74' }} tickFormatter={(value: number) => formatKz(value)} width={90} />
                <Tooltip formatter={(value) => formatKz(Number(value))} />
                <Bar dataKey="totalCents" name="Vendas" fill="#107a48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top 5 produtos" action={<Trophy aria-hidden="true" className="h-5 w-5 text-neutral-400" />}>
          {topProductsQuery.isLoading && <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />}
          {topProductsQuery.isError && <ErrorState onRetry={() => topProductsQuery.refetch()} />}
          {topProductsQuery.data && topProductsQuery.data.data.length === 0 && (
            <EmptyState message="Sem vendas nos últimos 30 dias." />
          )}
          {topProductsQuery.data && topProductsQuery.data.data.length > 0 && (
            <ol className="divide-y divide-neutral-100">
              {topProductsQuery.data.data.map((product, index) => (
                <li key={product.productId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-neutral-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-xs font-semibold text-green-700">
                      {index + 1}
                    </span>
                    {product.name}
                  </span>
                  <span className="tabular-nums text-neutral-500">{product.totalQuantity} un.</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Stock baixo">
          {lowStockQuery.isLoading && <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />}
          {lowStockQuery.isError && <ErrorState onRetry={() => lowStockQuery.refetch()} />}
          {lowStockQuery.data && lowStockQuery.data.data.length === 0 && <EmptyState message="Nenhum produto em stock baixo." />}
          {lowStockQuery.data && lowStockQuery.data.data.length > 0 && (
            <ul className="divide-y divide-neutral-100">
              {lowStockQuery.data.data.map((product) => (
                <li key={product.id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link to={`/app/products/${product.id}`} className="font-medium text-green-700 hover:underline">
                    {product.name}
                  </Link>
                  <Badge tone="warning">{product.stockQuantity} un.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
