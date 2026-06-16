import Dexie, { type Table } from 'dexie'
import type { Epic, Sprint, Story, Task, StoryStatus, Priority } from './types'

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
  }
}

export const db = new AgileDB()

const uid = () => crypto.randomUUID()
const now = () => Date.now()

// ---------- Epics ----------
export async function createEpic(data: {
  title: string
  description?: string
  color: string
}): Promise<string> {
  const id = uid()
  await db.epics.add({ id, createdAt: now(), ...data })
  return id
}

export function updateEpic(id: string, changes: Partial<Epic>) {
  return db.epics.update(id, changes)
}

export async function deleteEpic(id: string) {
  // Detach stories from the epic rather than deleting them.
  await db.transaction('rw', db.epics, db.stories, async () => {
    await db.stories.where('epicId').equals(id).modify({ epicId: undefined })
    await db.epics.delete(id)
  })
}

// ---------- Sprints ----------
export async function createSprint(data: {
  name: string
  goal?: string
  startDate?: string
  endDate?: string
}): Promise<string> {
  const id = uid()
  await db.sprints.add({ id, status: 'planned', createdAt: now(), ...data })
  return id
}

export function updateSprint(id: string, changes: Partial<Sprint>) {
  return db.sprints.update(id, changes)
}

export async function deleteSprint(id: string) {
  await db.transaction('rw', db.sprints, db.stories, async () => {
    await db.stories.where('sprintId').equals(id).modify({ sprintId: undefined })
    await db.sprints.delete(id)
  })
}

/** Make one sprint active; demote any other active sprint to completed. */
export async function activateSprint(id: string) {
  await db.transaction('rw', db.sprints, async () => {
    await db.sprints.where('status').equals('active').modify({ status: 'completed' })
    await db.sprints.update(id, { status: 'active' })
  })
}

// ---------- Stories ----------
export async function createStory(data: {
  title: string
  description?: string
  epicId?: string
  sprintId?: string
  status?: StoryStatus
  priority?: Priority
  points?: number
}): Promise<string> {
  const id = uid()
  const status = data.status ?? 'backlog'
  // Place new story at the end of its column.
  const order = now()
  await db.stories.add({
    id,
    title: data.title,
    description: data.description,
    epicId: data.epicId,
    sprintId: data.sprintId,
    status,
    priority: data.priority ?? 'medium',
    points: data.points,
    order,
    createdAt: now(),
  })
  return id
}

export function updateStory(id: string, changes: Partial<Story>) {
  return db.stories.update(id, changes)
}

export async function deleteStory(id: string) {
  await db.transaction('rw', db.stories, db.tasks, async () => {
    await db.tasks.where('storyId').equals(id).delete()
    await db.stories.delete(id)
  })
}

export function setStoryStatus(id: string, status: StoryStatus) {
  return db.stories.update(id, { status, order: now() })
}

// ---------- Tasks ----------
export async function createTask(storyId: string, title: string): Promise<string> {
  const id = uid()
  await db.tasks.add({
    id,
    storyId,
    title,
    done: false,
    order: now(),
    createdAt: now(),
  })
  return id
}

export function toggleTask(id: string, done: boolean) {
  return db.tasks.update(id, { done })
}

export function updateTask(id: string, changes: Partial<Task>) {
  return db.tasks.update(id, changes)
}

export function deleteTask(id: string) {
  return db.tasks.delete(id)
}
