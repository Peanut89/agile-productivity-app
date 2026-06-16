import { useMemo, useState } from 'react'
import {
  BOARD_STATUSES,
  STATUS_LABEL,
  type Epic,
  type Sprint,
  type Story,
  type StoryStatus,
} from '../types'
import { StoryCard } from './StoryCard'
import { Segmented } from './ui'

interface Props {
  stories: Story[]
  epics: Epic[]
  activeSprint: Sprint | undefined
  counts: Record<string, { total: number; done: number }>
  onOpenStory: (id: string) => void
}

export function Board({ stories, epics, activeSprint, counts, onOpenStory }: Props) {
  const [col, setCol] = useState<StoryStatus>('todo')
  const [scope, setScope] = useState<'sprint' | 'all'>(
    activeSprint ? 'sprint' : 'all',
  )

  const epicById = useMemo(
    () => Object.fromEntries(epics.map((e) => [e.id, e])),
    [epics],
  )

  const scoped = useMemo(() => {
    let s = stories.filter((st) => st.status !== 'backlog')
    if (scope === 'sprint' && activeSprint)
      s = s.filter((st) => st.sprintId === activeSprint.id)
    return s
  }, [stories, scope, activeSprint])

  const byStatus = (status: StoryStatus) =>
    scoped.filter((s) => s.status === status)

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 px-4 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Board</h1>
          {activeSprint ? (
            <p className="text-sm text-slate-400">
              {scope === 'sprint'
                ? `Sprint: ${activeSprint.name}`
                : 'All stories'}
            </p>
          ) : (
            <p className="text-sm text-slate-400">No active sprint</p>
          )}
        </div>

        {activeSprint && (
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: 'sprint', label: 'Active sprint' },
              { value: 'all', label: 'All' },
            ]}
          />
        )}

        <Segmented
          value={col}
          onChange={setCol}
          options={BOARD_STATUSES.map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
            count: byStatus(s).length,
          }))}
        />
      </div>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 pb-28">
        {byStatus(col).length === 0 ? (
          <EmptyColumn status={col} />
        ) : (
          byStatus(col).map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              epic={story.epicId ? epicById[story.epicId] : undefined}
              counts={counts[story.id]}
              onClick={() => onOpenStory(story.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EmptyColumn({ status }: { status: StoryStatus }) {
  return (
    <div className="mt-10 text-center text-slate-500">
      <p className="text-sm">Nothing in {STATUS_LABEL[status]}.</p>
      <p className="mt-1 text-xs">Tap + to add a story.</p>
    </div>
  )
}
