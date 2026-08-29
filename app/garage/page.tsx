'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BatteryCharging,
  Car,
  Check,
  Fuel,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { PageHeading, ProgressBar, StatusPill } from '@/components/dashboard-ui'
import { useAuth } from '@/components/providers/auth-provider'

import { Vehicle, getVehicles, addVehicle, deleteVehicle, updateVehicle } from '@/lib/garage'

export default function GaragePage() {
  const { user } = useAuth()

const [vehicles, setVehicles] = useState<Vehicle[]>([])

const [loading, setLoading] = useState(true)

const [query, setQuery] = useState('')

const [filter, setFilter] =
  useState<'All' | 'Excellent' | 'Needs Service'>('All')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const loadVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([])
      setLoading(false)
      return
    }

    setLoading(true)
    setActionError(null)
    try {
      setVehicles(await getVehicles(user.uid))
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
  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesQuery = `${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(query.toLowerCase())
      const matchesFilter = filter === 'All' || (filter === 'Excellent' ? v.status === 'Excellent' : v.status === 'Needs Service')
      return matchesQuery && matchesFilter
    })
  }, [vehicles, query, filter])
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
        description="Track health, efficiency, mileage, and service status across every vehicle in your garage."
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

      <section className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search vehicles</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search make, model, or plate..."
            className="h-10 w-full rounded-xl border border-input bg-background/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal className="ml-1 size-4 shrink-0 text-muted-foreground" />
          {(['All', 'Excellent', 'Needs Service'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter === item ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vehicle, index) => (
          <article
            key={vehicle.id}
            className="glass animate-rise group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="grid-texture relative flex h-44 items-center justify-center overflow-hidden border-b border-border bg-secondary/20">
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <StatusPill tone={vehicle.status === 'Excellent' ? 'success' : vehicle.status === 'Good' ? 'accent' : 'warning'}>
                  {vehicle.status ?? 'Not assessed'}
                </StatusPill>
              </div>
              <div ref={openMenuId === vehicle.id ? menuRef : undefined} className="absolute right-4 top-4">
                <button
                  type="button"
                  onClick={() => setOpenMenuId((current) => current === vehicle.id ? null : vehicle.id ?? null)}
                  className="flex size-8 items-center justify-center rounded-lg border border-border bg-background/40 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
                  aria-label={`More options for ${vehicle.make} ${vehicle.model}`}
                  aria-expanded={openMenuId === vehicle.id}
                  aria-haspopup="menu"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {openMenuId === vehicle.id && (
                  <div role="menu" className="glass-strong absolute right-0 top-10 z-20 w-40 rounded-xl p-1.5 shadow-xl">
                    <button type="button" role="menuitem" onClick={() => { setEditingVehicle(vehicle); setOpenMenuId(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                      <Pencil className="size-3.5 text-primary" /> Edit vehicle
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setDeletingVehicle(vehicle); setOpenMenuId(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                      <Trash2 className="size-3.5" /> Delete vehicle
                    </button>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 h-5 w-2/3 -translate-x-1/2 rounded-full bg-primary/20 blur-xl" />
              <div className="relative flex flex-col items-center">
                <Car className="size-20 text-primary/80 transition-transform duration-500 group-hover:scale-105" strokeWidth={1.25} />
                <span className="mt-1 rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-md">
                  {vehicle.plate}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{vehicle.name}</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{vehicle.make} {vehicle.model}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{vehicle.year ?? 'Year not set'}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
                </div>
                <div className="flex size-11 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <span className="text-sm font-bold">{vehicle.health ?? '—'}</span>
                  <span className="text-[8px] uppercase">health</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="size-3.5" />
                    <span className="text-[10px] uppercase tracking-wider">Mileage</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{vehicle.mileage.toLocaleString()} km</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {vehicle.fuelType === 'Electric' ? <BatteryCharging className="size-3.5" /> : <Fuel className="size-3.5" />}
                    <span className="text-[10px] uppercase tracking-wider">Efficiency</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{vehicle.efficiency || 'Not available'}</p>
                </div>
              </div>

              {typeof vehicle.health === 'number' && <div className="mt-5">
                <ProgressBar value={vehicle.health} tone={vehicle.health > 85 ? 'success' : vehicle.health > 70 ? 'primary' : 'warning'} label="Vehicle health" />
              </div>}

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" /> Next service: {vehicle.nextService || 'Not scheduled'}
                </div>
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="group flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/20 p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus className="size-5" />
          </span>
          <span className="mt-4 text-sm font-semibold text-foreground">Add another vehicle</span>
          <span className="mt-1 max-w-48 text-xs leading-relaxed text-muted-foreground">Connect a vehicle to unlock smart monitoring and AI insights.</span>
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

      {dialogOpen && <AddVehicleDialog onClose={() => setDialogOpen(false)} onSaved={loadVehicles} />}
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
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [make, setMake] = useState(vehicle?.make ?? "")
  const [model, setModel] = useState(vehicle?.model ?? "")
  const [year, setYear] = useState(typeof vehicle?.year === 'number' ? String(vehicle.year) : "")
  const [plate, setPlate] = useState(vehicle?.plate ?? "")

  async function handleSave() {
    if (!user) return

    const parsedYear = Number(year)
    if (
      !make.trim() ||
      !model.trim() ||
      !year.trim() ||
      !plate.trim() ||
      !Number.isInteger(parsedYear) ||
      parsedYear < 1886
    ) {
      alert("Please fill all fields.")
      return
    }

    try {
      setSaving(true)

      if (vehicle) {
        if (!vehicle.id) {
          throw new Error("Vehicle ID is missing")
        }
        await updateVehicle(user.uid, vehicle.id, {
          name: `${make} ${model}`,
          make,
          model,
          year: parsedYear,
          plate,
        })
      } else {
        await addVehicle({
          uid: user.uid,
          name: `${make} ${model}`,
          make,
          model,
          year: parsedYear,
          plate,
          fuelType: "Petrol",
          mileage: 0,
          status: "Not assessed",
        })
      }

      onSaved()
      setStep(2)
    } catch (error) {
      console.error(error)
      alert("Failed to save vehicle.")
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title">
      <button type="button" className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} aria-label="Close dialog" />
      <div className="glass-strong relative w-full max-w-lg rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Car className="size-5" /></div>
            <h2 id="add-vehicle-title" className="text-xl font-semibold text-foreground">
              {vehicle ? "Edit vehicle" : "Add a vehicle"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {vehicle ? "Update your vehicle information." : "Set up smart monitoring in under a minute."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {step === 1 ? (
          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
              Vehicle make
              <input
  value={make}
  onChange={(e) => setMake(e.target.value)}
  className="h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground outline-none focus:border-primary/50"
  placeholder="e.g. Toyota"
/>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
              Model and year
              <div className="grid grid-cols-3 gap-3">
                <input
  value={model}
  onChange={(e) => setModel(e.target.value)}
  className="col-span-2 h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground outline-none focus:border-primary/50"
  placeholder="Corolla Altis"
/>
                <input
  value={year}
  onChange={(e) => setYear(e.target.value)}
  className="h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground outline-none focus:border-primary/50"
  placeholder="2024"
  inputMode="numeric"
/>
              </div>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
              License plate
              <input
  value={plate}
  onChange={(e) => setPlate(e.target.value)}
  className="h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground outline-none focus:border-primary/50"
  placeholder="ABC-1234"
/>
            </label>
            <button
  type="button"
  onClick={handleSave}
  disabled={saving}
  className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
>
  {saving ? "Saving..." : "Continue"}
  <Sparkles className="size-4" />
</button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center py-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/20"><Check className="size-7" /></div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {vehicle ? "Vehicle updated" : "Ready to connect"}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {vehicle
                ? "Your changes have been saved successfully throughout your workspace."
                : "Your vehicle profile is ready and available throughout your workspace."}
            </p>
            <button
  type="button"
  onClick={onClose}
  className="mt-6 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
>
  Done
</button>
          </div>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="delete-vehicle-title">
      <button type="button" className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} aria-label="Close dialog" />
      <div className="glass-strong relative w-full max-w-md rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive"><Trash2 className="size-5" /></div>
            <h2 id="delete-vehicle-title" className="text-xl font-semibold text-foreground">Delete vehicle</h2>
            <p className="mt-1 text-sm text-muted-foreground">Are you sure you want to delete {vehicle.make} {vehicle.model}?</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This action will permanently remove <strong className="font-semibold text-foreground">{vehicle.make} {vehicle.model} ({vehicle.plate})</strong> and all its associated tracking data from your garage. This action cannot be undone.
          </p>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 h-11 rounded-xl bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-11 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
