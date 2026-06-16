import type { Table } from 'dexie'
import { db } from '../db'
import type { Epic, Sprint, Story, Task } from '../types'

/** Describes how one entity maps between Dexie (camelCase) and Postgres (snake_case). */
export interface EntitySync<T extends { id: string; updatedAt: number }> {
  /** Supabase/Postgres table name. */
  table: string
  /** The local Dexie table. */
  dexie: () => Table<T, string>
  toRow: (e: T, userId: string) => Record<string, unknown>
  fromRow: (r: Record<string, unknown>) => T
}

const epics: EntitySync<Epic> = {
  table: 'epics',
  dexie: () => db.epics,
  toRow: (e, userId) => ({
    id: e.id,
    user_id: userId,
    title: e.title,
    description: e.description ?? null,
    color: e.color,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted: e.deleted ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? undefined,
    color: r.color as string,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: Boolean(r.deleted),
  }),
}

const sprints: EntitySync<Sprint> = {
  table: 'sprints',
  dexie: () => db.sprints,
  toRow: (s, userId) => ({
    id: s.id,
    user_id: userId,
    name: s.name,
    goal: s.goal ?? null,
    start_date: s.startDate ?? null,
    end_date: s.endDate ?? null,
    status: s.status,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted: s.deleted ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    name: r.name as string,
    goal: (r.goal as string) ?? undefined,
    startDate: (r.start_date as string) ?? undefined,
    endDate: (r.end_date as string) ?? undefined,
    status: r.status as Sprint['status'],
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: Boolean(r.deleted),
  }),
}

const stories: EntitySync<Story> = {
  table: 'stories',
  dexie: () => db.stories,
  toRow: (s, userId) => ({
    id: s.id,
    user_id: userId,
    title: s.title,
    description: s.description ?? null,
    epic_id: s.epicId ?? null,
    sprint_id: s.sprintId ?? null,
    status: s.status,
    priority: s.priority,
    points: s.points ?? null,
    sort_order: s.order,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted: s.deleted ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? undefined,
    epicId: (r.epic_id as string) ?? undefined,
    sprintId: (r.sprint_id as string) ?? undefined,
    status: r.status as Story['status'],
    priority: r.priority as Story['priority'],
    points: r.points == null ? undefined : Number(r.points),
    order: Number(r.sort_order),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: Boolean(r.deleted),
  }),
}

const tasks: EntitySync<Task> = {
  table: 'tasks',
  dexie: () => db.tasks,
  toRow: (t, userId) => ({
    id: t.id,
    user_id: userId,
    story_id: t.storyId,
    title: t.title,
    done: t.done,
    sort_order: t.order,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted: t.deleted ?? false,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    storyId: r.story_id as string,
    title: r.title as string,
    done: Boolean(r.done),
    order: Number(r.sort_order),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: Boolean(r.deleted),
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ENTITIES: EntitySync<any>[] = [epics, sprints, stories, tasks]
