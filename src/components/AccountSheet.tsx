import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fullSync, type SyncStatus } from '../sync/engine'
import { Sheet } from './Sheet'
import { inputClass, labelClass, primaryBtnClass } from './ui'
import { CloudCheckIcon, RefreshIcon } from './icons'

interface Props {
  open: boolean
  onClose: () => void
  session: Session | null
  status: SyncStatus
  lastSyncedAt: number | null
}

const STATUS_TEXT: Record<SyncStatus, string> = {
  'signed-out': 'Not signed in',
  syncing: 'Syncing…',
  synced: 'All changes synced',
  offline: 'Offline — will sync when back online',
  error: 'Sync error — will retry',
}

export function AccountSheet({ open, onClose, session, status, lastSyncedAt }: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendCode = async () => {
    if (!supabase || !email.trim()) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  const verify = async () => {
    if (!supabase || !code.trim()) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    setBusy(false)
    if (error) setError(error.message)
    else {
      setStep('email')
      setCode('')
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <Sheet open={open} title="Sync & account" onClose={onClose}>
      {!isSupabaseConfigured ? (
        <div className="space-y-2 py-4 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Cloud sync isn’t configured yet.</p>
          <p className="text-slate-400">
            Add your Supabase URL and anon key (as <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>) and reload to enable cross-device sync.
          </p>
        </div>
      ) : session ? (
        // ---- Signed in ----
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-2)] p-3">
            <CloudCheckIcon
              width={24}
              height={24}
              className={status === 'synced' ? 'text-emerald-400' : 'text-slate-400'}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-100">{session.user.email}</p>
              <p className="text-xs text-slate-400">{STATUS_TEXT[status]}</p>
            </div>
          </div>

          {lastSyncedAt && (
            <p className="text-center text-xs text-slate-500">
              Last synced {new Date(lastSyncedAt).toLocaleTimeString()}
            </p>
          )}

          <button
            onClick={() => session && fullSync(session.user.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-2)] px-4 py-3 font-medium text-slate-100 active:opacity-80"
          >
            <RefreshIcon width={18} height={18} /> Sync now
          </button>

          <button
            onClick={signOut}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 font-medium text-slate-300 active:bg-[var(--color-surface-2)]"
          >
            Sign out
          </button>
          <p className="text-center text-xs text-slate-500">
            Signing out keeps this device’s local data; it just stops syncing.
          </p>
        </div>
      ) : step === 'email' ? (
        // ---- Sign in: email ----
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Sign in with your email to sync your epics, stories and tasks across all
            your devices. We’ll email you a 6-digit code — no password.
          </p>
          <div>
            <label className={labelClass}>Email</label>
            <input
              autoFocus
              type="email"
              inputMode="email"
              autoComplete="email"
              className={inputClass}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendCode()}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={sendCode}
            disabled={busy || !email.trim()}
            className={primaryBtnClass}
          >
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </div>
      ) : (
        // ---- Sign in: code ----
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Enter the 6-digit code we sent to <strong>{email}</strong>.
          </p>
          <div>
            <label className={labelClass}>Verification code</label>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`${inputClass} text-center text-lg tracking-[0.5em]`}
              placeholder="······"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={verify}
            disabled={busy || code.length < 6}
            className={primaryBtnClass}
          >
            {busy ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            onClick={() => {
              setStep('email')
              setError(null)
            }}
            className="w-full py-1 text-center text-sm text-slate-400"
          >
            ← Use a different email
          </button>
        </div>
      )}
    </Sheet>
  )
}
