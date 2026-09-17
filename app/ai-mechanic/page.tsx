'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Car, Fuel, Gauge, Send, Sparkles, User, Wrench } from 'lucide-react'
import { StatusPill } from '@/components/dashboard-ui'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/components/providers/auth-provider'
import { getFuelEntries, type FuelEntry } from '@/lib/fuel'
import { getVehicles, type Vehicle } from '@/lib/garage'
import { BrandLogo } from '@/lib/vehicle-icons'
import { getMaintenanceRecords, getUpcomingServices, type MaintenanceRecord, type UpcomingServiceRecord } from '@/lib/maintenance'

type Message = { id: number; role: 'user' | 'assistant'; text: string }
const prompts = ['How can I improve my fuel economy?', 'When should I replace my brake pads?', 'Diagnose a rattling noise on cold start']

export default function AiMechanicPage() {
  const { user } = useAuth(); const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [fuel, setFuel] = useState<FuelEntry[]>([]); const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]); const [upcoming, setUpcoming] = useState<UpcomingServiceRecord[]>([]); const [selectedId, setSelectedId] = useState(''); const [messages, setMessages] = useState<Message[]>([]); const [input, setInput] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [isLoading, setIsLoading] = useState(false)
  const load = useCallback(async () => { if (!user) { setLoading(false); return } setLoading(true); setError(null); try { const garage = await getVehicles(user.uid); setVehicles(garage); setSelectedId((current) => garage.some((vehicle) => vehicle.id === current) ? current : garage[0]?.id ?? ''); const [fuelResult, maintenanceResult, upcomingResult] = await Promise.allSettled([getFuelEntries(user.uid), getMaintenanceRecords(user.uid), getUpcomingServices(user.uid)]); setFuel(fuelResult.status === 'fulfilled' ? fuelResult.value : []); setMaintenance(maintenanceResult.status === 'fulfilled' ? maintenanceResult.value : []); setUpcoming(upcomingResult.status === 'fulfilled' ? upcomingResult.value : []) } catch (reason) { console.error('Failed to load AI vehicle:', reason); setVehicles([]); setFuel([]); setMaintenance([]); setUpcoming([]); setError('Unable to load your Garage vehicle. You can still ask a general question.') } finally { setLoading(false) } }, [user])
  useEffect(() => { void load() }, [load])
  const vehicle = vehicles.find((item) => item.id === selectedId)
  const vehicleFuel = useMemo(() => fuel.filter((entry) => entry.vehicleId === selectedId).slice(0, 5), [fuel, selectedId])
  const vehicleMaintenance = useMemo(() => maintenance.filter((record) => record.vehicleId === selectedId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [maintenance, selectedId])
  const vehicleUpcoming = useMemo(() => upcoming.filter((record) => record.vehicleId === selectedId).sort((a, b) => {
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
    if (a.targetDate) return -1
    if (b.targetDate) return 1
    return 0
  }), [upcoming, selectedId])
  async function sendMessage(text = input) { const value = text.trim(); if (!value || isLoading) return; const id = Date.now(); setMessages((current) => [...current, { id, role: 'user', text: value }]); setInput(''); setIsLoading(true); try { const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: value, vehicle: vehicle ? { make: vehicle.make, model: vehicle.model, year: vehicle.year, mileage: vehicle.mileage, fuelType: vehicle.fuelType } : undefined, maintenance: vehicleMaintenance.map(({ service, date, mileage, notes }) => ({ service, date, mileage, notes })), fuel: vehicleFuel.map(({ date, liters, cost, odometer }) => ({ date, liters, cost, odometer })) }) }); const data = await response.json(); if (!response.ok || !data.reply) throw new Error('AI request failed'); setMessages((current) => [...current, { id: id + 1, role: 'assistant', text: data.reply }]) } catch { setMessages((current) => [...current, { id: id + 1, role: 'assistant', text: "Sorry, I couldn't contact the AI service. Please try again." }]) } finally { setIsLoading(false) } }
  if (loading) return <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground"><span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />Loading vehicle context...</div>
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50 shadow-lg backdrop-blur-sm">
        <header className="flex items-center justify-between border-b border-slate-800/50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">DriveWise AI Mechanic</h1>
              <p className="text-[11px] text-slate-400">Ask about your selected vehicle or a general concern.</p>
            </div>
          </div>
          <StatusPill tone="accent">AI guidance</StatusPill>
        </header>

        {error && (
          <div role="alert" className="m-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">
            {error}
          </div>
        )}

        <div className="scroll-slim flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="grid-texture flex size-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 text-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                <Sparkles className="size-8" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-100">What can I help diagnose?</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Describe a sound, warning light, performance issue, or ask about available service and fuel records.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {message.role === 'assistant' ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'rounded-tl-md border border-slate-700/50 bg-slate-800/40 text-slate-200'
                    : 'rounded-tr-md bg-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.2)]'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                ) : (
                  message.text
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-sm text-slate-500 font-medium animate-pulse">DriveWise AI is thinking...</div>}
        </div>

        <div className="border-t border-slate-800/50 p-3 sm:p-4 bg-slate-900/30">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scroll-slim">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-[10px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-800/50 p-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              rows={1}
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              placeholder="Describe what is happening with your vehicle..."
              aria-label="Message DriveWise"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isLoading}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:shadow-none"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            DriveWise can make mistakes. Always consult a certified mechanic for safety-critical issues.
          </p>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="relative overflow-hidden flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-md grid-texture">
          <h2 className="text-sm font-semibold text-slate-100">Active vehicle</h2>
          {vehicles.length ? (
            <>
              <div className="mt-3">
                <Select
                  value={selectedId}
                  onChange={setSelectedId}
                  options={vehicles.map(v => ({ value: v.id!, label: v.name }))}
                  placeholder="Select vehicle"
                />
              </div>
              <div className="mt-4 flex h-28 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/30 grid-texture shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                {vehicle ? (
                  <BrandLogo
                    brand={vehicle.make}
                    className="size-16 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    fallback={<Car className="size-16 text-blue-500/50 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />}
                  />
                ) : (
                  <Car className="size-16 text-blue-500/50 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
                )}
              </div>
              {vehicle && (
                <>
                  <p className="mt-4 text-sm font-semibold text-slate-100">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-slate-400">
                    {vehicle.year} · {vehicle.plate} · {vehicle.mileage.toLocaleString()} km
                  </p>
                </>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Add a vehicle in Garage to include vehicle-specific context in your diagnosis.
            </p>
          )}
        </section>

        <section className="animate-rise rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-slate-100">Diagnosis summary</h2>
          <div className="mt-4 flex flex-col gap-3">
            {[
              {
                icon: Wrench,
                label: 'Upcoming service',
                value: vehicleUpcoming[0]
                  ? `${vehicleUpcoming[0].service}${vehicleUpcoming[0].targetDate ? ` · ${new Date(`${vehicleUpcoming[0].targetDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}`
                  : 'No services planned',
              },
              {
                icon: Wrench,
                label: 'Latest maintenance',
                value: vehicleMaintenance[0]
                  ? `${vehicleMaintenance[0].service} · ${new Date(`${vehicleMaintenance[0].date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}${vehicleMaintenance[0].mileage ? ` · ${vehicleMaintenance[0].mileage.toLocaleString()} km` : ''}`
                  : 'No records',
              },
              {
                icon: Fuel,
                label: 'Fuel records',
                value: vehicleFuel.length ? `${vehicleFuel.length} record${vehicleFuel.length === 1 ? '' : 's'}` : 'No records',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3"
              >
                <item.icon className="size-4 shrink-0 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]" />
                <span className="flex-1 truncate text-xs text-slate-400">{item.label}</span>
                <span className="max-w-40 truncate text-xs font-semibold text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}
