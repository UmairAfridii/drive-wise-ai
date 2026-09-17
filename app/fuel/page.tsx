'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Calendar,
  Car,
  Check,
  ChevronDown,
  Droplets,
  Fuel,
  Gauge,
  Info,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { MiniBars, PageHeading, SectionTitle, StatCard, StatusPill } from '@/components/dashboard-ui'
import { useAuth } from '@/components/providers/auth-provider'
import {
  calculateVehicleFuelAnalytics,
  type FuelEntryWithAnalytics,
  type VehicleFuelAnalytics,
} from '@/lib/fuel-analytics'
import { addFuelEntry, deleteFuelEntry, type FuelEntry, getFuelEntries, updateFuelEntry } from '@/lib/fuel'
import { type Vehicle, getVehicles } from '@/lib/garage'
import { BrandLogo } from '@/lib/vehicle-icons'
import {
  PAKISTAN_FUEL_PRICES_DATA,
  formatPKRPrice,
  getFuelMeasurementUnits,
  getReferencePriceForFuelType,
} from '@/lib/pakistan-fuel-prices'

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const money = (value: number) => `Rs ${Math.round(value).toLocaleString()}`
const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export default function FuelPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [dialog, setDialog] = useState<'add' | FuelEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<FuelEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load vehicles and fuel logs
  const load = useCallback(async () => {
    if (!user) {
      setVehicles([])
      setFuelEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [garage, entries] = await Promise.all([
        getVehicles(user.uid),
        getFuelEntries(user.uid),
      ])
      setVehicles(garage)
      setFuelEntries(entries)

      // Initialize persistent selected vehicle
      setSelectedVehicleId((current) => {
        if (current && garage.some((v) => v.id === current)) return current
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('drivewise_fuel_selected_vehicle')
          if (stored && garage.some((v) => v.id === stored)) return stored
        }
        return garage[0]?.id ?? ''
      })
    } catch (reason) {
      console.error('Failed to load fuel data:', reason)
      setError('Unable to load your fuel data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  // Handle vehicle switch
  function handleSelectVehicle(id: string) {
    setSelectedVehicleId(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('drivewise_fuel_selected_vehicle', id)
    }
  }

  // Active vehicle object
  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0] ?? null
  }, [vehicles, selectedVehicleId])

  // Per-vehicle analytics for the selected vehicle (accounting for fuel type)
  const analytics: VehicleFuelAnalytics | null = useMemo(() => {
    if (!activeVehicle?.id) return null
    return calculateVehicleFuelAnalytics(fuelEntries, activeVehicle.id, activeVehicle.fuelType)
  }, [fuelEntries, activeVehicle])

  const volumeUnit = analytics?.volumeUnit ?? 'L'
  const efficiencyUnit = analytics?.efficiencyUnit ?? 'km/L'
  const vehicleRefRate = useMemo(
    () => getReferencePriceForFuelType(activeVehicle?.fuelType),
    [activeVehicle?.fuelType]
  )

  // Monthly expense chart data
  const monthlyChart = useMemo(() => {
    if (!analytics) return { chart: Array<number>(12).fill(0), highest: 0, lowest: 0, average: 0, currentMonth: 0 }
    const spend = analytics.monthlySpend
    const maximum = Math.max(...spend, 0)
    const nonZero = spend.filter(Boolean)
    const currentMonth = new Date().getMonth()
    return {
      chart: spend.map((val) => (maximum ? Math.max(4, (val / maximum) * 100) : 0)),
      highest: maximum,
      lowest: nonZero.length ? Math.min(...nonZero) : 0,
      average: spend.reduce((sum, v) => sum + v, 0) / 12,
      currentMonth,
    }
  }, [analytics])

  async function save(entry: FuelEntry) {
    if (!user) return
    if (entry.id) await updateFuelEntry(user.uid, entry.id, entry)
    else await addFuelEntry(entry)
    await load()
  }

  async function remove() {
    if (!user || !deletingEntry?.id) return
    try {
      await deleteFuelEntry(user.uid, deletingEntry.id)
      setDeletingEntry(null)
      await load()
    } catch (reason) {
      console.error('Failed to delete fuel log:', reason)
      setError('Unable to delete this fuel log. Please try again.')
    }
  }

  if (loading) return <LoadingState label="Loading fuel intelligence..." />

  const hasEfficiency = Boolean(analytics && analytics.averageEfficiency !== null)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {/* ── Page Heading ── */}
      <PageHeading
        eyebrow="Fuel intelligence"
        title="Track every drop and every rupee"
        description="Per-vehicle consumption tracking, sequential efficiency analytics, and market rate insights."
        actions={
          <button
            type="button"
            onClick={() => setDialog('add')}
            disabled={!vehicles.length}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_oklch(0.62_0.19_258/0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Plus className="size-4" /> Add fuel log
          </button>
        }
      />

      {error && <Notice message={error} />}

      {/* ── 1. Prominent Vehicle Selector ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select vehicle ({vehicles.length})
          </p>
          {activeVehicle && (
            <span className="text-xs text-muted-foreground">
              Showing analytics for <strong className="text-foreground">{activeVehicle.name}</strong>
            </span>
          )}
        </div>

        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
            <Car className="size-8 text-slate-500" />
            <h3 className="mt-3 text-base font-semibold text-slate-100">No vehicles in your Garage</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Add your first vehicle in the Garage to start tracking fuel expenses, efficiency, and cost per kilometer.
            </p>
            <Link
              href="/garage"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-500 transition-all"
            >
              Go to Garage
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scroll-slim">
            {vehicles.map((v) => {
              const isSelected = v.id === activeVehicle?.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVehicle(v.id!)}
                  className={`flex min-w-[14rem] shrink-0 items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 p-2 shadow-inner ${isSelected ? 'bg-slate-900/80' : 'bg-slate-900'}`}>
                    <BrandLogo
                      brand={v.make}
                      className="size-7 shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                      fallback={<Car className="size-5 text-slate-500" />}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${isSelected ? 'text-blue-400' : 'text-slate-100'}`}>
                      {v.make} {v.model}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{v.year ?? '—'}</span>
                      {v.color && <span>· {v.color}</span>}
                      <span>· {v.fuelType}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-mono text-slate-400">
                      {v.mileage.toLocaleString()} km
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 2. Pakistan Fuel Price Reference Panel ── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md grid-texture">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                <Fuel className="size-3.5" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Pakistan Official Reference Rates
              </h2>
              <StatusPill tone="accent">Official Notified</StatusPill>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Current market reference rates for price comparison. Informational only — your personal logs preserve your actual station costs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Effective: <strong className="text-slate-100">{PAKISTAN_FUEL_PRICES_DATA.effectiveDate}</strong></span>
            <span>· Source: <strong className="text-slate-100">{PAKISTAN_FUEL_PRICES_DATA.source}</strong></span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Petrol */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {PAKISTAN_FUEL_PRICES_DATA.petrol.name}
                </p>
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Fuel className="size-3.5" />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-slate-50">
                {formatPKRPrice(PAKISTAN_FUEL_PRICES_DATA.petrol.price!, 'L')}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-1.5">
              Source: {PAKISTAN_FUEL_PRICES_DATA.petrol.source}
            </p>
          </div>

          {/* Octane+ */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {PAKISTAN_FUEL_PRICES_DATA.octanePlus.name}
                </p>
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Fuel className="size-3.5" />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-slate-50">
                {formatPKRPrice(PAKISTAN_FUEL_PRICES_DATA.octanePlus.price!, 'L')}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-1.5">
              Source: {PAKISTAN_FUEL_PRICES_DATA.octanePlus.source}
            </p>
          </div>

          {/* Diesel */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {PAKISTAN_FUEL_PRICES_DATA.diesel.name}
                </p>
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Gauge className="size-3.5" />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-slate-50">
                {formatPKRPrice(PAKISTAN_FUEL_PRICES_DATA.diesel.price!, 'L')}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-1.5">
              Source: {PAKISTAN_FUEL_PRICES_DATA.diesel.source}
            </p>
          </div>

          {/* LPG */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {PAKISTAN_FUEL_PRICES_DATA.lpg.name}
                </p>
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                  <Droplets className="size-3.5" />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-slate-50">
                {formatPKRPrice(PAKISTAN_FUEL_PRICES_DATA.lpg.price!, 'kg')}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-1.5">
              Source: {PAKISTAN_FUEL_PRICES_DATA.lpg.source}
            </p>
          </div>

          {/* CNG */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {PAKISTAN_FUEL_PRICES_DATA.cng.name}
                </p>
                <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
                  <Gauge className="size-3.5" />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-slate-50">
                {formatPKRPrice(PAKISTAN_FUEL_PRICES_DATA.cng.price!, 'kg')}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-1.5" title={PAKISTAN_FUEL_PRICES_DATA.cng.notes}>
              Kohat Regional Benchmark · Not a nationwide rate
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Four Summary StatCards for Selected Vehicle ── */}
      {activeVehicle && analytics && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total spend (this month)"
            value={money(analytics.totalSpendThisMonth)}
            detail={`${analytics.fillUpCountThisMonth} fill-up${analytics.fillUpCountThisMonth === 1 ? '' : 's'} for ${activeVehicle.make}`}
            icon={Wallet}
            delay={0}
          />
          <StatCard
            label="Fuel volume (this month)"
            value={`${analytics.fuelVolumeThisMonth.toFixed(1)} ${volumeUnit}`}
            detail={`Current month volume in ${volumeUnit}`}
            icon={Droplets}
            delay={60}
          />
          <StatCard
            label="Avg efficiency"
            value={
              hasEfficiency
                ? `${analytics.averageEfficiency!.toFixed(1)} ${efficiencyUnit}`
                : analytics.entries.length === 0
                ? 'No logs yet'
                : analytics.entries.length === 1
                ? 'Baseline set'
                : 'Check odometer'
            }
            detail={
              hasEfficiency
                ? `${analytics.validFillUps} measured interval${analytics.validFillUps === 1 ? '' : 's'}`
                : analytics.entries.length === 0
                ? 'Add your first fill-up'
                : analytics.entries.length === 1
                ? `1st log at ${analytics.entries[0]?.odometer.toLocaleString()} km`
                : 'Readings must increase'
            }
            icon={Gauge}
            delay={120}
          />
          <StatCard
            label="Cost per km"
            value={
              analytics.costPerKm !== null
                ? money(analytics.costPerKm)
                : analytics.entries.length <= 1
                ? 'Needs 2nd fill-up'
                : 'Check odometer'
            }
            detail={
              analytics.costPerKm !== null
                ? `Across ${analytics.totalDistance.toLocaleString()} measured km`
                : 'Needs consecutive fill-ups'
            }
            icon={TrendingDown}
            delay={180}
          />
        </section>
      )}

      {/* ── 4. Diagnostic Banner when efficiency is unavailable ── */}
      {activeVehicle && analytics && !hasEfficiency && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          <Info className="size-5 shrink-0 text-warning mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-warning">Efficiency Tracking Diagnostic</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {analytics.diagnosticMessage}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground/80">
              Fuel efficiency ({efficiencyUnit}) is strictly computed from consecutive odometer readings on the same vehicle:
              <br />
              <code className="font-mono text-[10px] text-foreground">
                Distance = Current Odometer - Previous Odometer &nbsp;|&nbsp; Efficiency = Distance / Fuel Amount ({volumeUnit})
              </code>
            </p>
          </div>
        </div>
      )}

      {/* ── Abnormal Data Warning Banner ── */}
      {activeVehicle && analytics && analytics.hasSuspiciousEntries && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
          <AlertCircle className="size-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-500">Unusual fuel-efficiency reading. Check the odometer and fuel amount.</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              One or more fill-up intervals produced an implausible efficiency reading outside normal passenger vehicle ranges for {activeVehicle.fuelType}.
              These suspicious readings are safely excluded from your average efficiency and trend charts so your metrics remain reliable.
            </p>
          </div>
        </div>
      )}

      {/* ── 5. Monthly Expense & Fuel Price Trends ── */}
      {activeVehicle && analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Monthly Expense Bar Chart */}
          <section className="animate-rise rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 sm:p-6 shadow-lg backdrop-blur-sm lg:col-span-2">
            <SectionTitle
              title="Monthly expense"
              description={`Fuel spend for ${activeVehicle.name} in ${new Date().getFullYear()}`}
              action={<StatusPill tone="accent">{money(analytics.totalSpendThisMonth)} this month</StatusPill>}
            />
            <div className="mt-6">
              <MiniBars
                values={monthlyChart.chart}
                highlight={monthlyChart.currentMonth}
                height="h-52"
              />
              <div className="mt-2 flex justify-between px-0.5 text-[10px] font-medium text-slate-500">
                {MONTHS.map((month, index) => (
                  <span key={`${month}-${index}`}>{month}</span>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-[11px] text-slate-500">Highest month</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{money(monthlyChart.highest)}</p>
                <p className="text-[10px] text-slate-500/70">This year</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-[11px] text-slate-500">Lowest month</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{money(monthlyChart.lowest)}</p>
                <p className="text-[10px] text-slate-500/70">This year</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-[11px] text-slate-500">Monthly avg</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{money(monthlyChart.average)}</p>
                <p className="text-[10px] text-slate-500/70">Per month</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-[11px] text-slate-500">YTD total</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {money(analytics.monthlySpend.reduce((a, b) => a + b, 0))}
                </p>
                <p className="text-[10px] text-slate-500/70">{new Date().getFullYear()}</p>
              </div>
            </div>
          </section>

          {/* User's Fuel Price History & Effective Rates */}
          <section className="relative overflow-hidden flex flex-col justify-between animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md grid-texture">
            <div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                <Wallet className="size-4" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-100">Fuel Price History</h2>
              <p className="mt-1 text-xs text-slate-400">
                Actual price per {volumeUnit === 'kg' ? 'kg' : 'litre'} paid for {activeVehicle.name} across your logged fill-ups (Cost ÷ {volumeUnit}).
              </p>

              <div className="mt-4 flex flex-col gap-2.5 max-h-56 overflow-y-auto scroll-slim pr-1">
                {analytics.priceHistory.slice(-5).reverse().map((p, idx) => (
                  <div
                    key={`${p.date}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">Rs {p.pricePerUnit.toFixed(2)}/{volumeUnit}</p>
                      <p className="text-[10px] text-slate-500">{dateLabel(p.date)}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <span>{p.liters.toFixed(1)} {volumeUnit}</span>
                      <p className="font-mono text-slate-300 font-medium">{money(p.cost)}</p>
                    </div>
                  </div>
                ))}
                {!analytics.priceHistory.length && (
                  <p className="py-8 text-center text-xs text-slate-500">
                    No price history yet. Record a fill-up to see your effective pump rates.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
              <span>National Reference ({vehicleRefRate.label}): </span>
              <strong className="text-slate-100">
                {vehicleRefRate.isAvailable ? vehicleRefRate.formattedPrice : 'Regional / Not Available'}
              </strong>
              {vehicleRefRate.isAvailable && <span> · Source: {vehicleRefRate.source}</span>}
            </div>
          </section>
        </div>
      )}

      {/* ── 6. Efficiency Trend Visualization ── */}
      {activeVehicle && analytics && (
        <section className="animate-rise rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <SectionTitle
            title="Efficiency trend"
            description={`Sequential fill-up efficiency (${efficiencyUnit}) for ${activeVehicle.name}`}
            action={
              hasEfficiency ? (
                <StatusPill tone="success">
                  {analytics.averageEfficiency!.toFixed(1)} {efficiencyUnit} average
                </StatusPill>
              ) : undefined
            }
          />

          {analytics.efficiencyTrend.length > 0 ? (
            <div className="mt-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {analytics.efficiencyTrend.slice(-4).map((pt, idx) => (
                  <div
                    key={`${pt.date}-${idx}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 transition-colors hover:border-blue-500/30"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Interval #{idx + 1}</span>
                      <span className="font-mono text-[10px]">{dateLabel(pt.date)}</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-slate-100">
                      {pt.efficiency.toFixed(1)}{' '}
                      <span className="text-xs font-medium text-slate-500">{efficiencyUnit}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      +{pt.distance.toLocaleString()} km on {pt.liters.toFixed(1)} {volumeUnit}
                    </p>
                  </div>
                ))}
              </div>

              {/* Graphical representation of calculated intervals */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Interval Progression
                </p>
                <div className="flex items-end gap-3 h-28 pt-2">
                  {analytics.efficiencyTrend.map((pt, idx) => {
                    const maxEff = Math.max(...analytics.efficiencyTrend.map((p) => p.efficiency), 20)
                    const heightPercent = Math.max(10, Math.min(100, (pt.efficiency / maxEff) * 100))
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                          {pt.efficiency.toFixed(1)}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-lg bg-blue-500/80 transition-all group-hover:bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                        />
                        <span className="text-[9px] text-slate-500 truncate max-w-16">
                          {new Date(`${pt.date}T00:00:00`).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <Gauge className="mx-auto size-7 text-slate-500" />
              <p className="mt-3 text-sm font-semibold text-slate-100">No efficiency intervals calculated yet</p>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                {analytics.diagnosticMessage}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── 7. Selected Vehicle Fuel History ── */}
      {activeVehicle && analytics && (
        <section className="animate-rise rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <SectionTitle
            title="Fuel history"
            description={`Logged fill-ups for ${activeVehicle.name}`}
            action={
              <span className="text-xs text-slate-400">
                {analytics.entries.length} {analytics.entries.length === 1 ? 'log' : 'logs'} recorded
              </span>
            }
          />

          <div className="mt-5 flex flex-col gap-3">
            {analytics.entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-blue-500/30 hover:bg-slate-900/60 sm:flex-row sm:items-center"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center gap-3 sm:w-52">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Fuel className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{entry.vehicleName}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="size-3" /> {dateLabel(entry.date)}
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
                  <Metric label="Volume" value={`${entry.liters} ${volumeUnit}`} />
                  <Metric label="Total Cost" value={money(entry.cost)} />
                  <Metric label={`Price / ${volumeUnit === 'kg' ? 'kg' : 'Litre'}`} value={`Rs ${entry.pricePerUnit.toFixed(1)}/${volumeUnit}`} />
                  <Metric
                    label="Distance"
                    value={entry.distance !== null ? `+${entry.distance.toLocaleString()} km` : 'Baseline'}
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Efficiency</p>
                    {entry.efficiency !== null ? (
                      entry.isSuspicious ? (
                        <div>
                          <p className="text-sm font-medium text-amber-500 flex items-center gap-1" title={entry.suspiciousWarning}>
                            <AlertCircle className="size-3 shrink-0" />
                            {entry.efficiency.toFixed(1)} {efficiencyUnit}
                          </p>
                          <p className="text-[10px] text-amber-500/80">Unusual reading</p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-100">
                          {entry.efficiency.toFixed(1)} {efficiencyUnit}
                        </p>
                      )
                    ) : (
                      <p className="text-sm font-medium text-slate-400">Baseline fill-up</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDialog(entry)}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    aria-label={`Edit fuel log for ${entry.vehicleName}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingEntry(entry)}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label={`Delete fuel log for ${entry.vehicleName}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {!analytics.entries.length && (
              <div className="py-12 text-center">
                <Fuel className="mx-auto size-7 text-slate-500" />
                <p className="mt-3 text-sm font-semibold text-slate-100">No fuel logs for this vehicle yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Record your fill-ups to track consumption and efficiency over time.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 8. Add / Edit Fuel Dialog ── */}
      {dialog && (
        <FuelDialog
          vehicles={vehicles}
          defaultVehicleId={selectedVehicleId}
          entry={dialog === 'add' ? undefined : dialog}
          onClose={() => setDialog(null)}
          onSave={async (entry) => {
            await save(entry)
            setDialog(null)
          }}
        />
      )}

      {deletingEntry && (
        <DeleteDialog
          entry={deletingEntry}
          onClose={() => setDeletingEntry(null)}
          onDelete={remove}
        />
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-100">{value}</p>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-400">
      <span className="size-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      {label}
    </div>
  )
}

function Notice({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
      {message}
    </p>
  )
}

function CustomVehicleSelect({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  disabled,
}: {
  vehicles: Vehicle[]
  selectedVehicleId: string
  onSelectVehicle: (id: string) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  function handleKeyDown(event: React.KeyboardEvent) {
    if (disabled || !vehicles.length) return
    if (event.key === 'Escape') {
      setIsOpen(false)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen((prev) => !prev)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        const currentIndex = vehicles.findIndex((v) => v.id === selectedVehicleId)
        const nextIndex = (currentIndex + 1) % vehicles.length
        onSelectVehicle(vehicles[nextIndex].id!)
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        const currentIndex = vehicles.findIndex((v) => v.id === selectedVehicleId)
        const prevIndex = (currentIndex - 1 + vehicles.length) % vehicles.length
        onSelectVehicle(vehicles[prevIndex].id!)
      }
    }
  }

  return (
    <div ref={dropdownRef} className="relative col-span-2 flex flex-col gap-2 text-xs font-medium text-slate-400">
      <span>Vehicle</span>
      {/* Closed Selector Button */}
      <button
        type="button"
        disabled={disabled || !vehicles.length}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-14 w-full items-center justify-between gap-3 rounded-2xl border px-3.5 text-left transition-all ${
          isOpen
            ? 'border-blue-500 bg-slate-900/80 ring-2 ring-blue-500/30'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {selectedVehicle ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-1.5 shadow-inner">
              <BrandLogo
                brand={selectedVehicle.make}
                className="size-6 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                fallback={<Car className="size-4 text-slate-500" />}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedVehicle.make} {selectedVehicle.model}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                <span className="font-mono font-medium text-slate-300">{selectedVehicle.plate}</span>
                <span className="mx-1.5">·</span>
                <span>{selectedVehicle.fuelType}</span>
                {selectedVehicle.year && <span> · {selectedVehicle.year}</span>}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">No vehicles in your Garage</span>
        )}

        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-300' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl scroll-slim animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {vehicles.map((item) => {
            const isSelected = item.id === selectedVehicleId
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectVehicle(item.id!)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border border-blue-500/30 bg-blue-500/15 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-1">
                    <BrandLogo
                      brand={item.make}
                      className="size-5 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                      fallback={<Car className="size-3.5 text-slate-500" />}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">
                      {item.make} {item.model}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      <span className="font-mono text-slate-400">{item.plate}</span>
                      <span className="mx-1">·</span>
                      <span>{item.fuelType}</span>
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    <Check className="size-3" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FuelDialog({
  vehicles,
  defaultVehicleId,
  entry,
  onClose,
  onSave,
}: {
  vehicles: Vehicle[]
  defaultVehicleId?: string
  entry?: FuelEntry
  onClose: () => void
  onSave: (entry: FuelEntry) => Promise<void>
}) {
  const { user } = useAuth()
  const [vehicleId, setVehicleId] = useState(
    entry?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? ''
  )
  const vehicle = vehicles.find((item) => item.id === vehicleId)

  // Dynamic measurement units and reference rate for the selected vehicle
  const units = useMemo(() => getFuelMeasurementUnits(vehicle?.fuelType), [vehicle?.fuelType])
  const referenceRate = useMemo(() => getReferencePriceForFuelType(vehicle?.fuelType), [vehicle?.fuelType])

  // Form inputs
  const [fuelAmount, setFuelAmount] = useState(entry?.liters.toString() ?? '')
  const [odometer, setOdometer] = useState(entry?.odometer.toString() ?? '')
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().slice(0, 10))

  // Editable actual price paid per unit (defaults to reference price or prior entry rate)
  const [actualPricePerUnit, setActualPricePerUnit] = useState<string>(() => {
    if (entry && entry.liters > 0) {
      return (entry.cost / entry.liters).toFixed(2)
    }
    const initialVehicle = vehicles.find((v) => v.id === (defaultVehicleId ?? vehicles[0]?.id))
    const initialRef = getReferencePriceForFuelType(initialVehicle?.fuelType)
    return initialRef.price !== null ? initialRef.price.toFixed(2) : ''
  })

  // When vehicle changes, update the default unit price for a new entry
  const handleVehicleChange = (newVehicleId: string) => {
    setVehicleId(newVehicleId)
    if (!entry) {
      const newVehicle = vehicles.find((v) => v.id === newVehicleId)
      const newRef = getReferencePriceForFuelType(newVehicle?.fuelType)
      setActualPricePerUnit(newRef.price !== null ? newRef.price.toFixed(2) : '')
    }
  }

  // Auto-calculated total cost = fuelAmount * actualPricePerUnit
  const calculatedTotalCost = useMemo(() => {
    const qty = parseFloat(fuelAmount)
    const rate = parseFloat(actualPricePerUnit)
    if (!isNaN(qty) && !isNaN(rate) && qty > 0 && rate > 0) {
      return Math.round(qty * rate)
    }
    return 0
  }, [fuelAmount, actualPricePerUnit])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fuel = parseFloat(fuelAmount)
    const unitPrice = parseFloat(actualPricePerUnit)
    const mileage = parseInt(odometer, 10)
    const totalCost = calculatedTotalCost

    if (
      !user ||
      !vehicle ||
      !date ||
      isNaN(fuel) ||
      fuel <= 0 ||
      isNaN(unitPrice) ||
      unitPrice <= 0 ||
      totalCost <= 0 ||
      isNaN(mileage) ||
      mileage < 0
    ) {
      setError(
        `Please enter a valid ${units.amountLabel}, actual price per ${units.volumeUnit}, odometer reading, and date.`
      )
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...(entry?.id ? { id: entry.id } : {}),
        uid: user.uid,
        vehicleId,
        vehicleName: vehicle.name,
        liters: fuel,
        cost: totalCost,
        odometer: mileage,
        date,
      })
    } catch (reason) {
      console.error('Failed to save fuel log:', reason)
      setError('Unable to save this fuel log. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} titleId="fuel-dialog-title">
      <form onSubmit={submit}>
        <DialogHeader onClose={onClose}>
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
            <Fuel className="size-5" />
          </div>
          <DialogTitle id="fuel-dialog-title">
            {entry ? 'Edit fuel log' : 'Add fuel log'}
          </DialogTitle>
          <DialogDescription>
            Record a fill-up for {vehicle?.name ?? 'your vehicle'}. Total cost is calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* Custom Vehicle Dropdown */}
          <CustomVehicleSelect
            vehicles={vehicles}
            selectedVehicleId={vehicleId}
            onSelectVehicle={handleVehicleChange}
            disabled={!vehicles.length}
          />

          {/* Dynamic Fuel Amount: (L) or (kg) */}
          <Input
            label={units.amountLabel}
            value={fuelAmount}
            setValue={setFuelAmount}
            inputMode="decimal"
            placeholder={units.volumeUnit === 'kg' ? '12.5' : '34.2'}
          />

          {/* Editable Actual Price Paid per unit */}
          <Input
            label={`Actual price paid (${units.pricePerUnitShort})`}
            value={actualPricePerUnit}
            setValue={setActualPricePerUnit}
            inputMode="decimal"
            placeholder={referenceRate.price !== null ? referenceRate.price.toFixed(2) : 'Enter station rate'}
          />

          {/* Reference Rate & Auto-Calculated Cost Panel */}
          <div className="col-span-2 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Reference Rate ({vehicle?.fuelType ?? 'Fuel'})
                </p>
                <p className="mt-1 text-xs font-medium text-slate-100">
                  {referenceRate.isAvailable ? (
                    <>
                      <span className="font-semibold text-blue-400">{referenceRate.formattedPrice}</span>
                      <span className="text-slate-400"> · {referenceRate.source}</span>
                    </>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Regional / Station Rate (enter pump price)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Unit: <strong className="text-slate-100">{units.volumeUnit}</strong> · Efficiency: <strong className="text-slate-100">{units.efficiencyUnit}</strong>
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Calculated Total
                </p>
                <p className="mt-1 text-xl font-bold font-mono text-slate-50">
                  Rs {calculatedTotalCost.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Calculation: {fuelAmount || 0} {units.volumeUnit} × Rs {actualPricePerUnit || 0}/{units.volumeUnit}
              </span>
              <span className="font-semibold text-blue-500">Auto-calculated</span>
            </div>
          </div>

          {/* Odometer */}
          <Input
            label="Odometer (km)"
            value={odometer}
            setValue={setOdometer}
            inputMode="numeric"
            placeholder="45200"
          />

          {/* Date */}
          <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
            Date
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-colors"
            />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 text-xs text-rose-500">{error}</p>}

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !vehicles.length}
            className="flex-1 h-11 rounded-full bg-blue-600 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : entry ? 'Save changes' : 'Save log'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function Input({
  label,
  value,
  setValue,
  inputMode,
  placeholder,
  required = true,
}: {
  label: string
  value: string
  setValue: (value: string) => void
  inputMode: 'decimal' | 'numeric'
  placeholder: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
      {label} {required === false && <span className="opacity-50">(Optional)</span>}
      <input
        type={inputMode === 'numeric' || inputMode === 'decimal' ? 'number' : 'text'}
        inputMode={inputMode}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required={required}
        step={inputMode === 'decimal' ? '0.01' : 'any'}
        className="h-11 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
      />
    </label>
  )
}

function DeleteDialog({ entry, onClose, onDelete }: { entry: FuelEntry; onClose: () => void; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)

  return (
    <Dialog open={true} onClose={onClose} titleId="delete-fuel-title">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <Trash2 className="size-6" />
        </div>
        <h2 id="delete-fuel-title" className="text-xl font-semibold text-slate-100">
          Delete fuel log?
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Are you sure you want to delete this fuel record for:<br/>
          <strong className="text-slate-200">{entry.vehicleName}</strong>
        </p>
        <p className="mt-4 text-xs font-medium text-rose-400/80">
          This action cannot be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={deleting} className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50">Cancel</button>
        <button type="button" disabled={deleting} onClick={async () => { setDeleting(true); await onDelete() }} className="h-11 flex-1 rounded-xl bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50 disabled:shadow-none">
          {deleting ? 'Deleting...' : 'Delete fuel log'}
        </button>
      </div>
    </Dialog>
  )
}
