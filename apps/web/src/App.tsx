import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Login/LoginPage';

// A área autenticada (com Recharts, tabelas, etc.) só é carregada depois do login —
// a landing page pública não precisa de pagar esse custo de JavaScript.
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductFormPage = lazy(() =>
  import('./pages/Products/ProductFormPage').then((m) => ({ default: m.ProductFormPage })),
);
const NewSalePage = lazy(() => import('./pages/Sales/NewSalePage').then((m) => ({ default: m.NewSalePage })));
const SalesPage = lazy(() => import('./pages/Sales/SalesPage').then((m) => ({ default: m.SalesPage })));
const SaleDetailPage = lazy(() => import('./pages/Sales/SaleDetailPage').then((m) => ({ default: m.SaleDetailPage })));
const UsersPage = lazy(() => import('./pages/Users/UsersPage').then((m) => ({ default: m.UsersPage })));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id" element={<ProductFormPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/:id" element={<SaleDetailPage />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
