import { CircleDollarSign, ChevronLeft, ChevronRight, Download, Percent, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProfitPeriod } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Table } from '../../components/ui/Table';
import { useProfitReport } from '../../hooks/useReports';
import { formatKz } from '../../lib/format';

const periodLabels: Record<ProfitPeriod, string> = { week: 'Semana', month: 'Mês', year: 'Ano' };
const periods: ProfitPeriod[] = ['week', 'month', 'year'];

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(date: Date, period: ProfitPeriod, direction: 1 | -1): Date {
  const next = new Date(date);
  if (period === 'week') next.setDate(next.getDate() + 7 * direction);
  else if (period === 'month') next.setMonth(next.getMonth() + direction);
  else next.setFullYear(next.getFullYear() + direction);
  return next;
}

function formatRangeLabel(from: string, to: string, period: ProfitPeriod): string {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  if (period === 'year') return String(fromDate.getFullYear());
  if (period === 'month') return fromDate.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
  const fmt = (d: Date) => d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  return `${fmt(fromDate)} – ${fmt(toDate)}`;
}

function bucketLabel(bucket: string, period: ProfitPeriod): string {
  const date = new Date(`${bucket}T00:00:00`);
  if (period === 'year') return date.toLocaleDateString('pt-AO', { month: 'short' });
  return date.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
}

function SummaryCard({ label, value, hint, icon, tone = 'green' }: { label: string; value: string; hint?: string; icon: ReactNode; tone?: 'green' | 'danger' }) {
  const toneClasses = tone === 'danger' ? 'bg-danger-100 text-danger-600' : 'bg-green-100 text-green-700';
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-neutral-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClasses}`}>{icon}</span>
      </div>
    </Card>
  );
}

export function ReportsPage() {
  const [period, setPeriod] = useState<ProfitPeriod>('week');
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const dateParam = toDateParam(referenceDate);
  const reportQuery = useProfitReport(period, dateParam);

  function changePeriod(nextPeriod: ProfitPeriod) {
    setPeriod(nextPeriod);
    setReferenceDate(new Date());
  }

  async function handleDownloadPdf() {
    if (!reportRef.current || !reportQuery.data) return;
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let offsetY = margin;
      pdf.addImage(imgData, 'PNG', margin, offsetY, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        offsetY = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, offsetY, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`kitanda-relatorio-${period}-${dateParam}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold text-neutral-900">Relatórios</h1>
        <Button
          variant="secondary"
          onClick={handleDownloadPdf}
          isLoading={isExporting}
          disabled={!reportQuery.data}
          leftIcon={<Download className="h-4 w-4" />}
        >
          {isExporting ? 'A gerar PDF...' : 'Descarregar PDF'}
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changePeriod(item)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === item ? 'bg-green-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {periodLabels[item]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() => setReferenceDate((current) => shiftDate(current, period, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="min-w-[170px] text-center text-sm font-medium text-neutral-700">
            {reportQuery.data ? formatRangeLabel(reportQuery.data.from, reportQuery.data.to, period) : '...'}
          </span>
          <button
            type="button"
            aria-label="Período seguinte"
            onClick={() => setReferenceDate((current) => shiftDate(current, period, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {reportQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {reportQuery.isError && <ErrorState onRetry={() => reportQuery.refetch()} />}

      {reportQuery.data && (
        <div ref={reportRef} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Receita" value={formatKz(reportQuery.data.revenueCents)} icon={<CircleDollarSign aria-hidden="true" className="h-5 w-5" />} />
            <SummaryCard label="Custo" value={formatKz(reportQuery.data.costCents)} icon={<Wallet aria-hidden="true" className="h-5 w-5" />} />
            <SummaryCard
              label="Lucro"
              value={formatKz(reportQuery.data.profitCents)}
              hint={`${reportQuery.data.salesCount} venda(s)`}
              icon={<TrendingUp aria-hidden="true" className="h-5 w-5" />}
              tone={reportQuery.data.profitCents >= 0 ? 'green' : 'danger'}
            />
            <SummaryCard
              label="Margem de lucro"
              value={`${reportQuery.data.marginPct.toFixed(1)}%`}
              icon={<Percent aria-hidden="true" className="h-5 w-5" />}
              tone={reportQuery.data.marginPct >= 0 ? 'green' : 'danger'}
            />
          </div>

          <Card title={`Receita e lucro — ${periodLabels[period].toLowerCase()}`}>
            {reportQuery.data.series.every((point) => point.count === 0) ? (
              <EmptyState message="Sem vendas neste período." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportQuery.data.series.map((point) => ({ ...point, label: bucketLabel(point.bucket, period) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dde4e0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6e7e74' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6e7e74' }} tickFormatter={(value: number) => formatKz(value)} width={90} />
                    <Tooltip formatter={(value) => formatKz(Number(value))} />
                    <Bar dataKey="revenueCents" name="Receita" fill="#9fd9b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profitCents" name="Lucro" fill="#107a48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card title="Top 5 produtos por receita">
            {reportQuery.data.topProducts.length === 0 ? (
              <EmptyState message="Sem vendas neste período." />
            ) : (
              <Table
                rowKey={(product) => product.productId}
                columns={[
                  { header: 'Produto', cell: (product) => product.name },
                  { header: 'Qtd.', align: 'right', cell: (product) => product.totalQuantity },
                  { header: 'Receita', align: 'right', cell: (product) => formatKz(product.revenueCents) },
                  { header: 'Lucro', align: 'right', cell: (product) => formatKz(product.profitCents) },
                ]}
                rows={reportQuery.data.topProducts}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
