import { AlertTriangle, CalendarRange, CircleDollarSign } from 'lucide-react';
import { formatKz } from '../../lib/format';

// Alturas relativas (0-100) só para o mini-gráfico decorativo da landing — o gráfico real usa Recharts no Painel.
const sampleBars = [38, 46, 33, 53, 68, 78, 48];

/** Mini-gráfico em CSS: evita carregar o Recharts na página pública só para uma pré-visualização. */
function MiniBarChart() {
  return (
    <div className="flex h-full items-end gap-1.5 px-1">
      {sampleBars.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-t-sm bg-green-600"
          style={{ height: `${height}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/** Recriação fiel do Painel real, com dados de exemplo — usada na landing (hero e secção mobile). */
export function DashboardPreview() {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CircleDollarSign aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <p className="mt-1.5 text-[10px] text-neutral-500">Hoje</p>
          <p className="font-heading text-sm font-semibold tabular-nums text-neutral-900">{formatKz(226000)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CalendarRange aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <p className="mt-1.5 text-[10px] text-neutral-500">Este mês</p>
          <p className="font-heading text-sm font-semibold tabular-nums text-neutral-900">{formatKz(5430000)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-100 text-warning-600">
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <p className="mt-1.5 text-[10px] text-neutral-500">Stock baixo</p>
          <p className="font-heading text-sm font-semibold tabular-nums text-neutral-900">3</p>
        </div>
      </div>
      <div className="h-28 rounded-lg border border-neutral-200 bg-white p-2">
        <MiniBarChart />
      </div>
    </div>
  );
}
