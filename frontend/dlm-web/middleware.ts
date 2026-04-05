import { type NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — subdomain routing + auth guard.
 *
 * Root domain (no subdomain / www):
 *   - Serves the public marketing site (/, /pricing, /signup, /login)
 *   - Redirects any app paths (/dashboard, /doctors) back to /login
 *
 * Tenant subdomain (e.g. acme.localhost or acme.nibrasgroups.com):
 *   - Marketing paths (/, /home, /pricing) → redirect to /dashboard or /login
 *   - Public paths (/login, /signup, /auth-handoff, /api) → allowed through
 *   - Protected paths → require dlm_token cookie; redirect to /login if missing
 */

const PUBLIC_PATHS_ON_SUBDOMAIN  = ['/login', '/signup', '/auth-handoff', '/api'];
const MARKETING_PATHS_ON_SUBDOMAIN = ['/', '/home', '/pricing'];
const AUTH_COOKIE = 'dlm_token';

export function middleware(request: NextRequest) {
  const { pathname, hostname } = new URL(request.url);
  const host = request.headers.get('host') ?? hostname;

  const subdomain = extractSubdomain(host);

  // ── Root domain: marketing site ───────────────────────────────────────────────
  if (!subdomain) {
    // App paths don't exist on the root domain — send to login
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/doctors')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // ── Tenant subdomain ──────────────────────────────────────────────────────────

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  // Marketing paths have no meaning on a tenant subdomain.
  // Authenticated users → dashboard. Unauthenticated → login.
  if (MARKETING_PATHS_ON_SUBDOMAIN.includes(pathname)) {
    const dest = token ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Public subdomain paths (login, signup, auth-handoff, api) — allow through
  const isPublicPath = PUBLIC_PATHS_ON_SUBDOMAIN.some(p => pathname.startsWith(p));
  if (isPublicPath) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-subdomain', subdomain);
    return response;
  }

  // Protected: must have auth cookie
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — pass subdomain to app via header
  const response = NextResponse.next();
  response.headers.set('x-tenant-subdomain', subdomain);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractSubdomain(host: string): string | null {
  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');

  if (parts.length < 2) return null;

  const candidate = parts[0];

  const nonTenantPrefixes = new Set(['www', 'api', 'mail', 'smtp', 'ftp']);
  if (nonTenantPrefixes.has(candidate)) return null;

  // acme.localhost → ["acme", "localhost"] → valid tenant subdomain
  if (parts.length === 2 && parts[1] === 'localhost') return candidate;

  // Single label or bare "localhost" → root
  if (parts.length < 3) return null;

  // acme.nibrasgroups.com → ["acme", "nibrasgroups", "com"] → valid
  return candidate;
}
