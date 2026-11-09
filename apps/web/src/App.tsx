import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ComingSoonPage } from './pages/ComingSoon';
import { LoginPage } from './pages/Login/LoginPage';
import { ProductFormPage } from './pages/Products/ProductFormPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { NewSalePage } from './pages/Sales/NewSalePage';
import { SaleDetailPage } from './pages/Sales/SaleDetailPage';
import { SalesPage } from './pages/Sales/SalesPage';
import { UsersPage } from './pages/Users/UsersPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ComingSoonPage title="Painel" />
            </ProtectedRoute>
          }
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductFormPage />} />
        <Route path="/sales/new" element={<NewSalePage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route
          path="/users"
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
