import { type NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — subdomain routing + auth guard.
 *
 * admin.* subdomain:
 *   - Rewrites all paths to /platform/* so the (platform) route group is served
 *   - Guards protected pages with dlm_platform_token cookie
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

const PUBLIC_PATHS_ON_SUBDOMAIN    = ['/login', '/signup', '/auth-handoff', '/api'];
const MARKETING_PATHS_ON_SUBDOMAIN = ['/', '/home', '/pricing'];
const AUTH_COOKIE                  = 'dlm_token';
const PLATFORM_COOKIE              = 'dlm_platform_token';

export function middleware(request: NextRequest) {
  const { pathname, hostname } = new URL(request.url);
  const host = request.headers.get('host') ?? hostname;

  const subdomain = extractSubdomain(host);

  // ── Platform admin subdomain (admin.*) ────────────────────────────────────────
  if (subdomain === 'admin') {
    // Rewrite: /anything → /platform/anything so (platform) route group is served
    const rewrittenPath = pathname.startsWith('/platform')
      ? pathname
      : `/platform${pathname === '/' ? '/tenants' : pathname}`;

    const platformToken = request.cookies.get(PLATFORM_COOKIE)?.value;
    const isLoginPath   = rewrittenPath === '/platform/login';

    if (!platformToken && !isLoginPath) {
      return NextResponse.redirect(new URL('/platform/login', request.url));
    }
    if (platformToken && isLoginPath) {
      return NextResponse.redirect(new URL('/platform/tenants', request.url));
    }

    return NextResponse.rewrite(new URL(rewrittenPath, request.url));
  }

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

  // 'admin' is a reserved subdomain — return it so the admin branch handles it
  if (candidate === 'admin') return 'admin';

  const nonTenantPrefixes = new Set(['www', 'api', 'mail', 'smtp', 'ftp']);
  if (nonTenantPrefixes.has(candidate)) return null;

  // acme.localhost → ["acme", "localhost"] → valid tenant subdomain
  if (parts.length === 2 && parts[1] === 'localhost') return candidate;

  // Single label or bare "localhost" → root
  if (parts.length < 3) return null;

  // acme.nibrasgroups.com → ["acme", "nibrasgroups", "com"] → valid
  return candidate;
}
