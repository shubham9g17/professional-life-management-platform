'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/responsive'

export interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ResponsiveLayout({
  children,
  sidebar,
  header,
  footer,
  className,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          {header}
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border">
              <div className="flex-1 overflow-y-auto p-4">
                {sidebar}
              </div>
            </aside>

            {/* Mobile sidebar */}
            {isMobile && sidebarOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/50 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card md:hidden">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-2 hover:bg-accent"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {sidebar}
                    </div>
                  </div>
                </aside>
              </>
            )}
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-border bg-card">
          {footer}
        </footer>
      )}
    </div>
  )
}

export interface TwoColumnLayoutProps {
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
}

export function TwoColumnLayout({
  children,
  aside,
  className,
}: TwoColumnLayoutProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-[1fr_300px]', className)}>
      <div>{children}</div>
      {aside && (
        <aside className="hidden lg:block">
          <div className="sticky top-20">{aside}</div>
        </aside>
      )}
    </div>
  )
}

export interface ThreeColumnLayoutProps {
  children: React.ReactNode
  leftAside?: React.ReactNode
  rightAside?: React.ReactNode
  className?: string
}

export function ThreeColumnLayout({
  children,
  leftAside,
  rightAside,
  className,
}: ThreeColumnLayoutProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-[250px_1fr_250px]', className)}>
      {leftAside && (
        <aside className="hidden lg:block">
          <div className="sticky top-20">{leftAside}</div>
        </aside>
      )}
      <div>{children}</div>
      {rightAside && (
        <aside className="hidden lg:block">
          <div className="sticky top-20">{rightAside}</div>
        </aside>
      )}
    </div>
  )
}
