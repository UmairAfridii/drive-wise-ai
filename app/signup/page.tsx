'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthField, AuthFormShell, AuthLink } from '@/components/auth/auth-form-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    try {
      await signUp(email, password, displayName)
      router.replace('/')
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFormShell
      title="Create your account"
      description="Start tracking your vehicles with AI-powered maintenance and fuel insights."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <AuthField
          label="Full name"
          id="signup-name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Alex Morgan"
          autoComplete="name"
          required={false}
        />
        <AuthField
          label="Email address"
          id="signup-email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          id="signup-password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm password"
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
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
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthFormShell>
  )
}
