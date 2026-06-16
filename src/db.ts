import Dexie, { type Table } from 'dexie'
import type { Epic, Sprint, Story, Task, StoryStatus, Priority } from './types'
import { markDirty } from './sync/dirty'

export class AgileDB extends Dexie {
  epics!: Table<Epic, string>
  sprints!: Table<Sprint, string>
  stories!: Table<Story, string>
  tasks!: Table<Task, string>

  constructor() {
    super('agile-productivity')
    this.version(1).stores({
      epics: 'id, createdAt',
      sprints: 'id, status, createdAt',
      stories: 'id, status, epicId, sprintId, order, createdAt',
      tasks: 'id, storyId, order, createdAt',
    })
    // v2 adds sync fields (updatedAt, deleted) and indexes them.
    this.version(2)
      .stores({
        epics: 'id, createdAt, updatedAt, deleted',
        sprints: 'id, status, createdAt, updatedAt, deleted',
        stories: 'id, status, epicId, sprintId, order, createdAt, updatedAt, deleted',
        tasks: 'id, storyId, order, createdAt, updatedAt, deleted',
      })
      .upgrade(async (tx) => {
        for (const name of ['epics', 'sprints', 'stories', 'tasks'] as const) {
          await tx
            .table(name)
            .toCollection()
            .modify((r: Record<string, unknown>) => {
              if (r.updatedAt == null) r.updatedAt = (r.createdAt as number) ?? Date.now()
              if (r.deleted == null) r.deleted = false
            })
        }
      })
  }
}

export const db = new AgileDB()

const uid = () => crypto.randomUUID()
const now = () => Date.now()

/** Stamp a fresh record as dirty/undeleted for the sync engine. */
function fresh<T extends object>(data: T) {
  return { ...data, updatedAt: now(), deleted: false, dirty: true }
}

/** Stamp a partial update as dirty so the sync engine picks it up. */
function stamp<T extends object>(changes: T) {
  return { ...changes, updatedAt: now(), dirty: true }
}

/** Wrap a write so a debounced push is scheduled after it resolves. */
async function tracked<T>(p: PromiseLike<T>): Promise<T> {
  const r = await p
  markDirty()
  return r
}

// ---------- Epics ----------
export function createEpic(data: {
  title: string
  description?: string
  color: string
}): Promise<string> {
  const id = uid()
  return tracked(db.epics.add(fresh({ id, createdAt: now(), ...data })).then(() => id))
}

export function updateEpic(id: string, changes: Partial<Epic>) {
  return tracked(db.epics.update(id, stamp(changes)))
}

export function deleteEpic(id: string) {
  // Soft-delete the epic and detach its stories (kept).
  return tracked(
    db.transaction('rw', db.epics, db.stories, async () => {
      await db.stories
        .where('epicId')
        .equals(id)
        .modify(stamp({ epicId: undefined }))
      await db.epics.update(id, stamp({ deleted: true }))
    }),
  )
}

// ---------- Sprints ----------
export function createSprint(data: {
  name: string
  goal?: string
  startDate?: string
  endDate?: string
}): Promise<string> {
  const id = uid()
  return tracked(
    db.sprints
      .add(fresh({ id, status: 'planned' as const, createdAt: now(), ...data }))
      .then(() => id),
  )
}

export function updateSprint(id: string, changes: Partial<Sprint>) {
  return tracked(db.sprints.update(id, stamp(changes)))
}

export function deleteSprint(id: string) {
  return tracked(
    db.transaction('rw', db.sprints, db.stories, async () => {
      await db.stories
        .where('sprintId')
        .equals(id)
        .modify(stamp({ sprintId: undefined }))
      await db.sprints.update(id, stamp({ deleted: true }))
    }),
  )
}

/** Make one sprint active; demote any other active sprint to completed. */
export function activateSprint(id: string) {
  return tracked(
    db.transaction('rw', db.sprints, async () => {
      await db.sprints
        .where('status')
        .equals('active')
        .modify(stamp({ status: 'completed' as const }))
      await db.sprints.update(id, stamp({ status: 'active' as const }))
    }),
  )
}

// ---------- Stories ----------
export function createStory(data: {
  title: string
  description?: string
  epicId?: string
  sprintId?: string
  status?: StoryStatus
  priority?: Priority
  points?: number
}): Promise<string> {
  const id = uid()
  return tracked(
    db.stories
      .add(
        fresh({
          id,
          title: data.title,
          description: data.description,
          epicId: data.epicId,
          sprintId: data.sprintId,
          status: data.status ?? 'backlog',
          priority: data.priority ?? 'medium',
          points: data.points,
          order: now(),
          createdAt: now(),
        }),
      )
      .then(() => id),
  )
}

export function updateStory(id: string, changes: Partial<Story>) {
  return tracked(db.stories.update(id, stamp(changes)))
}

export function deleteStory(id: string) {
  return tracked(
    db.transaction('rw', db.stories, db.tasks, async () => {
      await db.tasks
        .where('storyId')
        .equals(id)
        .modify(stamp({ deleted: true }))
      await db.stories.update(id, stamp({ deleted: true }))
    }),
  )
}

export function setStoryStatus(id: string, status: StoryStatus) {
  return tracked(db.stories.update(id, stamp({ status, order: now() })))
}

// ---------- Tasks ----------
export function createTask(storyId: string, title: string): Promise<string> {
  const id = uid()
  return tracked(
    db.tasks
      .add(fresh({ id, storyId, title, done: false, order: now(), createdAt: now() }))
      .then(() => id),
  )
}

export function toggleTask(id: string, done: boolean) {
  return tracked(db.tasks.update(id, stamp({ done })))
}

export function updateTask(id: string, changes: Partial<Task>) {
  return tracked(db.tasks.update(id, stamp(changes)))
}

export function deleteTask(id: string) {
  return tracked(db.tasks.update(id, stamp({ deleted: true })))
}
