'use client'

import { useState } from 'react'
import {
  Bell,
  Check,
  ChevronRight,
  Gauge,
  Lock,
  Mail,
  MapPin,
  Palette,
  Save,
  Shield,
  SlidersHorizontal,
  Smartphone,
  User,
} from 'lucide-react'
import { PageHeading, SectionTitle } from '@/components/dashboard-ui'

const settingsNav = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & data', icon: Shield },
]

export default function SettingsPage() {
  const [active, setActive] = useState('profile')
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeading
        eyebrow="Workspace controls"
        title="Settings"
        description="Manage your profile, driving preferences, alerts, and data privacy."
        actions={
          <button type="button" onClick={save} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${saved ? 'bg-success text-background' : 'bg-primary text-primary-foreground'}`}>
            {saved ? <Check className="size-4" /> : <Save className="size-4" />}
            {saved ? 'Changes saved' : 'Save changes'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="glass h-fit rounded-2xl p-2">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
            {settingsNav.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${active === item.id ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                >
                  <Icon className={`size-4 ${active === item.id ? 'text-primary' : ''}`} />
                  <span className="flex-1">{item.label}</span>
                  {active === item.id && <ChevronRight className="hidden size-3.5 text-primary lg:block" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex flex-col gap-6">
          {active === 'profile' && <ProfileSettings />}
          {active === 'preferences' && <PreferenceSettings />}
          {active === 'notifications' && <NotificationSettings />}
          {active === 'privacy' && <PrivacySettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  return (
    <>
      <section className="glass animate-rise rounded-2xl p-5 sm:p-6">
        <SectionTitle title="Profile details" description="This information appears in your DriveWise workspace." />
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xl font-semibold text-primary ring-1 ring-primary/20">DW<span className="absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-card bg-success" /></div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Your profile</h3>
            <p className="mt-1 text-sm text-muted-foreground">Manage your workspace details</p>
            <button type="button" className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground hover:border-primary/30">Change photo</button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" defaultValue="" />
          <Field label="Email address" defaultValue="" icon={Mail} />
          <Field label="Phone number" defaultValue="" icon={Smartphone} />
          <Field label="City" defaultValue="" icon={MapPin} />
        </div>
      </section>
      <section className="glass animate-rise rounded-2xl p-5 sm:p-6">
        <SectionTitle title="Workspace plan" description="Your current DriveWise AI subscription." />
        <div className="grid-texture mt-5 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Pro</span><h3 className="mt-3 text-base font-semibold text-foreground">DriveWise Pro</h3><p className="mt-1 text-xs text-muted-foreground">Unlimited vehicles, AI diagnostics, and predictive maintenance.</p></div>
          <button type="button" className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary">Manage plan</button>
        </div>
      </section>
    </>
  )
}

function PreferenceSettings() {
  return (
    <section className="glass animate-rise rounded-2xl p-5 sm:p-6">
      <SectionTitle title="Driving preferences" description="Customize units and how data appears across DriveWise." />
      <div className="mt-6 flex flex-col gap-5">
        <SelectField icon={Gauge} label="Distance unit" description="Used for mileage, range, and maintenance intervals" options={['Kilometers (km)', 'Miles (mi)']} />
        <SelectField icon={Palette} label="Interface theme" description="DriveWise is optimized for dark mode" options={['Midnight blue', 'System default']} />
        <SelectField icon={SlidersHorizontal} label="Fuel economy" description="Choose your preferred efficiency format" options={['km/L', 'L/100km', 'MPG']} />
        <SettingToggle title="AI recommendations" description="Show proactive insights throughout your dashboard" defaultOn />
        <SettingToggle title="Automatic vehicle health scoring" description="Calculate health scores from your service and fuel data" defaultOn />
      </div>
    </section>
  )
}

function NotificationSettings() {
  return (
    <section className="glass animate-rise rounded-2xl p-5 sm:p-6">
      <SectionTitle title="Notification preferences" description="Control when and how DriveWise contacts you." />
      <div className="mt-6 flex flex-col gap-3">
        <SettingToggle title="Maintenance reminders" description="Get notified before service is due" defaultOn />
        <SettingToggle title="AI diagnostic alerts" description="Important anomalies detected in your vehicle data" defaultOn />
        <SettingToggle title="Fuel price alerts" description="Weekly updates when fuel prices change" defaultOn />
        <SettingToggle title="Monthly vehicle report" description="A detailed summary of health, costs, and efficiency" defaultOn />
        <SettingToggle title="Product updates" description="Occasional news about new DriveWise features" />
      </div>
    </section>
  )
}

function PrivacySettings() {
  return (
    <>
      <section className="glass animate-rise rounded-2xl p-5 sm:p-6">
        <SectionTitle title="Privacy & data" description="Your data, your control." />
        <div className="mt-6 flex flex-col gap-3">
          <PrivacyRow icon={Lock} title="Data encryption" description="Vehicle and profile data is encrypted in transit and at rest" action="Enabled" />
          <PrivacyRow icon={Shield} title="AI data usage" description="Your conversations are not used to train external models" action="Protected" />
          <PrivacyRow icon={Smartphone} title="Active sessions" description="You are currently signed in on 2 devices" action="Manage" />
        </div>
      </section>
      <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Danger zone</h2>
        <p className="mt-1 text-xs text-muted-foreground">These actions cannot be undone.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-foreground">Export all data</button>
          <button type="button" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive">Delete workspace</button>
        </div>
      </section>
    </>
  )
}

function Field({ label, defaultValue, icon: Icon }: { label: string; defaultValue: string; icon?: typeof Mail }) {
  return <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">{label}<span className="relative">{Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}<input defaultValue={defaultValue} className={`h-11 w-full rounded-xl border border-input bg-secondary/40 pr-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 ${Icon ? 'pl-9' : 'pl-3'}`} /></span></label>
}

function SelectField({ icon: Icon, label, description, options }: { icon: typeof Gauge; label: string; description: string; options: string[] }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div><select className="h-10 rounded-xl border border-input bg-background/40 px-3 text-xs text-foreground outline-none">{options.map((o) => <option key={o}>{o}</option>)}</select></div>
}

function SettingToggle({ title, description, defaultOn = false }: { title: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p></div><button type="button" role="switch" aria-checked={on} onClick={() => setOn(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-1 size-4 rounded-full bg-foreground transition-transform ${on ? 'left-6' : 'left-1'}`} /></button></div>
}

function PrivacyRow({ icon: Icon, title, description, action }: { icon: typeof Lock; title: string; description: string; action: string }) {
  return <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div><button type="button" className="text-xs font-semibold text-primary">{action}</button></div>
}
