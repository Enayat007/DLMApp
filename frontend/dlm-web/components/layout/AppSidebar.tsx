'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/context/AuthContext';

const NAV_ITEMS = [
  {
    href:      '/dashboard',
    label:     'Dashboard',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href:      '/doctors',
    label:     'Doctors',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href:      '/settings/users',
    label:     'Team',
    adminOnly: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, tenant, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col min-h-screen">
      {/* Workspace header */}
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
               style={{ backgroundColor: tenant?.primaryColor ?? '#0d9488' }}>
            {tenant?.name?.charAt(0).toUpperCase() ?? 'W'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{tenant?.name ?? 'Workspace'}</p>
            <p className="text-xs text-slate-400 truncate">{tenant?.subdomain}.nibrasgroups.com</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <span className={active ? 'text-primary-600' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      {tenant && (
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Plan</span>
            <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {tenant.planName}
            </span>
          </div>
          {tenant.maxDoctors !== -1 && (
            <p className="text-xs text-slate-400 mt-1">Up to {tenant.maxDoctors} doctors</p>
          )}
        </div>
      )}

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
            {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{isAdmin ? 'Admin' : 'Viewer'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-red-600
                     hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
