import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * NextAuth API route handler
 * Handles all authentication endpoints:
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
