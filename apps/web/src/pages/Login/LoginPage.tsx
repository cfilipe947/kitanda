import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      const redirectTo = (location.state as { from?: string } | null)?.from;
      navigate(redirectTo ?? (user.role === 'ADMIN' ? '/app' : '/app/sales/new'), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="font-heading text-2xl font-semibold text-green-800">
            Kitanda
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-soft">
          <h1 className="mb-1 font-heading text-xl font-semibold text-neutral-900">Entra na tua loja</h1>
          <p className="mb-6 text-sm text-neutral-500">Gere stock, vendas e relatórios num só lugar.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
            <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
              {isSubmitting ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link to="/" className="font-medium text-green-700 hover:text-green-800 hover:underline">
            ← Voltar à página inicial
          </Link>
        </p>
      </div>
    </div>
  );
}
