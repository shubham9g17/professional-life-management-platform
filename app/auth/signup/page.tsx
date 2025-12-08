import { AuthForm } from '@/components/auth/auth-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Professional Life Management',
  description: 'Create your account',
};

/**
 * Sign up page
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Get Started
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your Professional Life Management account
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white px-8 py-10 shadow-md">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}
