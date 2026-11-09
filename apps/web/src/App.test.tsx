import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { renderWithProviders } from './test/renderWithProviders';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(status, body)));
}

// O Painel (ADMIN) dispara vários pedidos assim que monta: cada um precisa de uma
// resposta com a forma certa, senão o componente rebenta a ler propriedades em falta.
function mockFetchForDashboard(loginStatus: number, loginBody: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('/auth/login')) return jsonResponse(loginStatus, loginBody);
      if (url.includes('/reports/summary')) {
        return jsonResponse(200, { today: { totalCents: 0, count: 0 }, month: { totalCents: 0, count: 0 }, lowStockCount: 0 });
      }
      if (url.includes('/reports/')) return jsonResponse(200, { data: [] });
      if (url.includes('/products')) return jsonResponse(200, { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      return jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Não encontrado', details: [] } });
    }),
  );
}

describe('rotas protegidas', () => {
  it('sem sessão, uma rota protegida redirecciona para /login', async () => {
    renderWithProviders(<App />, { route: '/' });
    expect(await screen.findByRole('heading', { name: 'Kitanda' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});

describe('login', () => {
  it('login com sucesso leva um ADMIN para o Painel', async () => {
    mockFetchForDashboard(200, {
      token: 'token-falso',
      user: { id: '1', name: 'Admin', email: 'admin@kitanda.ao', role: 'ADMIN', createdAt: new Date().toISOString() },
    });

    renderWithProviders(<App />, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'admin@kitanda.ao');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Painel' })).toBeInTheDocument();
  });

  it('login com sucesso leva um CASHIER directo para Nova venda', async () => {
    mockFetchOnce(200, {
      token: 'token-falso',
      user: { id: '2', name: 'Vendedor', email: 'vendedor@kitanda.ao', role: 'CASHIER', createdAt: new Date().toISOString() },
    });

    renderWithProviders(<App />, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'vendedor@kitanda.ao');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Nova venda' })).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando as credenciais estão erradas', async () => {
    mockFetchOnce(401, {
      error: { code: 'INVALID_CREDENTIALS', message: 'Email ou password incorrectos', details: [] },
    });

    renderWithProviders(<App />, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'admin@kitanda.ao');
    await userEvent.type(screen.getByLabelText('Password'), 'password-errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou password incorrectos');
    expect(screen.getByRole('heading', { name: 'Kitanda' })).toBeInTheDocument();
  });
});
