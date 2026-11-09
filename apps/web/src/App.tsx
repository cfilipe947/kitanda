import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ComingSoonPage } from './pages/ComingSoon';
import { LoginPage } from './pages/Login/LoginPage';

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
        <Route path="/products" element={<ComingSoonPage title="Produtos" />} />
        <Route path="/products/:id" element={<ComingSoonPage title="Produto" />} />
        <Route path="/sales/new" element={<ComingSoonPage title="Nova venda" />} />
        <Route path="/sales" element={<ComingSoonPage title="Vendas" />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ComingSoonPage title="Utilizadores" />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
