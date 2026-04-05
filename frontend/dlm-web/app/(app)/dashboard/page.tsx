'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '@/lib/context/AuthContext';
import { doctorService } from '@/lib/api/doctorService';
import { DoctorStatus } from '@/lib/types/doctor';
import type { Doctor } from '@/lib/types/doctor';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const [doctors, setDoctors]   = useState<Doctor[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    doctorService.getAll({ pageSize: 100 })
      .then(r => setDoctors(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total     = doctors.length;
  const active    = doctors.filter(d => d.status === DoctorStatus.Active).length;
  const expired   = doctors.filter(d => d.status === DoctorStatus.Expired).length;
  const suspended = doctors.filter(d => d.status === DoctorStatus.Suspended).length;

  const recentlyExpired = doctors
    .filter(d => d.status === DoctorStatus.Expired)
    .slice(0, 5);

  const stats = [
    { label: 'Total Doctors',   value: total,     color: 'bg-slate-50  border-slate-200',  text: 'text-slate-700'  },
    { label: 'Active',          value: active,    color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    { label: 'Expired',         value: expired,   color: 'bg-red-50    border-red-200',     text: 'text-red-700'    },
    { label: 'Suspended',       value: suspended, color: 'bg-amber-50  border-amber-200',   text: 'text-amber-700'  },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.fullName.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {tenant?.name} · Here&apos;s what&apos;s happening with your licenses today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={clsx('rounded-xl border px-5 py-4', s.color)}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={clsx('text-3xl font-bold mt-1', s.text)}>
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently expired */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Expired Licenses</h2>
            <Link href="/doctors?status=Expired" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>

          {loading && <div className="flex justify-center py-8"><Spinner /></div>}

          {!loading && recentlyExpired.length === 0 && (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">All licenses are current</p>
            </div>
          )}

          {!loading && recentlyExpired.length > 0 && (
            <ul className="divide-y divide-slate-50">
              {recentlyExpired.map(d => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{d.licenseNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={d.status} />
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(d.licenseExpiryDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Plan info */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Workspace Plan</h2>
          <div className="bg-primary-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary-800 text-lg">{tenant?.planName} Plan</p>
                <p className="text-sm text-primary-600 mt-0.5">
                  {tenant?.maxDoctors === -1
                    ? 'Unlimited doctors'
                    : `${total} / ${tenant?.maxDoctors} doctors used`}
                </p>
              </div>
              <div className="text-primary-600">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            {tenant?.maxDoctors !== -1 && tenant && (
              <div className="mt-3 h-2 bg-primary-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (total / tenant.maxDoctors) * 100)}%` }}
                />
              </div>
            )}
          </div>
          <Link href="/pricing" className="btn-secondary w-full justify-center text-sm">
            View upgrade options
          </Link>
        </div>
      </div>
    </>
  );
}
