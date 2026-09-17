'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  BatteryCharging,
  Car,
  Check,
  ChevronRight,
  Fuel,
  Gauge,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { PageHeading } from '@/components/dashboard-ui'
import { useAuth } from '@/components/providers/auth-provider'

import { Vehicle, getVehicles, addVehicle, deleteVehicle, updateVehicle } from '@/lib/garage'
import { getFuelEntries, type FuelEntry } from '@/lib/fuel'
import { calculateVehicleFuelAnalytics } from '@/lib/fuel-analytics'
import { VEHICLE_BRANDS, FUEL_TYPES, getProductionYears } from '@/lib/vehicle-data'
import { BrandLogo } from '@/lib/vehicle-icons'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function GaragePage() {
  const { user } = useAuth()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const loadVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([])
      setFuelEntries([])
      setLoading(false)
      return
    }

    setLoading(true)
    setActionError(null)
    try {
      const [garageVehicles, userFuelEntries] = await Promise.all([
        getVehicles(user.uid),
        getFuelEntries(user.uid),
      ])
      setVehicles(garageVehicles)
      setFuelEntries(userFuelEntries)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
      setActionError('Unable to load your vehicles. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const vehicleEfficiencies = useMemo(() => {
    const map = new Map<string, string>()
    for (const vehicle of vehicles) {
      if (!vehicle.id) continue
      const analytics = calculateVehicleFuelAnalytics(fuelEntries, vehicle.id, vehicle.fuelType)
      if (analytics && analytics.averageEfficiency !== null) {
        map.set(vehicle.id, `${analytics.averageEfficiency.toFixed(1)} ${analytics.efficiencyUnit}`)
      }
    }
    return map
  }, [vehicles, fuelEntries])

  const filtered = useMemo(() => {
    return vehicles.filter((v) =>
      `${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [vehicles, query])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading vehicles...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <PageHeading
        eyebrow="Your fleet"
        title="Everything you drive, in one place"
        description="Manage vehicles, track mileage, fuel efficiency, and details across your garage."
        actions={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_oklch(0.62_0.19_258/0.25)] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-4" /> Add vehicle
          </button>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <span className="sr-only">Search vehicles</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search make, model, or plate..."
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-colors"
          />
        </label>
        <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
          <span>{vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} registered</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vehicle, index) => (
          <article
            key={vehicle.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-slate-800/50 animate-rise"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-slate-800/50 bg-slate-900/30">
              <div ref={openMenuId === vehicle.id ? menuRef : undefined} className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  onClick={() => setOpenMenuId((current) => current === vehicle.id ? null : vehicle.id ?? null)}
                  className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 backdrop-blur-md transition-colors hover:text-slate-50 hover:bg-slate-800"
                  aria-label={`More options for ${vehicle.make} ${vehicle.model}`}
                  aria-expanded={openMenuId === vehicle.id}
                  aria-haspopup="menu"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {openMenuId === vehicle.id && (
                  <div role="menu" className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-700 bg-slate-800 p-1.5 shadow-xl shadow-black/40">
                    <button type="button" role="menuitem" onClick={() => { setEditingVehicle(vehicle); setOpenMenuId(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700">
                      <Pencil className="size-3.5 text-blue-400" /> Edit vehicle
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setDeletingVehicle(vehicle); setOpenMenuId(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/10">
                      <Trash2 className="size-3.5" /> Delete vehicle
                    </button>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-blue-500/20 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex flex-col items-center">
                <div className="flex size-24 items-center justify-center">
                  <BrandLogo
                    brand={vehicle.make}
                    className="size-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110"
                    fallback={<Car className="size-20 text-slate-500 transition-transform duration-500 group-hover:scale-105" strokeWidth={1.25} />}
                  />
                </div>
                <span className="mt-3 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1 font-mono text-[10px] text-slate-400 backdrop-blur-md">
                  {vehicle.plate}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{vehicle.name}</p>
                  <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-50">{vehicle.make} {vehicle.model}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {vehicle.year ?? 'Year not set'}{vehicle.color ? ` · ${vehicle.color}` : ''}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                  {vehicle.fuelType}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Gauge className="size-3.5 text-blue-500" />
                    <span className="text-[10px] uppercase tracking-wider">Mileage</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{vehicle.mileage.toLocaleString()} km</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    {vehicle.fuelType === 'Electric' ? <BatteryCharging className="size-3.5 text-cyan-400" /> : <Fuel className="size-3.5 text-cyan-400" />}
                    <span className="text-[10px] uppercase tracking-wider">Efficiency</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {(vehicle.id && vehicleEfficiencies.get(vehicle.id)) || vehicle.efficiency || 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="group flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-8 text-center transition-all hover:border-blue-500/40 hover:bg-slate-900/50"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-400 transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500">
            <Plus className="size-5" />
          </span>
          <span className="mt-4 text-sm font-semibold text-slate-100">Add another vehicle</span>
          <span className="mt-1 max-w-48 text-xs leading-relaxed text-slate-400">Connect a vehicle to unlock smart monitoring and AI insights.</span>
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="glass flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <Search className="size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No vehicles found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search or filter.</p>
        </div>
      )}

      {actionError && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{actionError}</p>}

      {dialogOpen && (
        <AddVehicleDialog
          onClose={() => setDialogOpen(false)}
          onSaved={async () => {
            setDialogOpen(false)
            await loadVehicles()
          }}
        />
      )}
      {editingVehicle && <AddVehicleDialog vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} onSaved={async () => { setEditingVehicle(null); await loadVehicles() }} />}
      {deletingVehicle && <DeleteVehicleDialog vehicle={deletingVehicle} onClose={() => setDeletingVehicle(null)} onDeleted={async () => { setDeletingVehicle(null); await loadVehicles() }} onError={setActionError} />}
    </div>
  )
}

function AddVehicleDialog({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle?: Vehicle
  onClose: () => void
  onSaved: () => void
}) {
  // If editing, show the simpler edit form
  if (vehicle) return <EditVehicleDialog vehicle={vehicle} onClose={onClose} onSaved={onSaved} />

  return <AddVehicleWizard onClose={onClose} onSaved={onSaved} />
}

/* ───────── Edit dialog (preserves original edit UX) ───────── */

function EditVehicleDialog({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const [make, setMake] = useState(vehicle.make)
  const [model, setModel] = useState(vehicle.model)
  const [year, setYear] = useState(typeof vehicle.year === 'number' ? String(vehicle.year) : '')
  const [plate, setPlate] = useState(vehicle.plate)
  const [fuelType, setFuelType] = useState(vehicle.fuelType)
  const [mileage, setMileage] = useState(String(vehicle.mileage))
  const [color, setColor] = useState(vehicle.color ?? '')

  async function handleSave() {
    if (!user || !vehicle.id) return
    const parsedYear = Number(year)
    const parsedMileage = Number(mileage)
    if (!make.trim() || !model.trim() || !year.trim() || !plate.trim() || !Number.isInteger(parsedYear) || parsedYear < 1886) {
      alert('Please fill all required fields.'); return
    }
    if (!Number.isFinite(parsedMileage) || parsedMileage < 0) {
      alert('Please enter a valid mileage.'); return
    }
    try {
      setSaving(true)
      await updateVehicle(user.uid, vehicle.id, {
        name: `${make} ${model}`,
        make,
        model,
        year: parsedYear,
        plate,
        fuelType,
        mileage: parsedMileage,
        color: color.trim() || undefined,
      })
      onSaved()
      setDone(true)
    } catch (error) {
      console.error(error)
      alert('Failed to save vehicle.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} titleId="edit-vehicle-title">
        {!done ? (
          <div className="flex flex-col gap-4">
            <DialogHeader onClose={onClose}>
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500"><Car className="size-5" /></div>
              <DialogTitle id="edit-vehicle-title">Edit vehicle</DialogTitle>
              <DialogDescription>Update your vehicle information.</DialogDescription>
            </DialogHeader>

            <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
              Vehicle make
              <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Toyota" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
              Model and year
              <div className="grid grid-cols-3 gap-3">
                <Input value={model} onChange={(e) => setModel(e.target.value)} className="col-span-2" placeholder="Corolla Altis" />
                <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" inputMode="numeric" />
              </div>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
              Fuel type
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value as Vehicle['fuelType'])} className="h-11 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50">
                {FUEL_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
              Mileage (km)
              <Input value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="45000" inputMode="numeric" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
              License plate
              <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC-1234" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
              Paint / color
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Pearl White" />
            </label>
            <button type="button" onClick={handleSave} disabled={saving} className="mt-2 flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-500 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save changes'}
              <Check className="size-4" />
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center py-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20"><Check className="size-7" /></div>
            <h3 className="mt-5 text-lg font-semibold text-slate-100">Vehicle updated</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">Your changes have been saved successfully throughout your workspace.</p>
            <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500">Done</button>
          </div>
        )}
    </Dialog>
  )
}

/* ───────── Add Vehicle Wizard (8-step) ───────── */

const WIZARD_STEPS = [
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'mileage', label: 'Mileage' },
  { key: 'plate', label: 'Plate' },
  { key: 'color', label: 'Color' },
  { key: 'review', label: 'Review' },
] as const

type FuelValue = Vehicle['fuelType']

function AddVehicleWizard({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Wizard state
  const [make, setMake] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [model, setModel] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [year, setYear] = useState<number | null>(null)
  const [fuelType, setFuelType] = useState<FuelValue | ''>('')
  const [mileage, setMileage] = useState('')
  const [plate, setPlate] = useState('')
  const [color, setColor] = useState('')

  const years = useMemo(() => getProductionYears(), [])

  // Filtered brands
  const filteredBrands = useMemo(() => {
    const q = brandSearch.toLowerCase().trim()
    if (!q) return VEHICLE_BRANDS
    return VEHICLE_BRANDS.filter((b) => b.name.toLowerCase().includes(q))
  }, [brandSearch])

  // Models for selected brand
  const selectedBrand = useMemo(() => VEHICLE_BRANDS.find((b) => b.name === make), [make])
  const filteredModels = useMemo(() => {
    const models = selectedBrand?.models ?? []
    const q = modelSearch.toLowerCase().trim()
    if (!q) return models
    return models.filter((m) => m.toLowerCase().includes(q))
  }, [selectedBrand, modelSearch])

  // Validation per step
  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return make !== ''
      case 1: return model !== ''
      case 2: return year !== null
      case 3: return fuelType !== ''
      case 4: {
        const n = Number(mileage)
        return mileage.trim() !== '' && Number.isFinite(n) && n >= 0
      }
      case 5: return plate.trim() !== ''
      case 6: return true // color is optional
      case 7: return true // review
      default: return false
    }
  }, [step, make, model, year, fuelType, mileage, plate])

  function goNext() {
    if (step < WIZARD_STEPS.length - 1) setStep(step + 1)
  }

  function goBack() {
    if (step > 0) setStep(step - 1)
  }

  async function handleSave() {
    if (!user || !make || !model || year === null || !fuelType || !plate.trim()) return

    try {
      setSaving(true)
      await addVehicle({
        uid: user.uid,
        name: `${make} ${model}`,
        make,
        model,
        year,
        plate: plate.trim(),
        fuelType,
        mileage: Math.max(0, Math.round(Number(mileage) || 0)),
        status: 'Not assessed',
        color: color.trim() || undefined,
      })
      await onSaved()
      onClose()
    } catch (error) {
      console.error(error)
      alert('Failed to save vehicle. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Common input class
  const inputCls = 'h-11 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-colors'

  return (
    <Dialog open={true} onClose={onClose} titleId="add-wizard-title" className="max-w-lg sm:max-w-2xl lg:max-w-3xl flex flex-col p-0 h-[min(92dvh,740px)] overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-5 py-4 shrink-0">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="flex size-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors" aria-label="Back">
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <div className="size-9" />
          )}
          <h2 id="add-wizard-title" className="text-sm font-semibold text-slate-100">
            Step {step + 1} of {WIZARD_STEPS.length}
          </h2>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Progress bar ── */}
        <div className="flex gap-1 px-5 pt-3">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.key} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        {/* ── Body ── */}
        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Step 0: Brand */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">What is your vehicle brand?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Let us know your vehicle for accurate analysis.</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder="Search brand..." className={`${inputCls} pl-9`} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredBrands.map((brand) => {
                  const isSelected = make === brand.name
                  return (
                    <button
                      key={brand.name}
                      type="button"
                      onClick={() => {
                        setMake(brand.name)
                        if (make !== brand.name) {
                          setModel('')
                          setModelSearch('')
                        }
                        setStep(1)
                      }}
                      className={`group flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/40'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/50 hover:text-foreground'
                      }`}
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background/70 p-3 shadow-inner border border-border/40 transition-transform duration-200 group-hover:scale-105">
                        <BrandLogo
                          brand={brand.name}
                          className="size-8 shrink-0 drop-shadow-sm"
                          fallback={<span className="text-base font-bold text-foreground">{brand.name[0]}</span>}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold tracking-tight text-foreground">{brand.name}</span>
                        {isSelected && <Check className="size-3.5 text-primary" />}
                      </div>
                    </button>
                  )
                })}
                {filteredBrands.length === 0 && (
                  <p className="col-span-full py-8 text-center text-xs text-muted-foreground">No brands match your search.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Model */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">What is your vehicle model?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Select the model for your <span className="font-semibold text-foreground">{make}</span>.</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search model..." className={`${inputCls} pl-9`} />
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {filteredModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setModel(m)
                      setStep(2)
                    }}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                      model === m
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <span>{m}</span>
                    {model === m && <Check className="size-4 text-primary" />}
                  </button>
                ))}
                {filteredModels.length === 0 && (
                  <p className="col-span-full py-8 text-center text-xs text-muted-foreground">No models match your search.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Year */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">What is your vehicle production year?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Select the manufacturing year of your <span className="font-semibold text-foreground">{make} {model}</span>.</p>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setYear(y)
                      setStep(3)
                    }}
                    className={`rounded-xl border py-3 text-center text-sm font-medium transition-colors ${
                      year === y
                        ? 'border-primary bg-primary/10 text-foreground font-semibold ring-1 ring-primary/30'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Fuel type */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Select fuel type</h3>
                <p className="mt-1 text-sm text-muted-foreground">This helps calculate fuel efficiency and cost estimates.</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {FUEL_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => {
                      setFuelType(ft.value)
                      setStep(4)
                    }}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                      fuelType === ft.value
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {ft.value === 'Electric' ? <BatteryCharging className="size-4" /> : <Fuel className="size-4" />}
                      {ft.label}
                    </div>
                    {fuelType === ft.value && <Check className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

              {/* Step 4: Mileage */}
              {step === 4 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">What is your current mileage?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Enter the current odometer reading in kilometers.</p>
                  </div>
                  <div className="relative">
                    <Gauge className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={mileage}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '' || /^\d*$/.test(v)) setMileage(v)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canContinue) goNext()
                      }}
                      placeholder="e.g. 45000"
                      inputMode="numeric"
                      className={`${inputCls} pl-9 pr-12`}
                      autoFocus
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
                  </div>
                  {mileage && (
                    <p className="text-xs text-muted-foreground">{Number(mileage).toLocaleString()} km</p>
                  )}
                </div>
              )}

              {/* Step 5: License plate */}
              {step === 5 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">What is your license plate?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Enter your vehicle registration number.</p>
                  </div>
                  <input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canContinue) goNext()
                    }}
                    placeholder="ABC-1234"
                    className={inputCls}
                    autoFocus
                  />
                </div>
              )}

              {/* Step 6: Color */}
              {step === 6 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">What is your vehicle&apos;s paint color?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Optional — helps identify your vehicle at a glance.</p>
                  </div>
                  <div className="relative">
                    <Palette className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') goNext()
                      }}
                      placeholder="e.g. Pearl White"
                      className={`${inputCls} pl-9`}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Review */}
              {step === 7 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Review your vehicle</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Make sure everything looks right before saving.</p>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl border border-border bg-secondary/20 p-4">
                    <ReviewRow label="Brand" value={make} onEdit={() => setStep(0)} />
                    <ReviewRow label="Model" value={model} onEdit={() => setStep(1)} />
                    <ReviewRow label="Production year" value={year !== null ? String(year) : ''} onEdit={() => setStep(2)} />
                    <ReviewRow label="Fuel type" value={FUEL_TYPES.find((ft) => ft.value === fuelType)?.label ?? ''} onEdit={() => setStep(3)} />
                    <ReviewRow label="Mileage" value={`${Number(mileage || 0).toLocaleString()} km`} onEdit={() => setStep(4)} />
                    <ReviewRow label="License plate" value={plate} onEdit={() => setStep(5)} />
                    <ReviewRow label="Paint / color" value={color || '—'} onEdit={() => setStep(6)} />
                  </div>
                </div>
              )}
        </div>

        {/* ── Footer with Continue / Save ── */}
        <div className="border-t border-slate-800 bg-slate-900 px-5 py-4 shrink-0">
          {step < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50"
            >
              Continue
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-blue-600 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save vehicle'}
                <Sparkles className="size-4" />
              </button>
            </div>
          )}
        </div>
    </Dialog>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="max-w-36 truncate text-sm font-semibold text-foreground sm:max-w-56">{value}</span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
            title={`Edit ${label}`}
          >
            <Pencil className="size-3" />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  )
}

function DeleteVehicleDialog({
  vehicle,
  onClose,
  onDeleted,
  onError,
}: {
  vehicle: Vehicle
  onClose: () => void
  onDeleted: () => void
  onError: (msg: string | null) => void
}) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!user || !vehicle.id) return

    try {
      setDeleting(true)
      onError(null)
      await deleteVehicle(user.uid, vehicle.id)
      onDeleted()
    } catch (error) {
      console.error(error)
      onError("Failed to delete vehicle. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} titleId="delete-vehicle-title">
      <DialogHeader onClose={onClose}>
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500"><Trash2 className="size-5" /></div>
        <DialogTitle id="delete-vehicle-title">Delete vehicle</DialogTitle>
        <DialogDescription>Are you sure you want to delete {vehicle.make} {vehicle.model}?</DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-3">
        <p className="text-sm text-slate-400 leading-relaxed">
          This action will permanently remove <strong className="font-semibold text-slate-100">{vehicle.make} {vehicle.model} ({vehicle.plate})</strong> and all its associated tracking data from your garage. This action cannot be undone.
        </p>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 h-11 rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 h-11 rounded-full bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
