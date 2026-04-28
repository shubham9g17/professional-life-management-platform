'use client'

import { useState } from 'react'
import { Menu, ChevronDown, Settings, LogOut } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationList } from '@/components/notifications/notification-list'

interface DashboardHeaderProps {
  user: {
    id: string
    name: string
    email: string
  }
  onMenuClick?: () => void
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <span className="text-sm font-bold">PL</span>
            </div>
            <h1 className="hidden text-lg font-semibold tracking-tight md:block">
              Professional Life
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />

          <div className="relative">
            <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 z-50 md:w-96">
                  <div className="rounded-xl border border-border bg-popover shadow-lg">
                    <NotificationList onClose={() => setShowNotifications(false)} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                <span className="text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden text-sm font-medium md:block">{user.name}</span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" strokeWidth={1.75} aria-hidden="true" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg z-50"
                >
                  <div className="border-b border-border p-3">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      role="menuitem"
                      onClick={() => {
                        window.location.href = '/settings'
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      Settings
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        window.location.href = '/auth/signout'
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
