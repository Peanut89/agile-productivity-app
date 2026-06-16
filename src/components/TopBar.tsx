import type { SyncStatus } from '../sync/engine'
import { CloudIcon, CloudCheckIcon } from './icons'

interface Props {
  status: SyncStatus
  signedIn: boolean
  onOpenAccount: () => void
}

const dot: Record<SyncStatus, string> = {
  'signed-out': 'text-slate-400',
  syncing: 'text-amber-400 animate-pulse',
  synced: 'text-emerald-400',
  offline: 'text-slate-500',
  error: 'text-red-400',
}

const label: Record<SyncStatus, string> = {
  'signed-out': 'Sync off',
  syncing: 'Syncing',
  synced: 'Synced',
  offline: 'Offline',
  error: 'Retry',
}

export function TopBar({ status, signedIn, onOpenAccount }: Props) {
  const Icon = signedIn && status === 'synced' ? CloudCheckIcon : CloudIcon
  return (
    <div className="safe-top flex items-center justify-between px-4 pt-2">
      <span className="text-sm font-semibold text-slate-300">Agile</span>
      <button
        onClick={onOpenAccount}
        className="flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-slate-300 active:opacity-80"
      >
        <Icon width={16} height={16} className={dot[status]} />
        {signedIn ? label[status] : 'Sign in'}
      </button>
    </div>
  )
}
