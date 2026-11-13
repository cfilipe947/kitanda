import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ProductFormPage } from './ProductFormPage';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockFetchRouter() {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes('/categories')) {
        return jsonResponse(200, { data: [{ id: 'cat-1', name: 'Mercearia', createdAt: new Date().toISOString() }] });
      }
      if (url.includes('/products') && init?.method === 'POST') {
        return jsonResponse(201, { id: 'prod-1', name: 'Arroz 1kg' });
      }
      return jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Não encontrado', details: [] } });
    }),
  );
  return calls;
}

describe('ProductFormPage — validação', () => {
  it('não submete e mostra erro quando falta a categoria', async () => {
    const calls = mockFetchRouter();
    renderWithProviders(<ProductFormPage />, { route: '/products/new' });

    await userEvent.type(await screen.findByLabelText('Nome'), 'Arroz 1kg');
    await userEvent.type(screen.getByLabelText('SKU'), 'MER-001');
    await userEvent.type(screen.getByLabelText('Preço de venda (Kz)'), '850');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Preenche o nome, o SKU e a categoria.');
    expect(calls.some((call) => call.init?.method === 'POST')).toBe(false);
  });

  it('não submete quando o preço é zero', async () => {
    mockFetchRouter();
    renderWithProviders(<ProductFormPage />, { route: '/products/new' });

    await userEvent.type(await screen.findByLabelText('Nome'), 'Arroz 1kg');
    await userEvent.type(screen.getByLabelText('SKU'), 'MER-001');
    await userEvent.selectOptions(await screen.findByLabelText('Categoria'), 'cat-1');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O preço tem de ser maior que zero.');
  });

  it('cria o produto com os cêntimos calculados correctamente', async () => {
    const calls = mockFetchRouter();
    renderWithProviders(<ProductFormPage />, { route: '/products/new' });

    await userEvent.type(await screen.findByLabelText('Nome'), 'Arroz 1kg');
    await userEvent.type(screen.getByLabelText('SKU'), 'MER-001');
    await userEvent.selectOptions(await screen.findByLabelText('Categoria'), 'cat-1');
    await userEvent.type(screen.getByLabelText('Preço de venda (Kz)'), '850');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(calls.some((call) => call.init?.method === 'POST')).toBe(true));
    const createCall = calls.find((call) => call.init?.method === 'POST')!;

    const body = JSON.parse(createCall.init?.body as string);
    expect(body.priceCents).toBe(85000);
    expect(body.categoryId).toBe('cat-1');
  });

  it('mostra a margem de lucro calculada a partir do preço de venda e de compra', async () => {
    mockFetchRouter();
    renderWithProviders(<ProductFormPage />, { route: '/products/new' });

    await userEvent.type(await screen.findByLabelText('Preço de venda (Kz)'), '1000');
    await userEvent.type(screen.getByLabelText('Preço de compra (Kz)'), '650');

    expect(await screen.findByText('350,00 Kz (35.0%)')).toBeInTheDocument();
  });
});
