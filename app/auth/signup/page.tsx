import { AuthForm } from '@/components/auth/auth-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | Professional Life Management',
  description: 'Create your account',
}

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="bg-grid-fade pointer-events-none absolute inset-0 -z-10"
      />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <span className="font-bold">PL</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Get started</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your Professional Life Management account
          </p>
        </div>

        <div className="rounded-[var(--card-radius)] border border-border bg-card px-6 py-8 shadow-sm sm:px-8">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  )
}
