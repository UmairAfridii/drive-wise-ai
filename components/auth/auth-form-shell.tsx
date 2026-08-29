'use client'

import Link from 'next/link'
import { ArrowLeft, Gauge } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthFormShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  useApprovedLogo?: boolean
  showBackToHome?: boolean
}

export function AuthFormShell({ title, description, children, footer, useApprovedLogo = false, showBackToHome = false }: AuthFormShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="glass-strong grid-texture relative w-full max-w-md rounded-3xl p-6 sm:p-8">
        {showBackToHome && <Link href="/" className="absolute left-5 top-5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> Back to Home</Link>}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-[0_0_28px_oklch(0.62_0.19_258/0.3)]">
            {useApprovedLogo ? <img src="/drivewise-logo.png.png" alt="DriveWise AI" className="size-full object-contain" /> : <><Gauge className="size-6" strokeWidth={2.25} aria-hidden="true" /><span className="absolute inset-x-2 bottom-1 h-px bg-accent/70" /></>}
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {children}

        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  )
}

export function AuthField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
      {label}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
      />
    </label>
  )
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-primary transition-colors hover:text-accent">
      {children}
    </Link>
  )
}
