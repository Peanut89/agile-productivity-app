import { useMemo } from 'react'
import { activateSprint, updateSprint, deleteSprint } from '../db'
import type { Sprint, Story } from '../types'
import { TrashIcon } from './icons'

interface Props {
  sprints: Sprint[]
  stories: Story[]
}

const statusStyles: Record<Sprint['status'], string> = {
  planned: 'bg-slate-600/40 text-slate-300',
  active: 'bg-emerald-500/20 text-emerald-300',
  completed: 'bg-blue-500/20 text-blue-300',
}

export function Sprints({ sprints, stories }: Props) {
  const stats = useMemo(() => {
    const m: Record<string, { count: number; points: number; done: number }> = {}
    for (const s of stories) {
      if (!s.sprintId) continue
      const e = (m[s.sprintId] ??= { count: 0, points: 0, done: 0 })
      e.count++
      e.points += s.points ?? 0
      if (s.status === 'done') e.done++
    }
    return m
  }, [stories])

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-3">
        <h1 className="text-xl font-bold text-slate-100">Sprints</h1>
        <p className="text-sm text-slate-400">
          {sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'}
        </p>
      </div>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 pb-28">
        {sprints.length === 0 ? (
          <div className="mt-10 text-center text-slate-500">
            <p className="text-sm">No sprints yet.</p>
            <p className="mt-1 text-xs">Tap + to plan your first sprint.</p>
          </div>
        ) : (
          sprints.map((sprint) => {
            const s = stats[sprint.id] ?? { count: 0, points: 0, done: 0 }
            return (
              <div
                key={sprint.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-100">{sprint.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles[sprint.status]}`}
                      >
                        {sprint.status}
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="mt-0.5 text-xs text-slate-400">{sprint.goal}</p>
                    )}
                    {(sprint.startDate || sprint.endDate) && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {sprint.startDate ?? '…'} → {sprint.endDate ?? '…'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      confirm(`Delete sprint "${sprint.name}"? Stories are kept.`) &&
                      deleteSprint(sprint.id)
                    }
                    className="p-1 text-slate-500 active:text-red-400"
                    aria-label="Delete sprint"
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-400">
                  {s.count} stories · {s.done} done · {s.points} pts
                </div>

                <div className="mt-2.5 flex gap-2">
                  {sprint.status !== 'active' && (
                    <button
                      onClick={() => activateSprint(sprint.id)}
                      className="flex-1 rounded-lg bg-emerald-600/20 py-1.5 text-sm font-medium text-emerald-300 active:bg-emerald-600/30"
                    >
                      Set active
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button
                      onClick={() => updateSprint(sprint.id, { status: 'completed' })}
                      className="flex-1 rounded-lg bg-blue-600/20 py-1.5 text-sm font-medium text-blue-300 active:bg-blue-600/30"
                    >
                      Complete sprint
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
