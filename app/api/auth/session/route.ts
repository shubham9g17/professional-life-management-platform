import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/utils';

/**
 * GET /api/auth/session
 * Validate and return the current session
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: session.user,
      expires: session.expires,
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while validating session' },
      { status: 500 }
    );
  }
}
