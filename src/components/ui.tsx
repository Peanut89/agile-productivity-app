import type { Priority } from '../types'

const priorityStyles: Record<Priority, string> = {
  low: 'bg-slate-600/40 text-slate-300',
  medium: 'bg-amber-500/20 text-amber-300',
  high: 'bg-red-500/20 text-red-300',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  )
}

export function PointsBadge({ points }: { points?: number }) {
  if (points == null) return null
  return (
    <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
      {points} pt
    </span>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (v: T) => void
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="flex gap-1 rounded-xl bg-[var(--color-surface-2)] p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-[var(--color-surface)] text-slate-100 shadow'
                : 'text-slate-400 active:text-slate-200'
            }`}
          >
            {o.label}
            {o.count != null && (
              <span className="ml-1 text-xs opacity-70">{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500'

export const labelClass =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400'

export const primaryBtnClass =
  'w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white active:bg-blue-700 disabled:opacity-50'
