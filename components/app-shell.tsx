'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bot,
  Car,
  ChevronRight,
  Fuel,
  LayoutDashboard,
  LogOut,
  Menu,
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
      <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-blue-500/25">
        <img src="/drivewise-logo.png.png" alt="" className="size-full object-contain" />
      </span>
      <span className="flex flex-col">
        <span className="text-base font-semibold tracking-tight text-foreground">DriveWise AI</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Vehicle Intelligence</span>
      </span>
    </Link>
  )
}



function TopNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {navItems.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-secondary/80 text-primary font-medium'
                : 'text-slate-400 hover:bg-secondary/50 hover:text-slate-50'
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}

function MobileMenu({ onNavigate, onLogout }: { onNavigate: () => void, onLogout: () => Promise<void> }) {
  const { user } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const initials = user ? getUserInitials(user) : 'U'
  const displayName = user ? getUserDisplayName(user) : 'User'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await onLogout()
      onNavigate()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-sidebar">
      <div className="px-5 py-6 border-b border-border">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-4">
        <TopNavLinks onNavigate={onNavigate} />
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-secondary/50 hover:text-slate-50"
        >
          <Settings className="size-4" />
          <span>Settings</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          ) : (
            <Link href="/login" onClick={onNavigate} className="text-sm font-medium text-primary">Sign in</Link>
          )}
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
  const onAuthPage = isAuthRoute(pathname)

  const protectedRoutes = ['/garage', '/fuel', '/maintenance', '/settings']

  useEffect(() => {
    if (loading) return
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
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

  if (loading) return <AuthLoadingScreen />

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  if (!user && isProtected) return <AuthLoadingScreen />
  if (user && onAuthPage) return <AuthLoadingScreen />

  if (onAuthPage) return <>{children}</>

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Mobile Menu */}
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
            >
              <X className="size-5" />
            </button>
            <MobileMenu onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden lg:flex">
            <Logo />
          </div>

          {/* Mobile Page Title */}
          <div className="lg:hidden">
            <p className="text-sm font-semibold text-foreground sm:text-base">{getPageTitle(pathname)}</p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <TopNavLinks />
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/ai-mechanic"
            className="flex h-9 items-center gap-2 rounded-full bg-blue-600 px-4 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all hover:bg-blue-500"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ask DriveWise</span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 border-l border-border pl-3">
            <Link
              href="/settings"
              className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-secondary/50 hover:text-slate-50 transition-colors"
              aria-label="Settings"
            >
              <Settings className="size-4" />
            </Link>
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-secondary/50 hover:text-slate-50 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            )}
            {user && (
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary ml-1">
                {getUserInitials(user)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100dvh-4rem)] p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
