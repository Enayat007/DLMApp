'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TenantInfo, TokenResponse, UserProfile } from '@/lib/types/auth';

// ── State shape ───────────────────────────────────────────────────────────────

interface AuthState {
  token:  string | null;
  user:   UserProfile | null;
  tenant: TenantInfo | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin:         boolean;
  login:           (response: TokenResponse) => void;
  logout:          () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'dlm_auth';
const AUTH_COOKIE = 'dlm_token';

// Cookie is scoped to the current hostname (no domain= attribute).
// This means it works correctly on each tenant subdomain independently:
//   - Set at acme.localhost:3000 → readable by middleware at acme.localhost:3000
//   - Not shared with localhost or other subdomains (correct isolation).
function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, tenant: null });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((response: TokenResponse) => {
    const next: AuthState = {
      token:  response.accessToken,
      user:   response.user,
      tenant: response.tenant,
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Set the auth cookie so Next.js Edge Middleware can guard subdomain routes.
    // Cookie lives for 24 h (align with JWT expiry if needed).
    setCookie(AUTH_COOKIE, response.accessToken, 60 * 60 * 24);
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null, tenant: null });
    localStorage.removeItem(STORAGE_KEY);
    clearCookie(AUTH_COOKIE);
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      isAuthenticated: !!state.token,
      isAdmin:         state.user?.role === 'Admin',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
