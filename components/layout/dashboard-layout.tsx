'use client'

import { useState } from 'react'
import { DashboardHeader } from './dashboard-header'
import { DashboardSidebar } from './dashboard-sidebar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    name: string
    email: string
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card/40">
          <div className="sticky top-0 flex-1 overflow-y-auto p-4">
            <DashboardSidebar />
          </div>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4" onClick={() => setSidebarOpen(false)}>
              <DashboardSidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="w-full p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
