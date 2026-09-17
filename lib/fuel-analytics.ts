import type { FuelEntry } from './fuel'
import { getFuelMeasurementUnits } from './pakistan-fuel-prices'

export type FuelEntryWithAnalytics = FuelEntry & {
  distance: number | null
  efficiency: number | null
  costPerKm: number | null
  pricePerUnit: number
  pricePerLiter: number // Preserved for backward compatibility
  diagnosticReason?: string
  isSuspicious?: boolean
  suspiciousWarning?: string
}

export type EfficiencyTrendPoint = {
  date: string
  odometer: number
  efficiency: number
  distance: number
  liters: number
  isSuspicious?: boolean
}

export type PriceHistoryPoint = {
  date: string
  pricePerUnit: number
  pricePerLiter: number // Preserved for backward compatibility
  liters: number
  cost: number
  odometer: number
}

export type VehicleFuelAnalytics = {
  vehicleId: string
  fuelType?: string
  volumeUnit: 'L' | 'kg'
  efficiencyUnit: 'km/L' | 'km/kg'
  priceUnit: 'PKR/L' | 'PKR/kg'
  entries: FuelEntryWithAnalytics[] // Reverse chronological for history display
  validFillUps: number
  totalDistance: number
  totalLiters: number
  totalCost: number
  measuredCost: number
  averageEfficiency: number | null
  costPerKm: number | null
  diagnosticMessage: string
  totalSpendThisMonth: number
  fuelVolumeThisMonth: number
  fillUpCountThisMonth: number
  efficiencyTrend: EfficiencyTrendPoint[] // Chronological for trend plotting
  priceHistory: PriceHistoryPoint[] // Chronological for price plotting
  monthlySpend: number[] // 12 months of current year
  hasSuspiciousEntries: boolean
}

// Legacy compatibility type
export type FuelEntryWithEfficiency = FuelEntry & {
  efficiency: number | null
}

export type FuelAnalytics = {
  entries: FuelEntryWithEfficiency[]
  validFillUps: number
  totalDistance: number
  totalLiters: number
  totalCost: number
  measuredCost: number
  averageEfficiency: number | null
  costPerKm: number | null
}

export interface EfficiencyThresholds {
  min: number
  max: number
}

/**
 * Reasonable passenger vehicle fuel efficiency thresholds.
 * Readings outside these bounds are flagged as suspicious (e.g., 294.1 km/L).
 */
export const DEFAULT_EFFICIENCY_THRESHOLDS: Record<string, EfficiencyThresholds> = {
  petrol: { min: 3, max: 40 },
  gasoline: { min: 3, max: 40 },
  diesel: { min: 3, max: 35 },
  lpg: { min: 2.5, max: 30 },
  cng: { min: 3, max: 35 },
  hybrid: { min: 3, max: 40 },
  default: { min: 3, max: 40 },
}

/**
 * Checks whether a calculated efficiency is implausible for passenger vehicles.
 */
export function isEfficiencySuspicious(
  efficiency: number,
  fuelType?: string,
  thresholds: Record<string, EfficiencyThresholds> = DEFAULT_EFFICIENCY_THRESHOLDS
): boolean {
  if (efficiency <= 0 || !Number.isFinite(efficiency)) return true
  const norm = (fuelType ?? '').toLowerCase().trim()
  let range = thresholds.default
  for (const key of Object.keys(thresholds)) {
    if (key !== 'default' && norm.includes(key)) {
      range = thresholds[key]
      break
    }
  }
  return efficiency < range.min || efficiency > range.max
}

/**
 * Calculates detailed fuel analytics for a specific vehicle.
 * Implements strict sequential odometer-based distance & efficiency tracking,
 * dynamic units by fuel type (L vs kg), and abnormal data detection.
 */
export function calculateVehicleFuelAnalytics(
  entries: FuelEntry[],
  vehicleId: string,
  fuelType?: string
): VehicleFuelAnalytics {
  const units = getFuelMeasurementUnits(fuelType)
  const vehicleEntries = entries.filter((e) => e.vehicleId === vehicleId)

  // Sort chronologically: date ascending, with odometer ascending as tie-breaker
  const chronological = [...vehicleEntries].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date)
    if (dateComp !== 0) return dateComp
    return a.odometer - b.odometer
  })

  let validFillUps = 0
  let totalDistance = 0
  let totalLiters = 0
  let measuredCost = 0
  let hasSuspiciousEntries = false
  let invalidOdometerIssue: string | null = null

  const efficiencyTrend: EfficiencyTrendPoint[] = []
  const priceHistory: PriceHistoryPoint[] = []
  const analyzedChronological: FuelEntryWithAnalytics[] = []

  for (let i = 0; i < chronological.length; i++) {
    const entry = chronological[i]
    const pricePerUnit = entry.liters > 0 ? entry.cost / entry.liters : 0

    priceHistory.push({
      date: entry.date,
      pricePerUnit,
      pricePerLiter: pricePerUnit,
      liters: entry.liters,
      cost: entry.cost,
      odometer: entry.odometer,
    })

    if (i === 0) {
      // First entry is the initial baseline anchor
      analyzedChronological.push({
        ...entry,
        distance: null,
        efficiency: null,
        costPerKm: null,
        pricePerUnit,
        pricePerLiter: pricePerUnit,
        diagnosticReason: `First fill-up recorded at ${entry.odometer.toLocaleString()} km. Log your next fill-up to calculate efficiency and cost per km.`,
      })
      continue
    }

    const previous = chronological[i - 1]
    const distance = entry.odometer - previous.odometer

    if (distance <= 0) {
      const reason = `Odometer reading ${entry.odometer.toLocaleString()} km must be greater than previous fill-up ${previous.odometer.toLocaleString()} km to calculate distance.`
      if (!invalidOdometerIssue) invalidOdometerIssue = reason
      analyzedChronological.push({
        ...entry,
        distance: null,
        efficiency: null,
        costPerKm: null,
        pricePerUnit,
        pricePerLiter: pricePerUnit,
        diagnosticReason: reason,
      })
      continue
    }

    if (entry.liters <= 0) {
      analyzedChronological.push({
        ...entry,
        distance: null,
        efficiency: null,
        costPerKm: null,
        pricePerUnit,
        pricePerLiter: pricePerUnit,
        diagnosticReason: 'Fuel amount must be greater than 0',
      })
      continue
    }

    const efficiency = distance / entry.liters
    const costPerKm = entry.cost / distance
    const suspicious = isEfficiencySuspicious(efficiency, fuelType)

    if (suspicious) {
      hasSuspiciousEntries = true
      // Mark entry as suspicious, do not invent replacement, do not distort aggregate averages or trend
      analyzedChronological.push({
        ...entry,
        distance,
        efficiency,
        costPerKm,
        pricePerUnit,
        pricePerLiter: pricePerUnit,
        isSuspicious: true,
        suspiciousWarning: 'Unusual fuel-efficiency reading. Check the odometer and fuel amount.',
      })
      continue
    }

    // Valid, plausible interval
    validFillUps += 1
    totalDistance += distance
    totalLiters += entry.liters
    measuredCost += entry.cost

    efficiencyTrend.push({
      date: entry.date,
      odometer: entry.odometer,
      efficiency,
      distance,
      liters: entry.liters,
      isSuspicious: false,
    })

    analyzedChronological.push({
      ...entry,
      distance,
      efficiency,
      costPerKm,
      pricePerUnit,
      pricePerLiter: pricePerUnit,
      isSuspicious: false,
    })
  }

  // Monthly stats for current year
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const monthlySpend = Array<number>(12).fill(0)
  let totalSpendThisMonth = 0
  let fuelVolumeThisMonth = 0
  let fillUpCountThisMonth = 0

  for (const entry of vehicleEntries) {
    const d = new Date(`${entry.date}T00:00:00`)
    if (d.getFullYear() === currentYear) {
      monthlySpend[d.getMonth()] += entry.cost
      if (d.getMonth() === currentMonth) {
        totalSpendThisMonth += entry.cost
        fuelVolumeThisMonth += entry.liters
        fillUpCountThisMonth += 1
      }
    }
  }

  const totalCost = vehicleEntries.reduce((sum, e) => sum + e.cost, 0)
  const averageEfficiency = totalLiters > 0 ? totalDistance / totalLiters : null
  const costPerKm = totalDistance > 0 ? measuredCost / totalDistance : null

  // Diagnostic message
  let diagnosticMessage = ''
  if (chronological.length === 0) {
    diagnosticMessage = 'No fuel logs recorded yet for this vehicle. Add your first fill-up.'
  } else if (chronological.length === 1) {
    diagnosticMessage = `First fill-up recorded at ${chronological[0].odometer.toLocaleString()} km. Log your next fill-up to calculate efficiency and cost per km.`
  } else if (validFillUps === 0) {
    if (invalidOdometerIssue) {
      diagnosticMessage = invalidOdometerIssue
    } else if (hasSuspiciousEntries) {
      diagnosticMessage = 'All recorded intervals contain unusual efficiency readings. Check odometer and fuel quantities.'
    } else {
      diagnosticMessage = 'Odometer readings must increase between fill-ups. Check that latest readings are higher than previous logs to calculate distance.'
    }
  } else {
    diagnosticMessage = `Calculated across ${validFillUps} fill-up ${validFillUps === 1 ? 'interval' : 'intervals'} (${totalDistance.toLocaleString()} km measured).`
    if (hasSuspiciousEntries) {
      diagnosticMessage += ' (Excludes intervals with unusual readings to maintain accurate averages.)'
    }
  }

  // Reverse chronological for fuel history display (newest first)
  const entriesForDisplay = [...analyzedChronological].sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date)
    if (dateComp !== 0) return dateComp
    return b.odometer - a.odometer
  })

  return {
    vehicleId,
    fuelType,
    volumeUnit: units.volumeUnit,
    efficiencyUnit: units.efficiencyUnit,
    priceUnit: units.priceUnit,
    entries: entriesForDisplay,
    validFillUps,
    totalDistance,
    totalLiters,
    totalCost,
    measuredCost,
    averageEfficiency,
    costPerKm,
    diagnosticMessage,
    totalSpendThisMonth,
    fuelVolumeThisMonth,
    fillUpCountThisMonth,
    efficiencyTrend,
    priceHistory,
    monthlySpend,
    hasSuspiciousEntries,
  }
}

/**
 * Legacy calculation across all entries (preserved for backward compatibility).
 */
export function calculateFuelAnalytics(entries: FuelEntry[]): FuelAnalytics {
  const previousByVehicle = new Map<string, FuelEntry>()
  const efficiencyById = new Map<string, number | null>()
  let validFillUps = 0
  let totalDistance = 0
  let totalLiters = 0
  let measuredCost = 0

  const sorted = [...entries].sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    if (d !== 0) return d
    return a.odometer - b.odometer
  })

  for (const entry of sorted) {
    const previous = previousByVehicle.get(entry.vehicleId)
    const distance = previous ? entry.odometer - previous.odometer : 0
    const efficiency = distance > 0 && entry.liters > 0 ? distance / entry.liters : null

    efficiencyById.set(entry.id ?? '', efficiency)
    if (efficiency !== null) {
      validFillUps += 1
      totalDistance += distance
      totalLiters += entry.liters
      measuredCost += entry.cost
    }
    previousByVehicle.set(entry.vehicleId, entry)
  }

  const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0)
  const displayedEntries = entries.map((entry) => ({
    ...entry,
    efficiency: efficiencyById.get(entry.id ?? '') ?? null,
  }))

  return {
    entries: displayedEntries,
    validFillUps,
    totalDistance,
    totalLiters,
    totalCost,
    measuredCost,
    averageEfficiency: totalLiters > 0 ? totalDistance / totalLiters : null,
    costPerKm: totalDistance > 0 ? measuredCost / totalDistance : null,
  }
}
