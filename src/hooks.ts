import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import type { Task } from './types'

export function useEpics() {
  return useLiveQuery(() => db.epics.orderBy('createdAt').toArray(), [], [])
}

export function useSprints() {
  return useLiveQuery(() => db.sprints.orderBy('createdAt').reverse().toArray(), [], [])
}

export function useActiveSprint() {
  return useLiveQuery(
    () => db.sprints.where('status').equals('active').first(),
    [],
    undefined,
  )
}

export function useStories() {
  return useLiveQuery(() => db.stories.orderBy('order').toArray(), [], [])
}

export function useTasksByStory(storyId: string | undefined) {
  return useLiveQuery(
    () =>
      storyId
        ? db.tasks.where('storyId').equals(storyId).sortBy('order')
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
