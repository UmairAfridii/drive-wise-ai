'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Car, Fuel, Gauge, Sparkles, Wallet } from 'lucide-react'
import { ActionLink, MiniBars, PageHeading, ProgressBar, SectionTitle, StatCard, StatusPill } from '@/components/dashboard-ui'
import { useAuth, getUserDisplayName } from '@/components/providers/auth-provider'
import { getFuelEntries, type FuelEntry } from '@/lib/fuel'
import { getVehicles, type Vehicle } from '@/lib/garage'

const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const rupees = (value: number) => `Rs ${Math.round(value).toLocaleString()}`

export default function DashboardPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuel, setFuel] = useState<FuelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { if (!user) { setLoading(false); return }; try { const [garage, entries] = await Promise.all([getVehicles(user.uid), getFuelEntries(user.uid)]); setVehicles(garage); setFuel(entries) } finally { setLoading(false) } }, [user])
  useEffect(() => {
  void load();
}, [load]);
  const stats = useMemo(() => {
 const year = new Date().getFullYear(), currentMonth = new Date().getMonth(), spend = Array(12).fill(0); for (const entry of fuel) { const date = new Date(`${entry.date}T00:00:00`); if (date.getFullYear() === year) spend[date.getMonth()] += entry.cost }; const max = Math.max(...spend, 0), monthTotal = spend[currentMonth], volume = fuel.filter((entry) => { const date = new Date(`${entry.date}T00:00:00`); return date.getFullYear() === year && date.getMonth() === currentMonth }).reduce((sum, entry) => sum + entry.liters, 0); return { spend, chart: spend.map((value) => max ? Math.max(4, value / max * 100) : 0), monthTotal, volume, averageHealth: vehicles.length ? Math.round(vehicles.reduce((sum, vehicle) => sum + vehicle.health, 0) / vehicles.length) : 0 } }, [fuel, vehicles])
  return <div 
className="mx-auto flex max-w-7xl flex-col gap-8">
<section 
className="glass-strong grid-texture animate-rise relative overflow-hidden rounded-3xl p-6 sm:p-8">
<div 
className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
<div 
className="max-w-xl">
<span 
className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
<Sparkles 
className="size-3.5" /> Workspace overview</span>
<h1 
className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, <span 
className="text-gradient">{user ? getUserDisplayName(user) : 'Driver'}</span>
</h1>
<p 
className="mt-2 text-sm leading-relaxed text-muted-foreground">Your live Garage and Fuel Tracker data is summarized here.</p>
<div 
className="mt-5 flex flex-wrap gap-3">
<Link href="/fuel" 
className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
<Fuel 
className="size-4" /> Add fuel log</Link>
<Link href="/garage" 
className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground">View garage <ArrowRight 
className="size-4" />
</Link>
</div>
</div>
<div 
className="glass w-full shrink-0 rounded-2xl p-5 lg:w-64">
<p 
className="text-xs font-medium text-muted-foreground">Overall fleet health</p>
<div 
className="mt-2 flex items-end gap-2">
<span 
className="text-4xl font-semibold tracking-tight text-foreground">{stats.averageHealth}</span>
<span 
className="mb-1 text-sm text-success">/ 100</span>
</div>
<div 
className="mt-4">
<ProgressBar value={stats.averageHealth} tone="primary" />
</div>
<div 
className="mt-4 text-[11px] text-muted-foreground">{vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} in your garage</div>
</div>
</div>
</section>
{loading ? <p 
className="py-10 text-center text-sm text-muted-foreground">Loading dashboard...</p> : <>
<section 
className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
<StatCard label="Vehicles" value={String(vehicles.length)} detail="In your garage" icon={Car} delay={0} />
<StatCard label="Fuel spend (this month)" value={rupees(stats.monthTotal)} detail="From your fuel logs" icon={Fuel} delay={60} />
<StatCard label="Fuel volume" value={`${stats.volume.toFixed(1)} L`} detail="This month" icon={Gauge} delay={120} />
<StatCard label="Fuel logs" value={String(fuel.length)} detail="All vehicles" icon={Wallet} delay={180} />
</section>
<div 
className="grid grid-cols-1 gap-6 lg:grid-cols-3">
<section 
className="glass animate-rise rounded-2xl p-5 sm:p-6 lg:col-span-2">
<SectionTitle title="Fuel analytics" description={`Monthly spend across all vehicles in ${new Date().getFullYear()}`} action={<StatusPill tone="accent">Live data</StatusPill>} />
<div 
className="mt-6">
<MiniBars values={stats.chart} highlight={new Date().getMonth()} height="h-40" />
<div 
className="mt-2 flex justify-between px-0.5 text-[10px] font-medium text-muted-foreground">{months.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}</div>
</div>
</section>
<section 
className="glass animate-rise rounded-2xl p-5 sm:p-6">
<SectionTitle title="Vehicle overview" description="Health and status at a glance" action={<Link href="/garage">
<ActionLink>All vehicles</ActionLink>
</Link>} />
<div 
className="mt-5 flex flex-col gap-3">{vehicles.slice(0, 4).map((vehicle) => <div key={vehicle.id} 
className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-3.5">
<div 
className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
<Car 
className="size-5" />
</div>
<div 
className="min-w-0 flex-1">
<div 
className="flex items-center gap-2">
<p 
className="truncate text-sm font-semibold text-foreground">{vehicle.make} {vehicle.model}</p>
<StatusPill tone={vehicle.status === 'Excellent' ? 'success' : vehicle.status === 'Good' ? 'accent' : 'warning'}>{vehicle.status}</StatusPill>
</div>
<p 
className="truncate text-xs text-muted-foreground">{vehicle.plate} · {vehicle.mileage.toLocaleString()} km</p>
</div>
</div>)}{!vehicles.length && <p 
className="py-8 text-center text-xs text-muted-foreground">Add a vehicle to your Garage to see it here.</p>}</div>
</section>
</div>
</>}</div>
}
