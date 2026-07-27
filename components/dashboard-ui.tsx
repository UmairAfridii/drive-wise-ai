import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  trend,
  positive = true,
  icon: Icon,
  delay = 0,
}: {
  label: string
  value: string
  detail: string
  trend?: string
  positive?: boolean
  icon: LucideIcon
  delay?: number
}) {
  return (
    <article
      className="glass animate-rise group rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
              positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-5 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">{detail}</p>
    </article>
  )
}

export function StatusPill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
}) {
  const tones = {
    default: 'border-border bg-secondary text-muted-foreground',
    success: 'border-success/20 bg-success/10 text-success',
    warning: 'border-warning/20 bg-warning/10 text-warning',
    danger: 'border-destructive/20 bg-destructive/10 text-destructive',
    accent: 'border-primary/20 bg-primary/10 text-primary',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  tone = 'primary',
  label,
}: {
  value: number
  tone?: 'primary' | 'accent' | 'success' | 'warning'
  label?: string
}) {
  const colors = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
  }
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{value}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all duration-700', colors[tone])} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function ActionLink({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-accent">
      {children}
      <ChevronRight className="size-3.5" aria-hidden="true" />
    </button>
  )
}

export function MiniBars({
  values,
  highlight = -1,
  height = 'h-28',
}: {
  values: number[]
  highlight?: number
  height?: string
}) {
  return (
    <div className={cn('flex items-end gap-2', height)} aria-label="Bar chart visualization">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex h-full flex-1 items-end">
          <div
            className={cn(
              'w-full rounded-t-md transition-all duration-500',
              index === highlight ? 'bg-primary' : 'bg-primary/15 hover:bg-primary/35',
            )}
            style={{ height: `${value}%` }}
          />
        </div>
      ))}
    </div>
  )
}
