'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'There was a problem signing in. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="bg-grid-fade pointer-events-none absolute inset-0 -z-10"
      />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <AlertTriangle className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Authentication error
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{getErrorMessage(error)}</p>
        </div>

        <div className="rounded-[var(--card-radius)] border border-border bg-card px-6 py-8 shadow-sm sm:px-8">
          <Button onClick={() => (window.location.href = '/auth/signin')} className="w-full">
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
