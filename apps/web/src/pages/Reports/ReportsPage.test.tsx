import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ReportsPage } from './ReportsPage';

const saveMock = vi.fn();

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function MockJsPDF() {
    return {
      internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
      addImage: vi.fn(),
      addPage: vi.fn(),
      save: saveMock,
    };
  }),
}));

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 800,
    height: 400,
    toDataURL: () => 'data:image/png;base64,fake',
  }),
}));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function profitReportBody(period: 'week' | 'month' | 'year', overrides: Partial<Record<string, unknown>> = {}) {
  return {
    period,
    from: '2026-11-09',
    to: '2026-11-15',
    revenueCents: 170000,
    costCents: 130000,
    profitCents: 40000,
    marginPct: 23.5,
    salesCount: 2,
    series: [{ bucket: '2026-11-09', revenueCents: 170000, costCents: 130000, profitCents: 40000, count: 2 }],
    topProducts: [
      { productId: 'prod-1', name: 'Arroz 1kg', totalQuantity: 2, revenueCents: 100000, costCents: 75000, profitCents: 25000 },
    ],
    ...overrides,
  };
}

function mockFetchRouter() {
  const calls: { url: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push({ url });
      if (url.includes('/reports/profit')) {
        const period = new URL(url).searchParams.get('period') as 'week' | 'month' | 'year';
        return jsonResponse(200, profitReportBody(period));
      }
      return jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Não encontrado', details: [] } });
    }),
  );
  return calls;
}

describe('ReportsPage', () => {
  it('mostra receita, custo, lucro e margem do período', async () => {
    mockFetchRouter();
    renderWithProviders(<ReportsPage />);

    expect(await screen.findByText('1 700,00 Kz')).toBeInTheDocument();
    expect(screen.getByText('1 300,00 Kz')).toBeInTheDocument();
    expect(screen.getByText('400,00 Kz')).toBeInTheDocument();
    expect(screen.getByText('23.5%')).toBeInTheDocument();
    expect(screen.getByText('Arroz 1kg')).toBeInTheDocument();
  });

  it('muda o período para mês e pede os dados outra vez', async () => {
    const calls = mockFetchRouter();
    renderWithProviders(<ReportsPage />);

    await screen.findByText('1 700,00 Kz');
    await userEvent.click(screen.getByRole('button', { name: 'Mês' }));

    await waitFor(() => expect(calls.some((call) => call.url.includes('period=month'))).toBe(true));
  });

  it('gera o PDF ao clicar em "Descarregar PDF"', async () => {
    mockFetchRouter();
    renderWithProviders(<ReportsPage />);

    await screen.findByText('1 700,00 Kz');
    await userEvent.click(screen.getByRole('button', { name: 'Descarregar PDF' }));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock.mock.calls[0]?.[0]).toMatch(/^kitanda-relatorio-week-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
