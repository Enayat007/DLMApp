'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService, type ApiError } from '@/lib/api/authService';
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Mirror of extractSubdomain() in middleware.ts — runs client-side.
 * Returns the tenant slug if the current hostname is a subdomain, null if root.
 */
function getSubdomainFromHost(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  const nonTenant = new Set(['www', 'api', 'mail', 'smtp', 'ftp']);
  const candidate = parts[0];
  if (nonTenant.has(candidate)) return null;
  // acme.localhost  (2 parts, second = "localhost") → tenant subdomain
  if (parts.length === 2 && parts[1] === 'localhost') return candidate;
  // acme.nibrasgroups.com (3+ parts) → tenant subdomain
  if (parts.length >= 3) return candidate;
  return null;
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  // True when the browser is already on a tenant subdomain (e.g. app3.localhost:3000)
  const [onSubdomain, setOnSubdomain]   = useState(false);
  const [subdomain,   setSubdomain]     = useState('');
  const [form,        setForm]          = useState({ email: '', password: '' });
  const [errors,      setErrors]        = useState<Record<string, string>>({});
  const [isLoading,   setLoading]       = useState(false);

  // Detect subdomain from the browser URL on first render
  useEffect(() => {
    const detected = getSubdomainFromHost(window.location.hostname);
    if (detected) {
      setOnSubdomain(true);
      setSubdomain(detected);
    }
  }, []);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field === 'subdomain') setSubdomain(e.target.value);
    else setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!subdomain.trim()) errs.subdomain = 'Workspace is required.';
    if (!form.email)       errs.email     = 'Email is required.';
    if (!form.password)    errs.password  = 'Password is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const response = await authService.login({ ...form, subdomain });
      toast.success(`Welcome back, ${response.user.fullName.split(' ')[0]}!`);

      if (onSubdomain) {
        // Already on the correct subdomain — set cookie here and navigate to dashboard.
        login(response);
        const redirect = searchParams.get('redirect') ?? '/dashboard';
        router.replace(redirect);
      } else {
        // On the root domain — use auth-handoff so the cookie is set on the subdomain.
        const handoff = btoa(JSON.stringify(response));
        const { protocol, hostname, port } = window.location;
        const portSuffix = port ? `:${port}` : '';
        window.location.href =
          `${protocol}//${subdomain}.${hostname}${portSuffix}/auth-handoff#${handoff}`;
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.code === 'INVALID_CREDENTIALS' || e.code === 'WORKSPACE_NOT_FOUND') {
        setErrors({ general: e.message });
      } else {
        toast.error(e.message ?? 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 px-4">
      <div className="w-full max-w-md">

        {/* Logo / heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sign in to MedLicense</h1>
          {onSubdomain ? (
            <p className="text-slate-500 mt-1 text-sm">
              Signing into workspace{' '}
              <span className="font-semibold text-primary-700">{subdomain}</span>
            </p>
          ) : (
            <p className="text-slate-500 mt-1 text-sm">Enter your workspace to continue</p>
          )}
        </div>

        <div className="card p-8">
          {errors.general && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Workspace — auto-filled badge on subdomain, editable input on root */}
            {onSubdomain ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Workspace
                </label>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                bg-primary-50 border border-primary-200 text-sm">
                  <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-semibold text-primary-800">{subdomain}</span>
                </div>
              </div>
            ) : (
              <Input
                label="Workspace"
                placeholder="your-workspace"
                value={subdomain}
                onChange={setField('subdomain')}
                error={errors.subdomain}
                helperText="e.g. 'acme' for acme.nibrasgroups.com"
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={setField('email')}
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={setField('password')}
              error={errors.password}
              required
            />

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 mt-2"
              disabled={isLoading}
            >
              {isLoading && <Spinner size="sm" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have a workspace?{' '}
            <Link href="/signup" className="text-primary-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
