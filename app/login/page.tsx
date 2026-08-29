'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthField, AuthFormShell, AuthLink } from '@/components/auth/auth-form-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn(email, password)
      router.replace('/')
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFormShell
      title="Welcome back"
      description="Sign in to your DriveWise workspace to manage vehicles, fuel, and maintenance."
      useApprovedLogo
      showBackToHome
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/signup">Create one</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <AuthField
          label="Email address"
          id="login-email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          id="login-password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        {error && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_oklch(0.62_0.19_258/0.25)] transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthFormShell>
  )
}
