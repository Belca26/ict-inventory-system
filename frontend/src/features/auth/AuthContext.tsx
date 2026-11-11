import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { setTokens, clearTokens, getTokens } from '@/lib/tokenStorage';
import type { LoginResponse, RoleName } from '@/types';

type CurrentUser = LoginResponse['user'];

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_STORAGE_KEY = 'ict_inventory_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      // Best-effort — don't block the UI logout on this network call.
      apiClient.post('/api/auth/logout', { refreshToken }).catch(() => {});
    }
    clearTokens();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    // Hydrate from localStorage on load — the apiClient interceptor handles
    // whether the stored access token is still valid (refreshes or logs out
    // automatically on the first failed request).
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);

    const handleForcedLogout = () => logout();
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const hasRole = useCallback((...roles: RoleName[]) => !!user && roles.includes(user.role), [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
