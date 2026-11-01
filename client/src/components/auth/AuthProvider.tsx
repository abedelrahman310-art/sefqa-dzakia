import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  ACCESS_TOKEN_KEY,
  AUTH_EXPIRED_EVENT,
  LEGACY_USER_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_REFRESHED_EVENT,
  clearAuthSession,
  refreshAccessToken as requestTokenRefresh,
} from '@/lib/api';

export type UserRole = 'operator' | 'authority' | 'central_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  organizationName: string;
}

/**
 * البيانات التي يُرجعها الخادم فقط (تسجيل الدخول أو /api/auth/me/).
 * لا تُقبل أي نسخة محلية بديلة لتحديد الدور.
 */
export interface UserPayload {
  id?: string;
  email?: string;
  role?: UserRole;
  displayName?: string;
  display_name?: string;
  full_name?: string;
  organizationName?: string;
  organization_name?: string;
  company_name?: string;
  entity_name?: string;
}

interface AuthContextProps {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (userData: UserPayload, tokens?: { access: string; refresh?: string }) => void;
  logout: () => Promise<void>;
  token: string | null;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

function normalizeUser(u: UserPayload): User {
  return {
    id: u.id ?? '',
    email: u.email ?? '',
    role: u.role as UserRole,
    displayName: u.displayName || u.display_name || u.full_name || '',
    organizationName:
      u.organizationName || u.organization_name || u.company_name || u.entity_name || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const renewed = await requestTokenRefresh();
    if (renewed) {
      setToken(renewed);
    }
    return renewed;
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
    };
    const handleRefreshed = (event: Event) => {
      const access = (event as CustomEvent<{ access?: string }>).detail?.access;
      if (access) {
        setToken(access);
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    window.addEventListener(TOKEN_REFRESHED_EVENT, handleRefreshed);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
      window.removeEventListener(TOKEN_REFRESHED_EVENT, handleRefreshed);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      // لا يُعتمد أي دور محفوظ محلياً: يُحذف المفتاح القديم فوراً،
      // ثم يُطلب الدور من الخادم وحده.
      localStorage.removeItem(LEGACY_USER_KEY);

      let activeToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!activeToken) {
        activeToken = await refreshAccessToken();
        if (cancelled) return;
      }

      if (activeToken) {
        let res = await fetch('/api/auth/me/', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (res.status === 401) {
          const renewedToken = await refreshAccessToken();
          if (cancelled) return;
          if (renewedToken) {
            activeToken = renewedToken;
            res = await fetch('/api/auth/me/', {
              headers: { Authorization: `Bearer ${renewedToken}` },
            });
          }
        }

        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data?.user?.role) {
            setUser(normalizeUser(data.user));
            setToken(activeToken);
            setStatus('authenticated');
            return;
          }
        }
      }

      if (cancelled) return;
      // رفض الخادم الجلسة أو لم يُرجع دوراً صالحاً → جلسة غير صالحة.
      clearAuthSession();
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [refreshAccessToken]);

  const login = (userData: UserPayload, tokens?: { access: string; refresh?: string }) => {
    if (tokens?.access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
      setToken(tokens.access);
    }
    if (tokens?.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    }
    localStorage.removeItem(LEGACY_USER_KEY);
    setUser(normalizeUser(userData));
    setStatus('authenticated');
  };

  const logout = async () => {
    const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    try {
      await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      });
    } finally {
      clearAuthSession();
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout, token, refreshToken: refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
