import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const secureToken = req.cookies.get('__Secure-next-auth.session-token');
    const normalToken = req.cookies.get('next-auth.session-token');
    const hasToken = secureToken || normalToken;

    console.log('[Middleware] Token Present:', !!hasToken);

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req }) => {
        const pathname = req.nextUrl.pathname;

        const secureToken = req.cookies.get('__Secure-next-auth.session-token');
        const normalToken = req.cookies.get('next-auth.session-token');
        const hasToken = secureToken || normalToken;

        console.log(`[Auth Check] Path: ${pathname} → Token: ${!!hasToken}`);

        if (
          pathname === '/' ||
          pathname.startsWith('/auth/')
        ) {
          return true;
        }

        return !!hasToken;
      },
    },
    pages: { signIn: '/auth/signin' },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
