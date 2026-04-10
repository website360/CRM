import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/registro', '/onboarding', '/demo', '/api/auth', '/api/widget', '/api/webhook', '/api/leads', '/api/whatsapp-click', '/api/org/plans', '/api/stripe/webhook', '/api/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and static files
  if (publicRoutes.some((r) => pathname.startsWith(r)) || pathname.startsWith('/_next') || pathname.startsWith('/uploads') || pathname === '/widget.js' || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login for page requests
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|widget.js).*)'],
};
