import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';

/**
 * Middleware for route protection and security headers
 * Protects all routes except public ones (auth pages, landing page, API routes)
 * Applies security headers to all responses
 */
export default withAuth(
  function middleware(req) {
    const response = NextResponse.next();
    
    // Apply security headers to all responses
    return applySecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/')
        ) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
