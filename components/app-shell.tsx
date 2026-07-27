'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  Bot,
  Car,
  ChevronRight,
  Fuel,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getUserDisplayName,
  getUserInitials,
  useAuth,
} from '@/components/providers/auth-provider'
import { isAuthRoute } from '@/lib/auth-routes'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/garage', label: 'Garage', icon: Car },
  { href: '/fuel', label: 'Fuel Tracker', icon: Fuel },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/ai-mechanic', label: 'AI Mechanic', icon: Bot },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="DriveWise AI home">
      <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-lg shadow-blue-500/25">
  <div className="absolute inset-0 bg-white/10" />

  <Gauge className="relative z-10 size-5 text-white" strokeWidth={2.6} />

  <span className="absolute bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-cyan-300/80 blur-[1px]" />
</span>
      <span className="flex flex-col">
        <span className="text-base font-semibold tracking-tight text-foreground">DriveWise AI</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Vehicle Intelligence</span>
      </span>
    </Link>
  )
}

function SidebarContent({
  onNavigate,
  onLogout,
}: {
  onNavigate?: () => void
  onLogout: () => Promise<void>
}) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await onLogout()
      onNavigate?.()
    } finally {
      setLoggingOut(false)
    }
  }

  const initials = user ? getUserInitials(user) : 'U'
  const displayName = user ? getUserDisplayName(user) : 'User'

  return (
    <div className="sidebar-scroll flex h-full flex-col overflow-y-auto">
      <div className="px-5 py-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          Workspace
        </p>
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.62_0.19_258/0.2)]'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 group-hover:bg-secondary',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span>{item.label}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-3 p-3">
        <div className="glass grid-texture overflow-hidden rounded-2xl p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-foreground">Drive smarter with AI</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">3 proactive insights are ready for review.</p>
          <Link
            href="/ai-mechanic"
            onClick={onNavigate}
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-foreground"
          >
            Open mechanic <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary/15 text-foreground'
              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
          )}
        >
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </Link>

        <div className="flex items-center gap-3 border-t border-border px-2 pt-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">Pro workspace</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-60"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
            Pro
          </span>
        </div>
      </div>
    </div>
  )
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/garage')) return 'Garage'
  if (pathname.startsWith('/fuel')) return 'Fuel Tracker'
  if (pathname.startsWith('/maintenance')) return 'Maintenance'
  if (pathname.startsWith('/ai-mechanic')) return 'AI Mechanic'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Dashboard'
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div
        className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const onAuthPage = isAuthRoute(pathname)

const protectedRoutes = ['/garage', '/maintenance', '/settings']

useEffect(() => {
  if (loading) return

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!user && isProtected) {
    router.replace('/login')
    return
  }

  if (user && onAuthPage) {
    router.replace('/')
  }
}, [user, loading, pathname, onAuthPage, router])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (loading) {
    return <AuthLoadingScreen />
  }

  const isProtected = protectedRoutes.some((route) =>
  pathname.startsWith(route)
)

if (!user && isProtected) {
  return <AuthLoadingScreen />
}

  if (user && onAuthPage) {
    return <AuthLoadingScreen />
  }

  if (onAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl lg:block">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative h-full w-72 border-r border-sidebar-border bg-sidebar shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">{getPageTitle(pathname)}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Tuesday, July 26</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {searchOpen ? (
              <label className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <span className="sr-only">Search workspace</span>
                <input
                  autoFocus
                  className="h-9 w-56 rounded-xl border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  placeholder="Search workspace..."
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:flex"
              >
                <Search className="size-4" aria-hidden="true" />
                Search
                <kbd className="ml-4 rounded-md border border-border bg-background/70 px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
              </button>
            )}
            <button
              type="button"
              className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              aria-label="Notifications, 3 unread"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent ring-2 ring-background" />
            </button>
            <Link
              href="/ai-mechanic"
              className="flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-[0_6px_24px_oklch(0.62_0.19_258/0.25)] transition-transform hover:-translate-y-0.5 sm:px-4"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ask DriveWise</span>
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100dvh-4rem)] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
