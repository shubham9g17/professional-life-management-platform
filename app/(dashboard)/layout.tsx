import { getCurrentUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

/**
 * Dashboard layout wrapper for all protected routes
 * Applies to: /dashboard, /tasks, /habits, /finance, /fitness, /nutrition, /learning, /analytics, /integrations, /notifications
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
