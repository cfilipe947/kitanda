import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { UNAUTHORIZED_EVENT } from '../api/http';
import { clearToken, getToken, setToken } from '../lib/authStorage';
import type { User } from '../api/types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Ao abrir a app com um token guardado, confirma-o na API em vez de confiar cegamente nele.
  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const current = await authApi.me();
        if (active) setUser(current);
      } catch {
        clearToken();
      } finally {
        if (active) setIsLoading(false);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  // O cliente HTTP dispara este evento quando um pedido autenticado leva 401
  // (token inválido/expirado). Aqui limpamos a sessão e navegamos sem recarregar a página.
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      navigate('/login', { replace: true });
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate]);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    clearToken();
    setUser(null);
    navigate('/login', { replace: true });
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth tem de ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
