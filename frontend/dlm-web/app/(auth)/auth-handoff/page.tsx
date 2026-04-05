'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

/**
 * Auth handoff — receives a post-login/signup token from the root domain via URL hash.
 *
 * Flow (root domain → subdomain):
 *   1. Root domain completes login/signup and gets a TokenResponse.
 *   2. Navigates to: {subdomain}.host/auth-handoff#{base64(TokenResponse)}
 *   3. This page (now running on the subdomain) decodes the hash, calls login()
 *      which sets localStorage + dlm_token cookie scoped to this subdomain.
 *   4. Hash is erased from browser history via history.replaceState.
 *   5. Redirects to /dashboard.
 */
export default function AuthHandoffPage() {
  const router    = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading #

    if (hash) {
      try {
        const response = JSON.parse(atob(hash));
        login(response);
      } catch {
        // Malformed hash — fall through; middleware will redirect to /login
      }
      // Erase the token from browser history immediately
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Middleware will send unauthenticated requests back to /login automatically
    router.replace('/dashboard');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm animate-pulse">Setting up your workspace…</p>
    </div>
  );
}
