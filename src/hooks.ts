import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Task } from './types'

export function useEpics() {
  return useLiveQuery(
    () =>
      db.epics
        .orderBy('createdAt')
        .filter((e) => !e.deleted)
        .toArray(),
    [],
    [],
  )
}

export function useSprints() {
  return useLiveQuery(
    () =>
      db.sprints
        .orderBy('createdAt')
        .filter((s) => !s.deleted)
        .reverse()
        .toArray(),
    [],
    [],
  )
}

export function useActiveSprint() {
  return useLiveQuery(
    () =>
      db.sprints
        .where('status')
        .equals('active')
        .and((s) => !s.deleted)
        .first(),
    [],
    undefined,
  )
}

export function useStories() {
  return useLiveQuery(
    () =>
      db.stories
        .orderBy('order')
        .filter((s) => !s.deleted)
        .toArray(),
    [],
    [],
  )
}

export function useTasksByStory(storyId: string | undefined) {
  return useLiveQuery(
    () =>
      storyId
        ? db.tasks
            .where('storyId')
            .equals(storyId)
            .and((t) => !t.deleted)
            .sortBy('order')
        : Promise.resolve([] as Task[]),
    [storyId],
    [],
  )
}

/** Map of storyId -> { total, done } task counts, for progress badges. */
export function useTaskCounts() {
  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray()
      const counts: Record<string, { total: number; done: number }> = {}
      for (const t of tasks) {
        if (t.deleted) continue
        const c = (counts[t.storyId] ??= { total: 0, done: 0 })
        c.total++
        if (t.done) c.done++
      }
      return counts
    },
    [],
    {},
  )
}
