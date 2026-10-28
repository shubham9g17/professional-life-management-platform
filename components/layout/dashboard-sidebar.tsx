'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Wallet,
  Dumbbell,
  Apple,
  GraduationCap,
  LineChart,
  Plug,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Habits', href: '/habits', icon: Repeat },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Fitness', href: '/fitness', icon: Dumbbell },
  { name: 'Nutrition', href: '/nutrition', icon: Apple },
  { name: 'Learning', href: '/learning', icon: GraduationCap },
  { name: 'Analytics', href: '/analytics', icon: LineChart },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1" aria-label="Primary">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
              'transition-colors duration-150',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary"
              />
            )}
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
