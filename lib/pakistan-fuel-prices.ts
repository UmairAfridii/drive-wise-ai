/**
 * Official Pakistan retail petroleum and fuel reference rates.
 * Prices are notified bi-weekly by the Federal Ministry of Finance & OGRA.
 *
 * NOTE: This module serves as an informational current market reference panel only.
 * It NEVER overwrites historical user fuel records, which preserve the user's
 * actual station pump costs.
 */

export interface FuelReferenceItem {
  name: string
  price: number | null // null when regional/not available nationwide
  unit: 'L' | 'kg'
  displayPrice: string
  displayUnit: string
  effectiveDate: string
  source: string
  isAvailable: boolean
  notes?: string
}

export interface PakistanFuelPricesData {
  petrol: FuelReferenceItem
  octanePlus: FuelReferenceItem
  diesel: FuelReferenceItem
  lpg: FuelReferenceItem
  cng: FuelReferenceItem
  effectiveDate: string
  source: string
  currency: string
}

export const PAKISTAN_FUEL_PRICES_DATA: PakistanFuelPricesData = {
  petrol: {
    name: 'Premier Euro 5',
    price: 391.22,
    unit: 'L',
    displayPrice: 'Rs 391.22',
    displayUnit: '/L',
    effectiveDate: 'Latest',
    source: 'Official Rate',
    isAvailable: true,
  },
  octanePlus: {
    name: 'Octane+',
    price: 400,
    unit: 'L',
    displayPrice: 'Rs 400.00',
    displayUnit: '/L',
    effectiveDate: 'Latest',
    source: 'Karachi',
    isAvailable: true,
  },
  diesel: {
    name: 'Hi-Cetane Diesel Euro 5',
    price: 421.45,
    unit: 'L',
    displayPrice: 'Rs 421.45',
    displayUnit: '/L',
    effectiveDate: 'Latest',
    source: 'Official Rate',
    isAvailable: true,
  },
  lpg: {
    name: 'Liquefied Petroleum Gas (LPG)',
    price: 258.65,
    unit: 'kg',
    displayPrice: 'Rs 258.65',
    displayUnit: '/kg',
    effectiveDate: 'Latest',
    source: 'PSO',
    isAvailable: true,
  },
  cng: {
    name: 'Kohat CNG Reference',
    price: 349,
    unit: 'kg',
    displayPrice: 'Rs 349.00',
    displayUnit: '/kg',
    effectiveDate: 'September 15, 2026',
    source: 'Kohat Regional Benchmark',
    isAvailable: true,
    notes:
      'Kohat regional reference tariff (Rs 349/kg). Not a nationwide rate; station pump rates vary by region.',
  },
  effectiveDate: 'Latest',
  source: 'Reference Pricing',
  currency: 'PKR',
}

/**
 * Backward-compatible reference object.
 */
export const PAKISTAN_FUEL_PRICES = {
  petrol: PAKISTAN_FUEL_PRICES_DATA.petrol.price!,
  octanePlus: PAKISTAN_FUEL_PRICES_DATA.octanePlus.price!,
  diesel: PAKISTAN_FUEL_PRICES_DATA.diesel.price!,
  lpg: PAKISTAN_FUEL_PRICES_DATA.lpg.price!,
  cng: PAKISTAN_FUEL_PRICES_DATA.cng.price,
  effectiveDate: 'Latest',
  source: 'Reference Pricing',
  currency: 'PKR',
  items: PAKISTAN_FUEL_PRICES_DATA,
}

export type FuelMeasurementUnits = {
  volumeUnit: 'L' | 'kg'
  efficiencyUnit: 'km/L' | 'km/kg'
  priceUnit: 'PKR/L' | 'PKR/kg'
  amountLabel: string
  pricePerUnitLabel: string
  pricePerUnitShort: string
}

/**
 * Returns measurement units based on the vehicle fuel type.
 * Petrol / Gasoline / Hybrid -> L, km/L, PKR/L
 * Diesel -> L, km/L, PKR/L
 * CNG / LPG -> kg, km/kg, PKR/kg
 */
export function getFuelMeasurementUnits(fuelType?: string): FuelMeasurementUnits {
  const norm = (fuelType ?? '').toLowerCase().trim()
  const isKg = norm === 'cng' || norm === 'lpg' || norm.includes('cng') || norm.includes('lpg')

  if (isKg) {
    return {
      volumeUnit: 'kg',
      efficiencyUnit: 'km/kg',
      priceUnit: 'PKR/kg',
      amountLabel: 'Fuel amount (kg)',
      pricePerUnitLabel: 'Price / kg',
      pricePerUnitShort: 'Rs/kg',
    }
  }

  return {
    volumeUnit: 'L',
    efficiencyUnit: 'km/L',
    priceUnit: 'PKR/L',
    amountLabel: 'Fuel amount (L)',
    pricePerUnitLabel: 'Price / Litre',
    pricePerUnitShort: 'Rs/L',
  }
}

export interface FuelTypeReferenceRate {
  price: number | null
  unit: 'L' | 'kg'
  displayUnit: string
  priceUnit: 'PKR/L' | 'PKR/kg'
  formattedPrice: string
  source: string
  effectiveDate: string
  isAvailable: boolean
  label: string
}

/**
 * Finds the official reference price and source for a vehicle's fuel type.
 */
export function getReferencePriceForFuelType(fuelType?: string): FuelTypeReferenceRate {
  const norm = (fuelType ?? '').toLowerCase().trim()

  if (norm.includes('diesel')) {
    return {
      price: PAKISTAN_FUEL_PRICES_DATA.diesel.price,
      unit: 'L',
      displayUnit: '/L',
      priceUnit: 'PKR/L',
      formattedPrice: `Rs ${PAKISTAN_FUEL_PRICES_DATA.diesel.price?.toFixed(2)}/L`,
      source: PAKISTAN_FUEL_PRICES_DATA.diesel.source,
      effectiveDate: PAKISTAN_FUEL_PRICES_DATA.diesel.effectiveDate,
      isAvailable: true,
      label: 'High-Speed Diesel (HSD)',
    }
  }

  if (norm.includes('lpg')) {
    return {
      price: PAKISTAN_FUEL_PRICES_DATA.lpg.price,
      unit: 'kg',
      displayUnit: '/kg',
      priceUnit: 'PKR/kg',
      formattedPrice: `Rs ${PAKISTAN_FUEL_PRICES_DATA.lpg.price?.toFixed(2)}/kg`,
      source: PAKISTAN_FUEL_PRICES_DATA.lpg.source,
      effectiveDate: PAKISTAN_FUEL_PRICES_DATA.lpg.effectiveDate,
      isAvailable: true,
      label: 'Liquefied Petroleum Gas (LPG)',
    }
  }

  if (norm.includes('cng')) {
    return {
      price: PAKISTAN_FUEL_PRICES_DATA.cng.price,
      unit: 'kg',
      displayUnit: '/kg',
      priceUnit: 'PKR/kg',
      formattedPrice: `Rs ${PAKISTAN_FUEL_PRICES_DATA.cng.price?.toFixed(2)}/kg`,
      source: PAKISTAN_FUEL_PRICES_DATA.cng.source,
      effectiveDate: PAKISTAN_FUEL_PRICES_DATA.cng.effectiveDate,
      isAvailable: true,
      label: 'Kohat CNG Reference',
    }
  }

  if (norm.includes('octane') || norm === 'premium' || norm.includes('high octane')) {
    return {
      price: PAKISTAN_FUEL_PRICES_DATA.octanePlus.price,
      unit: 'L',
      displayUnit: '/L',
      priceUnit: 'PKR/L',
      formattedPrice: `Rs ${PAKISTAN_FUEL_PRICES_DATA.octanePlus.price?.toFixed(2)}/L`,
      source: PAKISTAN_FUEL_PRICES_DATA.octanePlus.source,
      effectiveDate: PAKISTAN_FUEL_PRICES_DATA.octanePlus.effectiveDate,
      isAvailable: true,
      label: PAKISTAN_FUEL_PRICES_DATA.octanePlus.name,
    }
  }

  // Default: Petrol / Gasoline / Hybrid / other
  return {
    price: PAKISTAN_FUEL_PRICES_DATA.petrol.price,
    unit: 'L',
    displayUnit: '/L',
    priceUnit: 'PKR/L',
    formattedPrice: `Rs ${PAKISTAN_FUEL_PRICES_DATA.petrol.price?.toFixed(2)}/L`,
    source: PAKISTAN_FUEL_PRICES_DATA.petrol.source,
    effectiveDate: PAKISTAN_FUEL_PRICES_DATA.petrol.effectiveDate,
    isAvailable: true,
    label: PAKISTAN_FUEL_PRICES_DATA.petrol.name,
  }
}

export function formatPKRPrice(price: number, unit: 'L' | 'kg' = 'L'): string {
  return `Rs ${price.toFixed(2)}/${unit}`
}
