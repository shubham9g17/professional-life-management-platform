'use client';

/**
 * API Error Display Component
 * 
 * User-friendly display for API errors with retry functionality
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ApiErrorDisplayProps {
  error: {
    message: string;
    code?: string;
    statusCode?: number;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Display API errors with user-friendly messages
 */
export function ApiErrorDisplay({ error, onRetry, onDismiss }: ApiErrorDisplayProps) {
  const getUserFriendlyMessage = (statusCode?: number, message?: string) => {
    if (statusCode === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }
    if (statusCode && statusCode >= 500) {
      return 'A server error occurred. Please try again.';
    }
    return message || 'An unexpected error occurred.';
  };

  return (
    <Card className="border-red-200 bg-red-50 p-4">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">
              {getUserFriendlyMessage(error.statusCode, error.message)}
            </p>
            {process.env.NODE_ENV === 'development' && error.code && (
              <p className="mt-1 text-xs text-red-600">Code: {error.code}</p>
            )}
          </div>
        </div>

        {(onRetry || onDismiss) && (
          <div className="flex gap-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
