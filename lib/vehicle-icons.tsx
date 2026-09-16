import type { FC, ReactNode, SVGProps } from 'react'
import changanLogo from '@/brand-logos/changan.png'
import dfskLogo from '@/brand-logos/dfsk.png'
import havalLogo from '@/brand-logos/haval.png'
import isuzuLogo from '@/brand-logos/isuzu.png'
import landRoverLogo from '@/brand-logos/land-rover.png'
import lexusLogo from '@/brand-logos/lexus.png'
import mercedesLogo from '@/brand-logos/mercedes-benz.png'
import protonLogo from '@/brand-logos/proton.png'

import {
  siAudi,
  siBmw,
  siChevrolet,
  siFord,
  siHonda,
  siHyundai,
  siJeep,
  siKia,
  siMazda,
  siMg,
  siMitsubishi,
  siNissan,
  siPeugeot,
  siSubaru,
  siSuzuki,
  siTesla,
  siToyota,
  siVolkswagen,
  type SimpleIcon,
} from 'simple-icons'

/**
 * Maintainable brand-to-icon mapping using simple-icons.
 * Normalized keys (lowercase, trimmed, non-alphanumeric removed).
 */
export const BRAND_ICON_MAP: Record<string, SimpleIcon> = {
  toyota: siToyota,
  honda: siHonda,
  suzuki: siSuzuki,
  hyundai: siHyundai,
  kia: siKia,
  bmw: siBmw,
  audi: siAudi,
  nissan: siNissan,
  mitsubishi: siMitsubishi,
  mazda: siMazda,
  volkswagen: siVolkswagen,
  vw: siVolkswagen,
  ford: siFord,
  chevrolet: siChevrolet,
  chevy: siChevrolet,
  mg: siMg,
  morrisgarages: siMg,
  peugeot: siPeugeot,
  tesla: siTesla,
  jeep: siJeep,
  subaru: siSubaru,
}

type LocalAsset = string | { src: string }

/**
 * High-quality local PNG assets for manufacturers not available in simple-icons.
 */
export const LOCAL_BRAND_LOGOS: Record<string, LocalAsset> = {
  changan: changanLogo,
  dfsk: dfskLogo,
  haval: havalLogo,
  isuzu: isuzuLogo,
  landrover: landRoverLogo,
  lexus: lexusLogo,
  mercedesbenz: mercedesLogo,
  mercedes: mercedesLogo,
  proton: protonLogo,
}

/**
 * Returns the brand's authentic Simple Icons color hex.
 * If the manufacturer color in simple-icons is pure black or near-black
 * (e.g. Peugeot, Jeep, Mazda, Kia), returns white (#FFFFFF) so it remains
 * high-contrast and readable against dark-mode surfaces.
 */
export function getBrandColor(icon: SimpleIcon): string {
  const hex = icon.hex.toUpperCase()
  if (hex === '000000' || hex === '101010' || hex === '05141F') {
    return '#FFFFFF'
  }
  return `#${icon.hex}`
}

/**
 * Helper to normalize make/brand strings for consistent lookups.
 */
export function normalizeBrandKey(makeOrBrand?: string): string {
  if (!makeOrBrand) return ''
  return makeOrBrand.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Returns the SimpleIcon object for a given vehicle make/brand name,
 * or null if no reliable icon is available.
 */
export function getBrandIcon(makeOrBrand?: string): SimpleIcon | null {
  const key = normalizeBrandKey(makeOrBrand)
  return BRAND_ICON_MAP[key] ?? null
}

/**
 * Returns the local PNG asset src/object for a given vehicle make/brand name,
 * or null if none is registered.
 */
export function getLocalBrandLogo(makeOrBrand?: string): LocalAsset | null {
  const key = normalizeBrandKey(makeOrBrand)
  return LOCAL_BRAND_LOGOS[key] ?? null
}

export interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  brand?: string
  fallback?: ReactNode
  useBrandColor?: boolean
}

/**
 * Renders an official manufacturer logo:
 * 1. Checks local PNG assets first (Mercedes-Benz, Land Rover, Lexus, Changan, DFSK, Haval, Isuzu, Proton).
 * 2. Checks Simple Icons next (Toyota, Honda, Suzuki, BMW, Audi, etc.) with brand colors.
 * 3. If unsupported, renders the provided fallback.
 */
export const BrandLogo: FC<BrandLogoProps> = ({
  brand,
  fallback = null,
  className = 'size-5',
  style,
  useBrandColor = true,
  ...props
}) => {
  // Check local PNG asset
  const localLogo = getLocalBrandLogo(brand)
  if (localLogo) {
    const src = typeof localLogo === 'string' ? localLogo : localLogo.src
    return (
      <img
        src={src}
        alt={`${brand ?? 'Manufacturer'} logo`}
        className={`${className} object-contain`}
      />
    )
  }

  // Check Simple Icon SVG
  const icon = getBrandIcon(brand)
  if (icon) {
    const color = useBrandColor ? getBrandColor(icon) : 'currentColor'
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        fill={color}
        className={className}
        style={{ color, ...style }}
        aria-label={`${icon.title} logo`}
        {...props}
      >
        <path d={icon.path} />
      </svg>
    )
  }

  return <>{fallback}</>
}
