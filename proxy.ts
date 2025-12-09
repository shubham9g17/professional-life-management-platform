import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 🔍 Server logs (visible in Vercel)
    console.log('[Middleware] Path:', pathname);
    console.log('[Middleware] Token Present:', !!token);

    const response = NextResponse.next();
    return applySecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Log the authorization decision
        console.log('[Auth Check] Path:', pathname, '| Token:', !!token);

        // Public routes allowed without token
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/')
        ) {
          console.log('[Auth Check] Public route → allow');
          return true;
        }

        const isAllowed = !!token;
        console.log(
          `[Auth Check] Protected route → ${isAllowed ? 'allow' : 'deny'}`
        );
        return isAllowed;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    // ❗ Excluding `/auth/*` here to prevent redirect loops
    '/((?!api|_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
