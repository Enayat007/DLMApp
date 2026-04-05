'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { planApiService } from '@/lib/api/authService';
import { Spinner } from '@/components/ui/Spinner';
import type { Plan } from '@/lib/types/auth';

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    planApiService.getAll()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Start free. Scale as your team grows. No hidden fees.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map(plan => (
              <PricingCard key={plan.slug} plan={plan} />
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes, you can upgrade or downgrade at any time from your workspace settings.'
              },
              {
                q: 'What happens when I hit the doctor limit on Free?',
                a: 'You\'ll see a clear message prompting you to upgrade. Existing doctors remain accessible.'
              },
              {
                q: 'Is my data isolated from other workspaces?',
                a: 'Absolutely. Each workspace has its own tenant ID and all queries are scoped to your tenant only.'
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-6">
                <p className="font-semibold text-slate-800 mb-2">{q}</p>
                <p className="text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ plan }: { plan: Plan }) {
  return (
    <div className={clsx(
      'relative rounded-2xl border-2 p-8 flex flex-col transition-shadow hover:shadow-lg',
      plan.isPopular
        ? 'border-primary-500 bg-primary-50 shadow-md'
        : 'border-slate-200 bg-white'
    )}>
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          {plan.priceMonthly === 0 ? (
            <span className="text-4xl font-extrabold text-slate-800">Free</span>
          ) : (
            <>
              <span className="text-4xl font-extrabold text-slate-800">${plan.priceMonthly}</span>
              <span className="text-slate-400 text-sm">/month</span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {plan.doctorLimit === 'Unlimited' ? 'Unlimited doctors' : `Up to ${plan.doctorLimit} doctors`}
        </p>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
            <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={`/signup?plan=${plan.slug}`}
        className={clsx(
          'text-center py-2.5 px-6 rounded-xl font-semibold text-sm transition-colors',
          plan.isPopular
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-slate-800 text-white hover:bg-slate-700'
        )}
      >
        {plan.priceMonthly === 0 ? 'Start for Free' : `Get ${plan.name}`}
      </Link>
    </div>
  );
}
