'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { usePlatformAuth } from '@/lib/context/PlatformAuthContext';

function PlatformSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { adminName, adminEmail, logout } = usePlatformAuth();

  const handleLogout = () => {
    logout();
    router.push('/platform/login');
  };

  const navItems = [
    {
      href: '/platform/tenants',
      label: 'Workspaces',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Platform Admin</p>
            <p className="text-xs text-slate-400">Super Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <span className={active ? 'text-red-400' : 'text-slate-500'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center text-sm font-medium text-red-400 flex-shrink-0">
            {adminName?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{adminName}</p>
            <p className="text-xs text-slate-500 truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-red-400
                     hover:bg-slate-800 px-2 py-1.5 rounded-lg transition-colors"
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

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePlatformAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/platform/login') {
      router.replace('/platform/login');
    }
  }, [isAuthenticated, pathname, router]);

  // Login page renders without sidebar
  if (pathname === '/platform/login') return <>{children}</>;

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <PlatformSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
