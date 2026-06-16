import { useMemo } from 'react'
import { deleteEpic } from '../db'
import type { Epic, Story } from '../types'
import { TrashIcon } from './icons'

interface Props {
  epics: Epic[]
  stories: Story[]
}

export function Epics({ epics, stories }: Props) {
  const countByEpic = useMemo(() => {
    const m: Record<string, { total: number; done: number }> = {}
    for (const s of stories) {
      if (!s.epicId) continue
      const c = (m[s.epicId] ??= { total: 0, done: 0 })
      c.total++
      if (s.status === 'done') c.done++
    }
    return m
  }, [stories])

  const handleDelete = (epic: Epic) => {
    if (
      confirm(
        `Delete epic "${epic.title}"? Its stories are kept and un-linked from the epic.`,
      )
    )
      deleteEpic(epic.id)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-3">
        <h1 className="text-xl font-bold text-slate-100">Epics</h1>
        <p className="text-sm text-slate-400">
          {epics.length} {epics.length === 1 ? 'epic' : 'epics'}
        </p>
      </div>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 pb-28">
        {epics.length === 0 ? (
          <div className="mt-10 text-center text-slate-500">
            <p className="text-sm">No epics yet.</p>
            <p className="mt-1 text-xs">
              Tap + to group related stories under an epic.
            </p>
          </div>
        ) : (
          epics.map((epic) => {
            const c = countByEpic[epic.id] ?? { total: 0, done: 0 }
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0
            return (
              <div
                key={epic.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ background: epic.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-100">{epic.title}</p>
                    {epic.description && (
                      <p className="text-xs text-slate-400">{epic.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(epic)}
                    className="p-1 text-slate-500 active:text-red-400"
                    aria-label="Delete epic"
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: epic.color }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {c.done}/{c.total} done
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
