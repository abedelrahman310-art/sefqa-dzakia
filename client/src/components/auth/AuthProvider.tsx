import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'operator' | 'authority' | 'central_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  organizationName: string;
}

interface AuthContextProps {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (userData: any, tokens?: { access: string; refresh?: string }) => void;
  logout: () => Promise<void>;
  token: string | null;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

function normalizeUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    displayName: u.displayName || u.display_name || u.full_name || '',
    organizationName: u.organizationName || u.organization_name || u.company_name || u.entity_name || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('safaqat_access_token'));
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const refreshAccessToken = async (): Promise<string | null> => {
    const refresh = localStorage.getItem('safaqat_refresh_token');
    if (!refresh) return null;

    try {
      const res = await fetch('/api/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) throw new Error('Token refresh failed');
      const data = await res.json();
      if (data.access) {
        localStorage.setItem('safaqat_access_token', data.access);
        setToken(data.access);
        return data.access;
      }
    } catch {
      localStorage.removeItem('safaqat_access_token');
      localStorage.removeItem('safaqat_refresh_token');
      setToken(null);
      setUser(null);
    }
    return null;
  };

  useEffect(() => {
    let activeToken = localStorage.getItem('safaqat_access_token');

    async function verifySession() {
      if (!activeToken) {
        // Try refresh token if available
        activeToken = await refreshAccessToken();
      }

      if (!activeToken) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      try {
        let res = await fetch('/api/auth/me/', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (res.status === 401) {
          // Token expired, attempt refresh
          const newToken = await refreshAccessToken();
          if (newToken) {
            res = await fetch('/api/auth/me/', {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
        }

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(normalizeUser(data.user));
            setStatus('authenticated');
            return;
          }
        }
        throw new Error('Unauthorized session');
      } catch {
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    verifySession();
  }, []);

  const login = (userData: any, tokens?: { access: string; refresh?: string }) => {
    if (tokens?.access) {
      localStorage.setItem('safaqat_access_token', tokens.access);
      setToken(tokens.access);
    }
    if (tokens?.refresh) {
      localStorage.setItem('safaqat_refresh_token', tokens.refresh);
    }
    setUser(normalizeUser(userData));
    setStatus('authenticated');
  };

  const logout = async () => {
    const currentToken = localStorage.getItem('safaqat_access_token');
    try {
      await fetch('/api/auth/logout/', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        }
      });
    } finally {
      localStorage.removeItem('safaqat_access_token');
      localStorage.removeItem('safaqat_refresh_token');
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
