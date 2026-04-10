'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { platformService } from '@/lib/api/platformService';
import { Spinner } from '@/components/ui/Spinner';
import type { TenantSummary } from '@/lib/types/platform';

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      isActive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/30 text-red-400'
    )}>
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Free:         'bg-slate-700 text-slate-300',
    Professional: 'bg-blue-900/40 text-blue-400',
    Enterprise:   'bg-purple-900/40 text-purple-400',
  };
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      colors[plan] ?? 'bg-slate-700 text-slate-300'
    )}>
      {plan}
    </span>
  );
}

const PLANS = ['free', 'professional', 'enterprise'];

export default function TenantsPage() {
  const [tenants,  setTenants]  = useState<TenantSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    platformService.getTenants()
      .then(setTenants)
      .catch(() => toast.error('Failed to load workspaces.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (t: TenantSummary) => {
    setActionId(t.id);
    try {
      const updated = t.isActive
        ? await platformService.suspendTenant(t.id)
        : await platformService.reactivateTenant(t.id);
      setTenants(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast.success(updated.isActive ? `${updated.name} reactivated.` : `${updated.name} suspended.`);
    } catch {
      toast.error('Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const handlePlanChange = async (t: TenantSummary, slug: string) => {
    setActionId(t.id + slug);
    try {
      const updated = await platformService.changePlan(t.id, slug);
      setTenants(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast.success(`${updated.name} moved to ${updated.planName}.`);
    } catch {
      toast.error('Failed to change plan.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
        <p className="text-slate-400 text-sm mt-1">
          {loading ? '…' : `${tenants.length} workspace${tenants.length !== 1 ? 's' : ''} registered`}
        </p>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total',     value: tenants.length },
            { label: 'Active',    value: tenants.filter(t => t.isActive).length },
            { label: 'Suspended', value: tenants.filter(t => !t.isActive).length },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                {['Workspace', 'Subdomain', 'Plan', 'Users', 'Doctors', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {tenants.map(t => {
                const busy = actionId !== null && actionId.startsWith(t.id);
                return (
                  <tr key={t.id} className={clsx('hover:bg-slate-700/30', !t.isActive && 'opacity-60')}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center
                                        text-slate-300 font-semibold text-sm flex-shrink-0">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-100">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{t.subdomain}</td>
                    <td className="px-5 py-4">
                      <select
                        value={t.planName.toLowerCase()}
                        disabled={busy}
                        onChange={e => handlePlanChange(t, e.target.value)}
                        className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-300
                                   focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      >
                        {PLANS.map(p => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{t.userCount}</td>
                    <td className="px-5 py-4 text-slate-300">{t.doctorCount}</td>
                    <td className="px-5 py-4"><StatusBadge isActive={t.isActive} /></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        disabled={busy}
                        onClick={() => handleToggle(t)}
                        className={clsx(
                          'text-xs font-medium px-3 py-1 rounded-lg transition-colors disabled:opacity-50',
                          t.isActive
                            ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
                            : 'text-green-400 hover:bg-green-900/30 hover:text-green-300'
                        )}
                      >
                        {busy ? <Spinner size="sm" /> : t.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No workspaces yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
