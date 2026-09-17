'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Car, Fuel, Gauge, Sparkles, Wallet, Wrench } from 'lucide-react'
import { ActionLink, MiniBars, SectionTitle, StatCard, StatusPill } from '@/components/dashboard-ui'
import { getUserDisplayName, useAuth } from '@/components/providers/auth-provider'
import { getFuelEntries, type FuelEntry } from '@/lib/fuel'
import { getVehicles, type Vehicle } from '@/lib/garage'
import { getMaintenanceRecords, type MaintenanceRecord } from '@/lib/maintenance'
import { BrandLogo } from '@/lib/vehicle-icons'
import { Card, CardContent } from '@/components/ui/card'

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

  const maximum = Math.max(...spend, 0)
  return {
    chart: spend.map((value) => (maximum ? Math.max(4, (value / maximum) * 100) : 0)),
    monthTotal: spend[currentMonth],
    volume,
  }
}

const CAR_TIPS = [
  "Check your tire pressure regularly. Proper tire pressure helps maintain handling, tire life, and fuel efficiency.",
  "Check your engine oil level using the dipstick at least once a month. Clean, proper oil levels are crucial for engine longevity.",
  "Inspect your coolant level when the engine is cool. A properly functioning cooling system prevents overheating.",
  "Listen to your brakes. A squealing or grinding noise is a sign that your brake pads need replacement.",
  "Check your battery terminals for corrosion. A clean connection ensures reliable starting and charging.",
  "Replace your engine air filter annually or as recommended. A clean filter improves acceleration and efficiency.",
  "Monitor your tire tread depth using the coin test. Worn tires significantly increase stopping distance in the rain.",
  "Keep your windshield washer fluid topped up, especially during dusty or muddy seasons.",
  "Regularly check that all exterior lights—headlights, taillights, and turn signals—are functioning properly.",
  "Avoid harsh acceleration and hard braking. Smooth driving can improve your fuel efficiency by up to 20%.",
  "Don't ignore the check engine light. Having it scanned early can prevent a minor issue from becoming a major repair.",
  "Follow the severe service maintenance schedule if you frequently drive in stop-and-go traffic or dusty environments."
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuel, setFuel] = useState<FuelEntry[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
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
    if (!user) {
      setVehicles([])
      setFuel([])
      setMaintenance([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [garage, entries, serviceRecords] = await Promise.all([
        getVehicles(user.uid),
        getFuelEntries(user.uid),
        getMaintenanceRecords(user.uid),
      ])
      setVehicles(garage)
      setFuel(entries)
      setMaintenance(serviceRecords)
    } catch (reason) {
      console.error('Failed to load dashboard data:', reason)
      setError('Unable to load your dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => getDashboardStats(vehicles, fuel), [fuel, vehicles])

  if (introState === 'checking') return null
  if (introState !== 'hidden') return <FirstVisitIntro leaving={introState === 'leaving'} />

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {/* ── Welcome Hero ── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md sm:p-8 animate-rise grid-texture">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-500">
              <Sparkles className="size-3.5" /> Workspace overview
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl text-slate-100">
              Welcome, <span className="text-blue-400">{user ? getUserDisplayName(user) : 'Driver'}</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Your live Garage, Fuel Tracker, and Service data is summarized here.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/fuel"
                className="flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
              >
                <Fuel className="size-4" /> Add fuel log
              </Link>
              <Link
                href="/garage"
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-transparent px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                View garage <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm lg:w-72">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Fleet Snapshot
              </p>
              <StatusPill tone="accent">Live</StatusPill>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-50">
                {vehicles.length}
              </span>
              <span className="text-xs text-slate-400">
                {vehicles.length === 1 ? 'vehicle registered' : 'vehicles registered'}
              </span>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-slate-800 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">This month fuel</span>
                <span className="font-semibold font-mono text-slate-100">{rupees(stats.monthTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fuel logs</span>
                <span className="font-semibold text-slate-100">{fuel.length} fill-ups</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Service records</span>
                <span className="font-semibold text-slate-100">{maintenance.length} entries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading dashboard...</p>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <span>{error}</span>
              <button type="button" onClick={() => void load()} className="font-semibold underline">
                Retry
              </button>
            </div>
          )}

          {/* ── 4 Stat Cards ── */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Vehicles" value={String(vehicles.length)} detail="In your garage" icon={Car} delay={0} />
            <StatCard label="Fuel spend (this month)" value={rupees(stats.monthTotal)} detail="From your fuel logs" icon={Fuel} delay={60} />
            <StatCard label="Fuel logs" value={String(fuel.length)} detail="All vehicles" icon={Wallet} delay={120} />
            <StatCard label="Service records" value={String(maintenance.length)} detail="Maintenance logs" icon={Wrench} delay={180} />
          </section>

          {/* ── Main Dashboard Content ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Card className="animate-rise relative overflow-hidden grid-texture">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-slate-100">Car Travelling Dua</h2>
                      <p className="text-sm text-slate-400">Traveling Supplication</p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                      <Car className="size-5" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="text-xl sm:text-2xl font-semibold leading-relaxed text-blue-400" dir="rtl" lang="ar">
                      اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ
                    </div>
                    <div className="mt-6 text-2xl sm:text-[28px] font-bold leading-[1.8] text-slate-100" dir="rtl" lang="ar">
                      سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ
                    </div>
                    <p className="mt-8 text-[13px] sm:text-sm font-medium italic text-slate-400 max-w-xl">
                      "Glory is to Him who has subjected this to us, and we could not have done it by ourselves. And surely to our Lord we will return."
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-rise">
                <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <Wrench className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Daily Car Tip</h3>
                    <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                      {CAR_TIPS[new Date().getDate() % CAR_TIPS.length]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Overview */}
            <Card className="animate-rise">
              <CardContent className="p-5 sm:p-6">
                <SectionTitle
                  title="Vehicle overview"
                  description="Your registered vehicles at a glance"
                  action={
                    <Link href="/garage">
                      <ActionLink>All vehicles</ActionLink>
                    </Link>
                  }
                />
                <div className="mt-5 flex flex-col gap-3">
                  {vehicles.slice(0, 4).map((vehicle) => (
                    <Link
                      href="/garage"
                      key={vehicle.id}
                      className="flex items-center gap-3.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 transition-colors hover:border-slate-700 hover:bg-slate-800"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-1.5 shadow-inner">
                        <BrandLogo
                          brand={vehicle.make}
                          className="size-7 shrink-0 object-contain drop-shadow-sm"
                          fallback={<Car className="size-5 text-slate-400" />}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 border border-slate-700">
                            {vehicle.plate}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {vehicle.year ?? '—'} · {vehicle.fuelType} · {vehicle.mileage.toLocaleString()} km
                        </p>
                        {vehicle.nextService && (
                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            Next service: <span className="text-slate-300 font-medium">{vehicle.nextService}</span>
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                  {!vehicles.length && (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Add a vehicle to your Garage to see it here.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
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
