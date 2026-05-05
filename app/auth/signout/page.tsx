'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Sign out page
 */
export default function SignOutPage() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sign Out
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to sign out?
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-card px-8 py-10 shadow-md">
          <div className="space-y-4">
            <Button
              onClick={handleSignOut}
              className="w-full"
              variant="destructive"
            >
              Sign Out
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="w-full"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
