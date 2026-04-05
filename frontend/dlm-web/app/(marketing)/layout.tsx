import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Marketing nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-lg">MedLicense</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/pricing" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="btn-secondary text-sm">Sign In</Link>
              <Link href="/signup" className="btn-primary text-sm">Get Started Free</Link>
            </nav>

            {/* Mobile */}
            <div className="flex md:hidden gap-2">
              <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
              <Link href="/signup" className="btn-primary text-sm">Start Free</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 MedLicense. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/pricing" className="hover:text-slate-600">Pricing</Link>
            <Link href="/signup" className="hover:text-slate-600">Sign Up</Link>
            <Link href="/login" className="hover:text-slate-600">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
