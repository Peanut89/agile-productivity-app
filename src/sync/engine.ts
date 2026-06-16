import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ENTITIES, type EntitySync } from './mappers'
import { onLocalChange } from './dirty'

export type SyncStatus = 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
}

let state: SyncState = { status: 'signed-out', lastSyncedAt: null }
const subscribers = new Set<(s: SyncState) => void>()

export function getSyncState() {
  return state
}
export function subscribeSync(fn: (s: SyncState) => void) {
  subscribers.add(fn)
  fn(state)
  return () => subscribers.delete(fn)
}
function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  for (const fn of subscribers) fn(state)
}

const pullCursorKey = (userId: string) => `sync:pull:${userId}`
const migratedKey = (userId: string) => `sync:migrated:${userId}`

/** Apply a remote row into Dexie using last-write-wins. */
async function applyRemoteRow(entity: EntitySync<any>, raw: Record<string, unknown>) {
  const incoming = entity.fromRow(raw)
  const local = await entity.dexie().get(incoming.id)
  if (!local || incoming.updatedAt > local.updatedAt) {
    // Written directly (not via tracked helpers) so it isn't re-marked dirty.
    await entity.dexie().put({ ...incoming, dirty: false })
  }
}

/** Push all locally-dirty records to the cloud, then clear their dirty flag. */
async function pushChanges(userId: string) {
  if (!supabase) return
  for (const entity of ENTITIES) {
    const all = await entity.dexie().toArray()
    const dirty = all.filter((r) => r.dirty)
    if (dirty.length === 0) continue

    const rows = dirty.map((r) => entity.toRow(r, userId))
    const { error } = await supabase.from(entity.table).upsert(rows)
    if (error) throw error

    // Clear dirty only for records unchanged since we snapshotted them.
    const pushed = new Map(dirty.map((r) => [r.id, r.updatedAt]))
    await entity
      .dexie()
      .where('id')
      .anyOf([...pushed.keys()])
      .modify((r: { id: string; updatedAt: number; dirty?: boolean }) => {
        if (pushed.get(r.id) === r.updatedAt) r.dirty = false
      })
  }
}

/** Pull remote changes since the last cursor and merge them (last-write-wins). */
async function pullChanges(userId: string) {
  if (!supabase) return
  const since = Number(localStorage.getItem(pullCursorKey(userId)) ?? 0)
  let maxSeen = since

  for (const entity of ENTITIES) {
    const { data, error } = await supabase
      .from(entity.table)
      .select('*')
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
    if (error) throw error
    for (const raw of data ?? []) {
      await applyRemoteRow(entity, raw as Record<string, unknown>)
      maxSeen = Math.max(maxSeen, Number((raw as Record<string, unknown>).updated_at))
    }
  }
  localStorage.setItem(pullCursorKey(userId), String(maxSeen))
}

/** On the first sign-in for an account on this device, push all local data up. */
async function migrateLocalData(userId: string) {
  if (localStorage.getItem(migratedKey(userId))) return
  for (const entity of ENTITIES) {
    await entity
      .dexie()
      .toCollection()
      .modify((r: { dirty?: boolean }) => {
        r.dirty = true
      })
  }
  localStorage.setItem(migratedKey(userId), '1')
}

export async function fullSync(userId: string) {
  if (!supabase) return
  if (!navigator.onLine) {
    setState({ status: 'offline' })
    return
  }
  setState({ status: 'syncing' })
  try {
    await pushChanges(userId)
    await pullChanges(userId)
    setState({ status: 'synced', lastSyncedAt: Date.now() })
  } catch (e) {
    console.error('[sync] failed', e)
    setState({ status: 'error' })
  }
}

// ---- lifecycle ----
let channel: RealtimeChannel | null = null
let cleanups: Array<() => void> = []
let pushTimer: ReturnType<typeof setTimeout> | null = null

/** Begin syncing for a signed-in user: migrate, sync, then stream live changes. */
export async function startSync(userId: string) {
  if (!supabase) return
  await migrateLocalData(userId)
  await fullSync(userId)

  // Realtime: stream this user's row changes straight into Dexie.
  channel = supabase.channel(`sync:${userId}`)
  for (const entity of ENTITIES) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: entity.table,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>
        if (row && row.id) {
          applyRemoteRow(entity, row)
            .then(() => setState({ status: 'synced', lastSyncedAt: Date.now() }))
            .catch((e) => console.error('[sync] realtime apply failed', e))
        }
      },
    )
  }
  channel.subscribe()

  // Debounced push whenever local data changes.
  const schedulePush = () => {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void fullSync(userId), 1200)
  }
  cleanups.push(onLocalChange(schedulePush))

  // Re-sync on reconnect and when the app regains focus.
  const onOnline = () => void fullSync(userId)
  const onVisible = () => {
    if (document.visibilityState === 'visible') void fullSync(userId)
  }
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisible)
  cleanups.push(() => window.removeEventListener('online', onOnline))
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisible))
}

/** Tear down realtime + listeners (e.g. on sign-out). */
export function stopSync() {
  if (channel && supabase) supabase.removeChannel(channel)
  channel = null
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
  cleanups.forEach((fn) => fn())
  cleanups = []
  setState({ status: 'signed-out', lastSyncedAt: null })
}
