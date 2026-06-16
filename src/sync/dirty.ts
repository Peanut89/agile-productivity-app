// A minimal pub/sub the data layer pings whenever local data changes, so the
// sync engine can schedule a debounced push without coupling db.ts to sync.
type Listener = () => void

const listeners = new Set<Listener>()

export function onLocalChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function markDirty() {
  for (const fn of listeners) fn()
}
