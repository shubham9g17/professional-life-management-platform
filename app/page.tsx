import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Redirect to dashboard if already authenticated
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center justify-center gap-8 p-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Professional Life Management Platform
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Enterprise-grade productivity and wellness application for working professionals.
          Manage tasks, track habits, monitor finances, and achieve your goals with data-driven insights.
        </p>
        <div className="flex gap-4">
          <a
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="rounded-md border border-border bg-card px-6 py-3 text-foreground font-medium hover:bg-muted transition-colors"
          >
            Sign Up
          </a>
        </div>
      </main>
    </div>
  );
}
