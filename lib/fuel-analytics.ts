import type { FuelEntry } from './fuel'

export type FuelEntryWithEfficiency = FuelEntry & {
  efficiency: number | null
}

export type FuelAnalytics = {
  entries: FuelEntryWithEfficiency[]
  validFillUps: number
  totalDistance: number
  totalLiters: number
  totalCost: number
  averageEfficiency: number | null
  costPerKm: number | null
}

export function calculateFuelAnalytics(entries: FuelEntry[]): FuelAnalytics {
  const previousByVehicle = new Map<string, FuelEntry>()
  const efficiencyById = new Map<string, number | null>()
  let validFillUps = 0
  let totalDistance = 0
  let totalLiters = 0

  for (const entry of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    const previous = previousByVehicle.get(entry.vehicleId)
    const distance = previous ? entry.odometer - previous.odometer : 0
    const efficiency = distance > 0 && entry.liters > 0 ? distance / entry.liters : null

    efficiencyById.set(entry.id ?? '', efficiency)
    if (efficiency !== null) {
      validFillUps += 1
      totalDistance += distance
      totalLiters += entry.liters
    }
    previousByVehicle.set(entry.vehicleId, entry)
  }

  const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0)
  const displayedEntries = entries.map((entry) => ({ ...entry, efficiency: efficiencyById.get(entry.id ?? '') ?? null }))

  return {
    entries: displayedEntries,
    validFillUps,
    totalDistance,
    totalLiters,
    totalCost,
    averageEfficiency: totalLiters > 0 ? totalDistance / totalLiters : null,
    costPerKm: totalDistance > 0 ? totalCost / totalDistance : null,
  }
}
