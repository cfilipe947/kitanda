import { LayoutDashboard, LogOut, Menu, Package, Receipt, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { Suspense, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';

const navItems = [
  { to: '/app', label: 'Painel', icon: LayoutDashboard, adminOnly: true, primary: true },
  { to: '/app/products', label: 'Produtos', icon: Package, adminOnly: false, primary: true },
  { to: '/app/sales/new', label: 'Nova venda', icon: ShoppingCart, adminOnly: false, primary: true },
  { to: '/app/sales', label: 'Vendas', icon: Receipt, adminOnly: false, primary: true },
  { to: '/app/reports', label: 'Relatórios', icon: TrendingUp, adminOnly: true, primary: false },
  { to: '/app/users', label: 'Utilizadores', icon: Users, adminOnly: true, primary: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const items = navItems.filter((item) => !item.adminOnly || user?.role === 'ADMIN');
  const primaryItems = items.filter((item) => item.primary);
  const secondaryItems = items.filter((item) => !item.primary);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-green-50 text-green-800 border-l-4 border-green-600 -ml-px'
        : 'text-neutral-600 hover:bg-neutral-100'
    }`;

  return (
    <div className="min-h-screen bg-neutral-50 lg:flex">
      {/* Cabeçalho simples no telemóvel: a navegação principal vive na barra inferior */}
      <header className="flex items-center justify-center border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-heading text-lg font-semibold text-green-800">Kitanda</span>
      </header>

      <nav
        aria-label="Navegação principal"
        className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white px-3 py-6 lg:block"
      >
        <p className="mb-6 px-3 font-heading text-xl font-semibold text-green-800">Kitanda</p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/app'} className={linkClasses}>
                <item.icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-neutral-200 pt-4">
          <p className="mb-2 truncate px-3 text-sm text-neutral-500">{user?.name}</p>
          <Button variant="secondary" onClick={logout} className="w-full" leftIcon={<LogOut className="h-4 w-4" />}>
            Sair
          </Button>
        </div>
      </nav>

      <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Barra de navegação inferior no telemóvel; "Mais" abre a gaveta com o resto */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-neutral-200 bg-white px-1 py-1 lg:hidden"
      >
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-medium ${
                isActive ? 'text-green-700' : 'text-neutral-500'
              }`
            }
          >
            <item.icon aria-hidden="true" className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-medium text-neutral-500"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <Modal title="Mais" isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)}>
        <p className="mb-4 truncate text-sm text-neutral-500">{user?.name}</p>
        <div className="flex flex-col gap-2">
          {secondaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMoreOpen(false)}
              className={linkClasses}
            >
              <item.icon aria-hidden="true" className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <Button variant="secondary" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
            Sair
          </Button>
        </div>
      </Modal>
    </div>
  );
}
