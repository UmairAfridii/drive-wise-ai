/**
 * Static vehicle brand and model dataset.
 * Structured for the Add Vehicle wizard.
 * Expand by adding entries to VEHICLE_BRANDS.
 */

export type VehicleBrand = {
  name: string
  models: string[]
}

export const VEHICLE_BRANDS: VehicleBrand[] = [
  {
    name: 'Toyota',
    models: [
      'Corolla', 'Corolla Altis', 'Corolla Cross', 'Camry', 'Yaris',
      'Hilux', 'Fortuner', 'Land Cruiser', 'Prado', 'RAV4',
      'Prius', 'Aqua', 'Vitz', 'Rush', 'Avanza', 'Hiace',
    ],
  },
  {
    name: 'Honda',
    models: [
      'Civic', 'City', 'Accord', 'BR-V', 'HR-V', 'CR-V',
      'Fit', 'Vezel', 'WR-V', 'Odyssey',
    ],
  },
  {
    name: 'Suzuki',
    models: [
      'Alto', 'Cultus', 'Swift', 'WagonR', 'Bolan', 'Ravi',
      'Jimny', 'Vitara', 'Every', 'APV',
    ],
  },
  {
    name: 'Hyundai',
    models: [
      'Tucson', 'Elantra', 'Sonata', 'Santa Fe', 'Ioniq',
      'Venue', 'Creta', 'Staria', 'Palisade', 'Kona',
    ],
  },
  {
    name: 'Kia',
    models: [
      'Sportage', 'Picanto', 'Stonic', 'Sorento', 'Carnival',
      'Seltos', 'Forte', 'Niro', 'EV6', 'Rio',
    ],
  },
  {
    name: 'BMW',
    models: [
      '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5',
      'X7', 'Z4', 'iX', 'i4',
    ],
  },
  {
    name: 'Mercedes-Benz',
    models: [
      'C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA',
      'GLC', 'GLE', 'GLS', 'EQC', 'CLA',
    ],
  },
  {
    name: 'Audi',
    models: [
      'A3', 'A4', 'A6', 'A7', 'Q3', 'Q5', 'Q7', 'Q8',
      'e-tron', 'TT',
    ],
  },
  {
    name: 'Nissan',
    models: [
      'Sunny', 'Altima', 'Maxima', 'Patrol', 'X-Trail',
      'Qashqai', 'Juke', 'Kicks', 'Navara', 'Leaf',
    ],
  },
  {
    name: 'Mitsubishi',
    models: [
      'Lancer', 'Outlander', 'Pajero', 'L200', 'ASX',
      'Eclipse Cross', 'Mirage', 'Xpander',
    ],
  },
  {
    name: 'Mazda',
    models: [
      'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9',
      'CX-30', 'MX-5', 'CX-50',
    ],
  },
  {
    name: 'Volkswagen',
    models: [
      'Golf', 'Polo', 'Passat', 'Tiguan', 'Touareg',
      'T-Roc', 'ID.4', 'Arteon', 'Jetta',
    ],
  },
  {
    name: 'Ford',
    models: [
      'Focus', 'Fiesta', 'Mustang', 'Ranger', 'Explorer',
      'Escape', 'Bronco', 'F-150', 'Maverick',
    ],
  },
  {
    name: 'Chevrolet',
    models: [
      'Malibu', 'Cruze', 'Spark', 'Camaro', 'Tahoe',
      'Suburban', 'Equinox', 'Traverse', 'Colorado',
    ],
  },
  {
    name: 'MG',
    models: [
      'HS', 'ZS', 'ZS EV', 'GT', '5', '3', 'Marvel R',
    ],
  },
  {
    name: 'Changan',
    models: [
      'Alsvin', 'Oshan X7', 'Uni-T', 'Uni-V', 'Karvaan',
      'M9 Pickup', 'Uni-K',
    ],
  },
  {
    name: 'DFSK',
    models: [
      'Glory 580', 'Glory 580 Pro', 'Prince', 'C31', 'C35',
    ],
  },
  {
    name: 'Proton',
    models: [
      'Saga', 'X70', 'X50',
    ],
  },
  {
    name: 'Peugeot',
    models: [
      '2008', '3008', '5008', '208', '308', '508',
    ],
  },
  {
    name: 'Tesla',
    models: [
      'Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck',
    ],
  },
  {
    name: 'Jeep',
    models: [
      'Wrangler', 'Grand Cherokee', 'Compass', 'Renegade', 'Gladiator',
    ],
  },
  {
    name: 'Land Rover',
    models: [
      'Defender', 'Discovery', 'Range Rover', 'Range Rover Sport',
      'Range Rover Evoque', 'Range Rover Velar',
    ],
  },
  {
    name: 'Lexus',
    models: [
      'IS', 'ES', 'LS', 'NX', 'RX', 'LX', 'UX', 'GX',
    ],
  },
  {
    name: 'Subaru',
    models: [
      'Impreza', 'WRX', 'Outback', 'Forester', 'Crosstrek', 'BRZ',
    ],
  },
  {
    name: 'Isuzu',
    models: [
      'D-Max', 'MU-X',
    ],
  },
  {
    name: 'Haval',
    models: [
      'H6', 'Jolion', 'H2', 'Dargo',
    ],
  },
].sort((a, b) => a.name.localeCompare(b.name))

/**
 * Production year list, descending from current year to 1990.
 */
export function getProductionYears(): number[] {
  const current = new Date().getFullYear() + 1
  const years: number[] = []
  for (let y = current; y >= 1990; y--) years.push(y)
  return years
}

/**
 * Fuel types for the wizard.
 * `value` matches the Firestore fuelType field.
 * `label` is what the user sees.
 */
export const FUEL_TYPES = [
  { value: 'Petrol' as const, label: 'Gasoline' },
  { value: 'Diesel' as const, label: 'Diesel' },
  { value: 'LPG' as const, label: 'LPG' },
  { value: 'Hybrid' as const, label: 'Hybrid' },
  { value: 'Electric' as const, label: 'Electric' },
]
