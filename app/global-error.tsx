'use client';

/**
 * Global Error Handler
 * 
 * Catches errors at the root level of the application
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logging/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    logger.critical('Global error caught', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Something went wrong
              </h1>
              <p className="mt-2 text-gray-600">
                We apologize for the inconvenience. Our team has been notified.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg bg-red-50 p-4 text-left">
                <p className="text-sm font-semibold text-red-800">
                  Error Details (Development Only)
                </p>
                <p className="mt-2 text-xs font-mono text-red-700">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-1 text-xs text-red-600">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={reset} className="flex-1">
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
