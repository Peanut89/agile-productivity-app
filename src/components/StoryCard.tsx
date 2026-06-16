import type { Epic, Story } from '../types'
import { PriorityBadge, PointsBadge } from './ui'

interface Props {
  story: Story
  epic?: Epic
  counts?: { total: number; done: number }
  onClick: () => void
}

export function StoryCard({ story, epic, counts, onClick }: Props) {
  const hasTasks = counts && counts.total > 0
  const pct = hasTasks ? Math.round((counts!.done / counts!.total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left active:border-blue-500/60"
    >
      <div className="flex items-start gap-2">
        {epic && (
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: epic.color }}
            title={epic.title}
          />
        )}
        <p className="flex-1 text-sm font-medium leading-snug text-slate-100">
          {story.title}
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={story.priority} />
        <PointsBadge points={story.points} />
        {epic && (
          <span className="truncate rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-slate-400">
            {epic.title}
          </span>
        )}
      </div>

      {hasTasks && (
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
            <span>Checklist</span>
            <span>
              {counts!.done}/{counts!.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </button>
  )
}
