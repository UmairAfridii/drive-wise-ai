'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Car, Fuel, Gauge, Sparkles, Wallet } from 'lucide-react'
import { ActionLink, MiniBars, ProgressBar, SectionTitle, StatCard, StatusPill } from '@/components/dashboard-ui'
import { getUserDisplayName, useAuth } from '@/components/providers/auth-provider'
import { getFuelEntries, type FuelEntry } from '@/lib/fuel'
import { getVehicles, type Vehicle } from '@/lib/garage'

const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const rupees = (value: number) => `Rs ${Math.round(value).toLocaleString()}`
let hasShownIntroInCurrentRuntime = false

function getDashboardStats(vehicles: Vehicle[], fuel: FuelEntry[]) {
  const now = new Date()
  const year = now.getFullYear()
  const currentMonth = now.getMonth()
  const spend = Array<number>(12).fill(0)
  let volume = 0

  for (const entry of fuel) {
    const date = new Date(`${entry.date}T00:00:00`)
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) continue
    spend[date.getMonth()] += entry.cost
    if (date.getMonth() === currentMonth) volume += entry.liters
  }

  const healthValues = vehicles.flatMap((vehicle) => typeof vehicle.health === 'number' ? [vehicle.health] : [])
  const maximum = Math.max(...spend, 0)
  return {
    chart: spend.map((value) => maximum ? Math.max(4, value / maximum * 100) : 0),
    monthTotal: spend[currentMonth],
    volume,
    averageHealth: healthValues.length ? Math.round(healthValues.reduce((sum, health) => sum + health, 0) / healthValues.length) : null,
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuel, setFuel] = useState<FuelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [introState, setIntroState] = useState<'checking' | 'visible' | 'leaving' | 'hidden'>('checking')
  const introHasInitialized = useRef(false)

  useEffect(() => {
    if (!introHasInitialized.current) {
      introHasInitialized.current = true
      if (hasShownIntroInCurrentRuntime) {
        setIntroState('hidden')
        return
      }
      hasShownIntroInCurrentRuntime = true
    }

    setIntroState('visible')
    const leaveTimer = window.setTimeout(() => setIntroState('leaving'), 2200)
    const hideTimer = window.setTimeout(() => setIntroState('hidden'), 2600)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  const load = useCallback(async () => {
    if (!user) { setVehicles([]); setFuel([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const [garage, entries] = await Promise.all([getVehicles(user.uid), getFuelEntries(user.uid)])
      setVehicles(garage); setFuel(entries)
    } catch (reason) {
      console.error('Failed to load dashboard data:', reason)
      setError('Unable to load your dashboard data. Please try again.')
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => { void load() }, [load])
  const stats = useMemo(() => getDashboardStats(vehicles, fuel), [fuel, vehicles])

  if (introState === 'checking') return null
  if (introState !== 'hidden') return <FirstVisitIntro leaving={introState === 'leaving'} />

  return <div className="mx-auto flex max-w-7xl flex-col gap-8">
    <section className="glass-strong grid-texture animate-rise relative overflow-hidden rounded-3xl p-6 sm:p-8"><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"><Sparkles className="size-3.5" /> Workspace overview</span><h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, <span className="text-gradient">{user ? getUserDisplayName(user) : 'Driver'}</span></h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your live Garage and Fuel Tracker data is summarized here.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/fuel" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Fuel className="size-4" /> Add fuel log</Link><Link href="/garage" className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground">View garage <ArrowRight className="size-4" /></Link></div></div><div className="glass w-full shrink-0 rounded-2xl p-5 lg:w-64"><p className="text-xs font-medium text-muted-foreground">Overall fleet health</p><div className="mt-2 flex items-end gap-2"><span className="text-3xl font-semibold tracking-tight text-foreground">{stats.averageHealth ?? 'Not available'}</span>{stats.averageHealth !== null && <span className="mb-1 text-sm text-success">/ 100</span>}</div>{stats.averageHealth !== null && <div className="mt-4"><ProgressBar value={stats.averageHealth} tone="primary" /></div>}<div className="mt-4 text-[11px] text-muted-foreground">{vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} in your garage</div></div></div></section>
    {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading dashboard...</p> : <>{error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold">Retry</button></div>}<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Vehicles" value={String(vehicles.length)} detail="In your garage" icon={Car} delay={0} /><StatCard label="Fuel spend (this month)" value={rupees(stats.monthTotal)} detail="From your fuel logs" icon={Fuel} delay={60} /><StatCard label="Fuel volume" value={`${stats.volume.toFixed(1)} L`} detail="This month" icon={Gauge} delay={120} /><StatCard label="Fuel logs" value={String(fuel.length)} detail="All vehicles" icon={Wallet} delay={180} /></section><div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><section className="glass animate-rise rounded-2xl p-5 sm:p-6 lg:col-span-2"><SectionTitle title="Fuel analytics" description={`Monthly spend across all vehicles in ${new Date().getFullYear()}`} action={<StatusPill tone="accent">Live data</StatusPill>} /><div className="mt-6"><MiniBars values={stats.chart} highlight={new Date().getMonth()} height="h-40" /><div className="mt-2 flex justify-between px-0.5 text-[10px] font-medium text-muted-foreground">{months.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}</div></div></section><section className="glass animate-rise rounded-2xl p-5 sm:p-6"><SectionTitle title="Vehicle overview" description="Health and status at a glance" action={<Link href="/garage"><ActionLink>All vehicles</ActionLink></Link>} /><div className="mt-5 flex flex-col gap-3">{vehicles.slice(0, 4).map((vehicle) => <Link href="/garage" key={vehicle.id} className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-3.5 transition-colors hover:border-primary/25"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary"><Car className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-foreground">{vehicle.make} {vehicle.model}</p><StatusPill tone={vehicle.status === 'Excellent' ? 'success' : vehicle.status === 'Good' ? 'accent' : 'warning'}>{vehicle.status ?? 'Not assessed'}</StatusPill></div><p className="truncate text-xs text-muted-foreground">{vehicle.year} · {vehicle.mileage.toLocaleString()} km{vehicle.nextService ? ` · Next service: ${vehicle.nextService}` : ''}</p>{typeof vehicle.health === 'number' && <p className="mt-1 text-[11px] text-muted-foreground">Health: {vehicle.health}/100</p>}</div></Link>)}{!vehicles.length && <div className="py-8 text-center text-xs text-muted-foreground">Add a vehicle to your Garage to see it here.</div>}</div></section></div></>}</div>
}

function FirstVisitIntro({ leaving }: { leaving: boolean }) {
  return <div className={`fixed inset-0 z-[60] flex h-dvh w-screen items-center justify-center overflow-hidden bg-background px-4 transition-all duration-500 motion-reduce:transition-none ${leaving ? 'scale-[1.02] opacity-0' : 'scale-100 opacity-100'}`}>
    <div className="grid-texture absolute inset-0 opacity-60" aria-hidden="true" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.62_0.19_258_/_0.18),transparent_38%),radial-gradient(circle_at_78%_22%,oklch(0.72_0.15_215_/_0.12),transparent_30%)]" aria-hidden="true" />
    <div className="relative w-full max-w-xl text-center">
      <div className="intro-logo mx-auto flex size-32 items-center justify-center rounded-3xl bg-primary/10 shadow-[0_0_72px_oklch(0.62_0.19_258_/_0.3)] ring-1 ring-primary/20 sm:size-36"><img src="/drivewise-logo.png.png" alt="DriveWise AI" className="size-24 object-contain sm:size-28" /></div>
      <div className="intro-copy"><h1 className="mt-7 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">DriveWise AI</h1><p className="mt-3 text-base font-medium text-primary sm:text-lg">Drive smarter. Maintain better.</p><p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Manage your vehicles, track fuel, stay ahead of maintenance, and get AI-powered automotive guidance — all in one place.</p></div>
    </div>
  </div>
}
