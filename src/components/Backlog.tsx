import { useMemo } from 'react'
import type { Epic, Story } from '../types'
import { StoryCard } from './StoryCard'

interface Props {
  stories: Story[]
  epics: Epic[]
  counts: Record<string, { total: number; done: number }>
  onOpenStory: (id: string) => void
}

const priorityRank = { high: 0, medium: 1, low: 2 }

export function Backlog({ stories, epics, counts, onOpenStory }: Props) {
  const epicById = useMemo(
    () => Object.fromEntries(epics.map((e) => [e.id, e])),
    [epics],
  )

  const backlog = useMemo(
    () =>
      stories
        .filter((s) => s.status === 'backlog')
        .sort(
          (a, b) =>
            priorityRank[a.priority] - priorityRank[b.priority] ||
            b.createdAt - a.createdAt,
        ),
    [stories],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-3">
        <h1 className="text-xl font-bold text-slate-100">Backlog</h1>
        <p className="text-sm text-slate-400">
          {backlog.length} {backlog.length === 1 ? 'story' : 'stories'} · sorted by
          priority
        </p>
      </div>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 pb-28">
        {backlog.length === 0 ? (
          <div className="mt-10 text-center text-slate-500">
            <p className="text-sm">Your backlog is empty.</p>
            <p className="mt-1 text-xs">Tap + to capture a new story.</p>
          </div>
        ) : (
          backlog.map((story) => (
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
