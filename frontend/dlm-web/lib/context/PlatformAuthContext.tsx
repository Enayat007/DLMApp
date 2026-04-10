'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PlatformTokenResponse } from '@/lib/types/platform';

interface PlatformAuthState {
  token:     string | null;
  adminName: string | null;
  adminEmail: string | null;
}

interface PlatformAuthContextValue extends PlatformAuthState {
  isAuthenticated: boolean;
  login:           (response: PlatformTokenResponse) => void;
  logout:          () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

const STORAGE_KEY   = 'dlm_platform_auth';
const PLATFORM_COOKIE = 'dlm_platform_token';

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformAuthState>({
    token: null, adminName: null, adminEmail: null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((response: PlatformTokenResponse) => {
    const next: PlatformAuthState = {
      token:      response.accessToken,
      adminName:  response.adminName,
      adminEmail: response.adminEmail,
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCookie(PLATFORM_COOKIE, response.accessToken, 60 * 60 * 24);
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, adminName: null, adminEmail: null });
    localStorage.removeItem(STORAGE_KEY);
    clearCookie(PLATFORM_COOKIE);
  }, []);

  return (
    <PlatformAuthContext.Provider value={{
      ...state,
      isAuthenticated: !!state.token,
      login,
      logout,
    }}>
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used inside <PlatformAuthProvider>');
  return ctx;
}
