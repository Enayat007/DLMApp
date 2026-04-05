'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { authService, planApiService, type ApiError } from '@/lib/api/authService';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { Plan } from '@/lib/types/auth';

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = ['Your Details', 'Workspace', 'Choose Plan'];

interface FormState {
  firstName:     string;
  lastName:      string;
  email:         string;
  password:      string;
  workspaceName: string;
  subdomain:     string;
  planSlug:      string;
}

function SignupForm() {
  const searchParams = useSearchParams();
  const [step, setStep]         = useState(0);
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [isLoading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName:     '',
    lastName:      '',
    email:         '',
    password:      '',
    workspaceName: '',
    subdomain:     '',
    planSlug:      searchParams.get('plan') ?? 'free',
  });

  const [errors, setErrors] = useState<Partial<FormState> & { general?: string }>({});

  // Load plans for step 3
  useEffect(() => {
    planApiService.getAll().then(setPlans).catch(() => {});
  }, []);

  // Auto-generate subdomain from workspace name
  useEffect(() => {
    if (form.workspaceName && !form.subdomain) {
      const slug = form.workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 50);
      setForm(p => ({ ...p, subdomain: slug }));
    }
  }, [form.workspaceName]);  // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
  };

  // Per-step validation
  const validate = (): boolean => {
    const errs: Partial<FormState> = {};

    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = 'First name is required.';
      if (!form.lastName.trim())  errs.lastName  = 'Last name is required.';
      if (!form.email.trim())     errs.email     = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
      if (!form.password)         errs.password  = 'Password is required.';
      else if (form.password.length < 8) errs.password = 'At least 8 characters.';
      else if (!/[A-Z]/.test(form.password)) errs.password = 'Include at least one uppercase letter.';
      else if (!/[0-9]/.test(form.password)) errs.password = 'Include at least one number.';
    }

    if (step === 1) {
      if (!form.workspaceName.trim()) errs.workspaceName = 'Workspace name is required.';
      if (!form.subdomain.trim())     errs.subdomain     = 'Subdomain is required.';
      else if (!/^[a-z][a-z0-9-]{1,98}[a-z0-9]$/.test(form.subdomain))
        errs.subdomain = 'Lowercase letters, digits, and hyphens only.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authService.register(form);
      toast.success('Workspace created! Welcome aboard.');

      // Pass the full auth response to the subdomain via URL hash (not query param,
      // to avoid it appearing in browser history after the handoff page clears it).
      // The /auth-handoff page on the subdomain decodes it, sets the cookie there,
      // and redirects to /dashboard — fixing the cross-subdomain cookie restriction.
      const handoff = btoa(JSON.stringify(response));
      const { hostname, protocol, port } = window.location;
      const portSuffix = port ? `:${port}` : '';
      const subdomainHost = `${form.subdomain}.${hostname}${portSuffix}`;
      window.location.href = `${protocol}//${subdomainHost}/auth-handoff#${handoff}`;
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.code === 'SUBDOMAIN_TAKEN') {
        setStep(1);
        setErrors({ subdomain: e.message });
      } else if (e.errors) {
        const mapped: Partial<FormState> = {};
        for (const [key, msgs] of Object.entries(e.errors)) {
          const k = key.charAt(0).toLowerCase() + key.slice(1) as keyof FormState;
          mapped[k] = (msgs as string[])[0];
        }
        setErrors(mapped);
      } else {
        setErrors({ general: e.message ?? 'Registration failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create your workspace</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors',
                  i < step  ? 'bg-primary-600 text-white'
                  : i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                              : 'bg-slate-100 text-slate-400'
                )}>
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={clsx(
                  'text-xs font-medium hidden sm:block',
                  i === step ? 'text-primary-700' : 'text-slate-400'
                )}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx(
                  'flex-1 h-px mx-2',
                  i < step ? 'bg-primary-400' : 'bg-slate-200'
                )} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card p-8 space-y-5">
            {errors.general && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* Step 0: User details */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="Jane" value={form.firstName}
                    onChange={set('firstName')} error={errors.firstName} required />
                  <Input label="Last Name" placeholder="Smith" value={form.lastName}
                    onChange={set('lastName')} error={errors.lastName} required />
                </div>
                <Input label="Email" type="email" placeholder="jane@hospital.org"
                  value={form.email} onChange={set('email')} error={errors.email} required />
                <Input label="Password" type="password" placeholder="••••••••"
                  value={form.password} onChange={set('password')} error={errors.password}
                  helperText="Min 8 chars, 1 uppercase, 1 number." required />
              </>
            )}

            {/* Step 1: Workspace */}
            {step === 1 && (
              <>
                <Input label="Workspace Name" placeholder="Acme Medical Center"
                  value={form.workspaceName} onChange={set('workspaceName')}
                  error={errors.workspaceName} required />
                <div>
                  <Input label="Subdomain" placeholder="acme"
                    value={form.subdomain} onChange={set('subdomain')}
                    error={errors.subdomain} required />
                  {form.subdomain && !errors.subdomain && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Your workspace will be at{' '}
                      <span className="font-medium text-primary-700">
                        {form.subdomain}.nibrasgroups.com
                      </span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Plan */}
            {step === 2 && (
              <div className="space-y-3">
                {plans.length === 0 && (
                  <div className="text-center py-4"><Spinner /></div>
                )}
                {plans.map(plan => (
                  <label
                    key={plan.slug}
                    className={clsx(
                      'relative flex items-start gap-4 rounded-xl border-2 px-4 py-4 cursor-pointer transition-colors',
                      form.planSlug === plan.slug
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.slug}
                      checked={form.planSlug === plan.slug}
                      onChange={set('planSlug')}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{plan.name}</span>
                        {plan.isPopular && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {plan.priceDisplay} · {plan.doctorLimit} doctors
                      </p>
                    </div>
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      form.planSlug === plan.slug
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-slate-300'
                    )}>
                      {form.planSlug === plan.slug && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <button type="button" onClick={back} className="btn-secondary">
                Back
              </button>
            ) : (
              <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
                Already have a workspace?
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary">
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading && <Spinner size="sm" />}
                Create Workspace
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
