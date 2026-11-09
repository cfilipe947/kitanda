import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const navItems = [
  { to: '/', label: 'Painel', adminOnly: true },
  { to: '/products', label: 'Produtos', adminOnly: false },
  { to: '/sales/new', label: 'Nova venda', adminOnly: false },
  { to: '/sales', label: 'Vendas', adminOnly: false },
  { to: '/users', label: 'Utilizadores', adminOnly: true },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = navItems.filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-lg font-semibold text-emerald-700">Kitanda</span>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
        >
          ☰
        </button>
      </header>

      <nav
        aria-label="Navegação principal"
        className={`${menuOpen ? 'block' : 'hidden'} w-full border-b border-slate-200 bg-white px-4 py-3 lg:block lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-3 lg:py-6`}
      >
        <p className="mb-4 hidden text-lg font-semibold text-emerald-700 lg:block">Kitanda</p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 truncate text-sm text-slate-500">{user?.name}</p>
          <Button variant="secondary" onClick={logout} className="w-full">
            Sair
          </Button>
        </div>
      </nav>

      <main className="flex-1 p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
