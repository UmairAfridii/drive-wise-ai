'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, Pencil, Plus, Trash2, Wallet, Wrench, Clock, Check, AlertCircle, Car } from 'lucide-react'
import { PageHeading, SectionTitle, StatCard } from '@/components/dashboard-ui'
import { useAuth } from '@/components/providers/auth-provider'
import { getVehicles, type Vehicle } from '@/lib/garage'
import { BrandLogo } from '@/lib/vehicle-icons'
import {
  addMaintenanceRecord, deleteMaintenanceRecord, getMaintenanceRecords, type MaintenanceRecord, updateMaintenanceRecord,
  getUpcomingServices, addUpcomingService, updateUpcomingService, deleteUpcomingService, convertUpcomingToCompleted, type UpcomingServiceRecord, type ServicePriority
} from '@/lib/maintenance'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'

const money = (value: number) => `Rs ${Math.round(value).toLocaleString()}`
const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const getVehicleOptions = (vehicles: Vehicle[]) => vehicles.map(v => ({
  value: v.id!,
  label: v.name,
  icon: (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 p-0.5 shadow-inner">
      <BrandLogo
        brand={v.make}
        className="size-4 shrink-0 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        fallback={<Car className="size-3 text-slate-500" />}
      />
    </div>
  )
}))

export default function MaintenancePage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingServiceRecord[]>([])
  const [dialog, setDialog] = useState<'add' | MaintenanceRecord | null>(null)
  const [upcomingDialog, setUpcomingDialog] = useState<'add' | UpcomingServiceRecord | null>(null)
  const [completingUpcoming, setCompletingUpcoming] = useState<UpcomingServiceRecord | null>(null)
  const [deleting, setDeleting] = useState<MaintenanceRecord | UpcomingServiceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) { setVehicles([]); setRecords([]); setUpcoming([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const [garage, maintenance, upcomingData] = await Promise.all([
        getVehicles(user.uid),
        getMaintenanceRecords(user.uid),
        getUpcomingServices(user.uid)
      ])
      setVehicles(garage)
      setRecords(maintenance)
      setUpcoming(upcomingData)
    } catch (reason) {
      console.error('Failed to load maintenance data:', reason)
      setError('Unable to load your maintenance records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => {
    const year = new Date().getFullYear()
    const completed = records.filter((record) => new Date(`${record.date}T00:00:00`).getFullYear() === year)
    return { completed, upcoming, spend: completed.reduce((sum, record) => sum + record.cost, 0) }
  }, [records, upcoming])

  const timeline = useMemo(() => [...records].sort((a, b) => b.date.localeCompare(a.date)), [records])

  const sortedUpcoming = useMemo(() => [...upcoming].sort((a, b) => {
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
    if (a.targetDate) return -1
    if (b.targetDate) return 1
    return 0
  }), [upcoming])

  async function saveRecord(record: MaintenanceRecord) {
    if (!user) return

    if (completingUpcoming?.id) {
      const { id, ...recordWithoutId } = record
      await convertUpcomingToCompleted(user.uid, completingUpcoming.id, recordWithoutId)
      setCompletingUpcoming(null)
    } else if (record.id) {
      await updateMaintenanceRecord(user.uid, record.id, record)
    } else {
      await addMaintenanceRecord(record)
    }

    await load()
  }

  async function saveUpcoming(record: UpcomingServiceRecord) {
    if (!user) return
    if (record.id) await updateUpcomingService(user.uid, record.id, record)
    else await addUpcomingService(record)
    await load()
  }

  async function remove() {
    if (!user || !deleting?.id) return
    try {
      if ('cost' in deleting) {
        await deleteMaintenanceRecord(user.uid, deleting.id)
      } else {
        await deleteUpcomingService(user.uid, deleting.id)
      }
      setDeleting(null)
      await load()
    } catch (reason) {
      console.error('Failed to delete record:', reason)
      setError('Unable to delete this record. Please try again.')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <PageHeading
        eyebrow="Preventive care"
        title="Maintenance, before it becomes a problem"
        description="Track completed service and plan your next maintenance tasks."
        actions={
          <button
            type="button"
            onClick={() => setDialog('add')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-500 hover:-translate-y-0.5"
          >
            <Plus className="size-4" /> Add maintenance
          </button>
        }
      />
      {error && <Notice message={error} retry={load} />}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming services" value={String(stats.upcoming.length)} detail="Planned tasks" icon={Calendar} delay={0} />
        <StatCard label="Completed this year" value={String(stats.completed.length)} detail={String(new Date().getFullYear())} icon={CheckCircle2} delay={60} />
        <StatCard label="Maintenance spend" value={money(stats.spend)} detail={`Completed in ${new Date().getFullYear()}`} icon={Wallet} delay={120} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <section className="animate-rise rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 sm:p-6 shadow-lg backdrop-blur-sm lg:col-span-2">
          <SectionTitle title="Service timeline" description="All maintenance activity in chronological order" />
          <div className="mt-6 flex flex-col gap-3">
            {timeline.map((record) => (
              <article key={record.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-blue-500/30 hover:bg-slate-900/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{record.service}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <BrandLogo
                        brand={vehicles.find(v => v.id === record.vehicleId)?.make}
                        className="size-3.5 object-contain"
                        fallback={<Car className="size-3 text-slate-500" />}
                      />
                      <span>{record.vehicleName} · {formatDate(record.date)} · {record.mileage.toLocaleString()} km</span>
                    </p>
                    {record.notes && <p className="mt-2 text-xs leading-relaxed text-slate-400">{record.notes}</p>}
                    {record.nextServiceMileage > 0 && <p className="mt-2 text-[11px] font-medium text-blue-400">Next service mileage: {record.nextServiceMileage.toLocaleString()} km</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{money(record.cost)}</span>
                    <button type="button" onClick={() => setDialog(record)} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-100" aria-label={`Edit ${record.service}`}><Pencil className="size-4" /></button>
                    <button type="button" onClick={() => setDeleting(record)} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-500" aria-label={`Delete ${record.service}`}><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </article>
            ))}
            {!timeline.length && <EmptyTimeline />}
          </div>
        </section>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <section className="relative overflow-hidden flex flex-col animate-rise rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md grid-texture">
            <div className="flex items-center justify-between mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                <Wrench className="size-4" />
              </div>
              <button
                type="button"
                onClick={() => setUpcomingDialog('add')}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600/10 px-3 py-1.5 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-600/20"
              >
                <Plus className="size-3" /> Add upcoming
              </button>
            </div>

            <h2 className="text-sm font-semibold text-slate-100">Upcoming Service</h2>

            <div className="mt-4 flex flex-col gap-3">
              {sortedUpcoming.map((task) => (
                <UpcomingTaskCard
                  key={task.id}
                  task={task}
                  vehicles={vehicles}
                  onEdit={() => setUpcomingDialog(task)}
                  onDelete={() => setDeleting(task)}
                  onComplete={() => {
                    setCompletingUpcoming(task)
                    setDialog({
                      uid: user!.uid,
                      vehicleId: task.vehicleId,
                      vehicleName: task.vehicleName,
                      service: task.service,
                      cost: 0,
                      mileage: 0,
                      date: task.targetDate || new Date().toISOString().slice(0, 10),
                      nextServiceMileage: 0,
                      notes: task.notes || ''
                    })
                  }}
                />
              ))}
              {!sortedUpcoming.length && (
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 px-4 py-8 text-center">
                  <Clock className="mx-auto size-6 text-slate-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-100">No upcoming services</p>
                  <p className="mt-1 text-xs text-slate-400">Plan your next maintenance task so you don't forget it.</p>
                </div>
              )}
            </div>
          </section>

          <section className="animate-rise rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 sm:p-6 shadow-lg backdrop-blur-sm">
            <SectionTitle title="Cost overview" description="Maintenance spending" />
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/30 p-5 text-center">
              <Wallet className="mx-auto size-6 text-slate-500" />
              <p className="mt-2 text-sm font-semibold text-slate-100">{money(stats.spend)}</p>
              <p className="mt-1 text-xs text-slate-400">Completed maintenance this year</p>
            </div>
          </section>
        </div>
      </div>

      {dialog && (
        <MaintenanceDialog
          vehicles={vehicles}
          record={dialog === 'add' ? undefined : dialog}
          onClose={() => { setDialog(null); setCompletingUpcoming(null) }}
          onSave={async (record) => { await saveRecord(record); setDialog(null) }}
          isCompleting={!!completingUpcoming}
        />
      )}

      {upcomingDialog && (
        <UpcomingDialog
          vehicles={vehicles}
          record={upcomingDialog === 'add' ? undefined : upcomingDialog}
          onClose={() => setUpcomingDialog(null)}
          onSave={async (record) => { await saveUpcoming(record); setUpcomingDialog(null) }}
        />
      )}

      {deleting && (
        <DeleteDialog
          record={deleting}
          onClose={() => setDeleting(null)}
          onDelete={remove}
        />
      )}
    </div>
  )
}
function UpcomingTaskCard({ task, vehicles, onEdit, onDelete, onComplete }: { task: UpcomingServiceRecord; vehicles: Vehicle[]; onEdit: () => void; onDelete: () => void; onComplete: () => void }) {
  const vehicle = vehicles.find((v) => v.id === task.vehicleId)

  // Status logic
  let statusInfo = { label: 'Planned', color: 'text-blue-400', bg: 'bg-blue-400/10' }

  if (task.targetDate) {
    const target = new Date(task.targetDate)
    const now = new Date()
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24))

    if (diffDays < 0) {
      statusInfo = { label: 'Overdue', color: 'text-rose-500', bg: 'bg-rose-500/10' }
    } else if (diffDays <= 14) {
      statusInfo = { label: 'Due Soon', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    }
  } else if (task.targetMileage && vehicle) {
    const diffKm = task.targetMileage - vehicle.mileage
    if (diffKm < 0) {
      statusInfo = { label: 'Overdue', color: 'text-rose-500', bg: 'bg-rose-500/10' }
    } else if (diffKm <= 1000) {
      statusInfo = { label: 'Due Soon', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    }
  }

  return (
    <article className="group rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-all hover:border-blue-500/30 hover:bg-slate-900/60">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-100">{task.service}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <BrandLogo
              brand={vehicle?.make}
              className="size-3.5 object-contain"
              fallback={<Car className="size-3 text-slate-500" />}
            />
            <span>{task.vehicleName}</span>
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
            {task.targetDate && (
              <span className="flex items-center gap-1 rounded bg-slate-800/50 px-1.5 py-0.5">
                <Calendar className="size-3" /> {formatDate(task.targetDate)}
              </span>
            )}
            {task.targetMileage && (
              <span className="flex items-center gap-1 rounded bg-slate-800/50 px-1.5 py-0.5">
                <Wrench className="size-3" /> {task.targetMileage.toLocaleString()} km
              </span>
            )}
            <span className="flex items-center gap-1 rounded bg-slate-800/50 px-1.5 py-0.5">
              <AlertCircle className="size-3" /> {task.priority}
            </span>
          </div>

          {task.notes && (
            <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">{task.notes}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onComplete}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20"
        >
          <Check className="size-3.5" /> Mark completed
        </button>
        <div className="flex gap-1">
          <button type="button" onClick={onEdit} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-100" aria-label="Edit upcoming service"><Pencil className="size-3.5" /></button>
          <button type="button" onClick={onDelete} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-500" aria-label="Delete upcoming service"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </article>
  )
}

function MaintenanceDialog({ vehicles, record, onClose, onSave, isCompleting = false }: { vehicles: Vehicle[]; record?: MaintenanceRecord; onClose: () => void; onSave: (record: MaintenanceRecord) => Promise<void>; isCompleting?: boolean }) {
  const { user } = useAuth()
  const [vehicleId, setVehicleId] = useState(record?.vehicleId ?? vehicles[0]?.id ?? '')
  const [service, setService] = useState(record?.service ?? '')
  const [cost, setCost] = useState(record?.cost?.toString() ?? '')
  const [mileage, setMileage] = useState(record?.mileage?.toString() ?? '')
  const [date, setDate] = useState(record?.date ?? new Date().toISOString().slice(0, 10))
  const [nextMileage, setNextMileage] = useState(record?.nextServiceMileage?.toString() ?? '')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vehicle = vehicles.find((item) => item.id === vehicleId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedCost = Number(cost), parsedMileage = Number(mileage), parsedNextMileage = nextMileage.trim() ? Number(nextMileage) : 0
    if (!user || !vehicle || !service.trim() || !date || parsedCost < 0 || parsedMileage < 0 || parsedNextMileage < 0) {
      setError('Select a vehicle and enter valid service, cost, mileage, date, and next-service mileage values.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...(record?.id ? { id: record.id } : {}),
        uid: user.uid,
        vehicleId,
        vehicleName: vehicle.name,
        service: service.trim(),
        cost: parsedCost,
        mileage: parsedMileage,
        date,
        nextServiceMileage: parsedNextMileage,
        notes: notes.trim()
      })
    } catch (reason) {
      console.error('Failed to save maintenance record:', reason)
      setError('Unable to save this maintenance record. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} titleId="maintenance-dialog">
      <form onSubmit={submit}>
        <div className="mb-4">
          <h2 id="maintenance-dialog" className="text-xl font-semibold text-slate-100">
            {isCompleting ? 'Complete upcoming service' : record ? 'Edit maintenance' : 'Add maintenance'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isCompleting ? 'Confirm details to convert this planned task into a completed record.' : 'Record completed service for a vehicle in your Garage.'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-2 block text-xs font-medium text-slate-400">Vehicle</label>
            <Select
              value={vehicleId}
              onChange={setVehicleId}
              options={getVehicleOptions(vehicles)}
              disabled={!vehicles.length || isCompleting}
            />
          </div>

          <Input label="Service" value={service} setValue={setService} placeholder="Oil change" />
          <Input label="Cost (Rs)" value={cost} setValue={setCost} inputMode="decimal" placeholder="8,500" />
          <Input label="Mileage" value={mileage} setValue={setMileage} inputMode="numeric" placeholder="41,250" />
          <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
            Date
            <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50" />
          </label>
          <Input label="Next service mileage" value={nextMileage} setValue={setNextMileage} inputMode="numeric" placeholder="Optional" required={false} />

          <label className="col-span-2 flex flex-col gap-2 text-xs font-medium text-slate-400">
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50" />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 text-xs text-rose-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700">Cancel</button>
          <button type="submit" disabled={saving || !vehicles.length} className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors hover:bg-blue-500 disabled:opacity-50">
            {saving ? 'Saving...' : record && !isCompleting ? 'Save changes' : 'Save record'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function UpcomingDialog({ vehicles, record, onClose, onSave }: { vehicles: Vehicle[]; record?: UpcomingServiceRecord; onClose: () => void; onSave: (record: UpcomingServiceRecord) => Promise<void> }) {
  const { user } = useAuth()
  const [vehicleId, setVehicleId] = useState(record?.vehicleId ?? vehicles[0]?.id ?? '')
  const [service, setService] = useState(record?.service ?? '')
  const [targetMileage, setTargetMileage] = useState(record?.targetMileage?.toString() ?? '')
  const [targetDate, setTargetDate] = useState(record?.targetDate ?? '')
  const [priority, setPriority] = useState<ServicePriority>(record?.priority ?? 'Medium')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vehicle = vehicles.find((item) => item.id === vehicleId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedTargetMileage = targetMileage.trim() ? Number(targetMileage) : undefined

    if (!user || !vehicle || !service.trim()) {
      setError('Please select a vehicle and enter a service name.')
      return
    }
    if (!parsedTargetMileage && !targetDate) {
      setError('Please provide at least a target mileage or target date.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...(record?.id ? { id: record.id } : {}),
        uid: user.uid,
        vehicleId,
        vehicleName: vehicle.name,
        service: service.trim(),
        targetMileage: parsedTargetMileage,
        targetDate: targetDate || undefined,
        priority,
        notes: notes.trim() || undefined
      })
    } catch (reason) {
      console.error('Failed to save upcoming service:', reason)
      setError('Unable to save this service. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} titleId="upcoming-dialog">
      <form onSubmit={submit}>
        <div className="mb-4">
          <h2 id="upcoming-dialog" className="text-xl font-semibold text-slate-100">{record ? 'Edit upcoming service' : 'Add upcoming service'}</h2>
          <p className="mt-1 text-sm text-slate-400">Plan your next maintenance task so you don't forget it.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-2 block text-xs font-medium text-slate-400">Vehicle</label>
            <Select
              value={vehicleId}
              onChange={setVehicleId}
              options={getVehicleOptions(vehicles)}
              disabled={!vehicles.length}
            />
          </div>

          <div className="col-span-2">
            <Input label="Service / Task" value={service} setValue={setService} placeholder="Engine oil change" />
          </div>

          <Input label="Target Mileage" value={targetMileage} setValue={setTargetMileage} inputMode="numeric" placeholder="Optional" required={false} />

          <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
            Target Date <span className="opacity-50">(Optional)</span>
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="h-11 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50" />
          </label>

          <div className="col-span-2">
            <label className="mb-2 block text-xs font-medium text-slate-400">Priority</label>
            <div className="flex gap-2">
              {(['Low', 'Medium', 'High'] as ServicePriority[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    priority === level
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <label className="col-span-2 flex flex-col gap-2 text-xs font-medium text-slate-400">
            Notes (Free-form)
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Inspect brakes and replace front pads if needed."
              className="min-h-20 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 text-xs text-rose-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700">Cancel</button>
          <button type="submit" disabled={saving || !vehicles.length} className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors hover:bg-blue-500 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save task'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function Input({ label, value, setValue, placeholder, inputMode, required = true }: { label: string; value: string; setValue: (value: string) => void; placeholder: string; inputMode?: 'decimal' | 'numeric'; required?: boolean }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
      />
    </label>
  )
}

function EmptyTimeline() {
  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 px-5 py-14 text-center">
      <Calendar className="mx-auto size-8 text-slate-600" />
      <p className="mt-3 text-sm font-semibold text-slate-200">No maintenance records yet</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Add completed service to build your maintenance timeline.</p>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-400">
      <span className="size-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      Loading maintenance...
    </div>
  )
}

function Notice({ message, retry }: { message: string; retry: () => Promise<void> }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
      <span>{message}</span>
      <button type="button" onClick={() => void retry()} className="font-semibold hover:text-rose-400 transition-colors">Retry</button>
    </div>
  )
}

function DeleteDialog({ record, onClose, onDelete }: { record: MaintenanceRecord | UpcomingServiceRecord; onClose: () => void; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)
  const isUpcoming = !('cost' in record)

  return (
    <Dialog open={true} onClose={onClose} titleId="delete-maintenance-title">
      <div className="mb-6">
        <h2 id="delete-maintenance-title" className="text-xl font-semibold text-slate-100">
          {isUpcoming ? 'Delete upcoming service' : 'Delete maintenance record'}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Delete “{record.service}” for {record.vehicleName}? This cannot be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={deleting} className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700">Cancel</button>
        <button type="button" disabled={deleting} onClick={async () => { setDeleting(true); await onDelete() }} className="h-11 flex-1 rounded-xl bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50">
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Dialog>
  )
}
