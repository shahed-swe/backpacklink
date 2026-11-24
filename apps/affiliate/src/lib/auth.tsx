'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, getToken, setToken } from './client-api';

export interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextValue {
  user: PortalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<PortalUser>;
  signup: (data: { email: string; password: string; name?: string; country?: string }) => Promise<PortalUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  signup: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: () => {},
});

// Affiliates use a normal BackpackLink account — the same login as the store.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const res = await apiFetch<{ user: PortalUser }>('/api/auth/me');
          setUser(res.user);
        } catch {
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: PortalUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(async (data: { email: string; password: string; name?: string; country?: string }) => {
    const res = await apiFetch<{ token: string; user: PortalUser }>('/api/auth/signup', {
      method: 'POST',
      body: data,
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
