import { useEffect, useState } from 'react'
import {
  startSync,
  stopSync,
  subscribeSync,
  getSyncState,
  type SyncStatus,
} from './engine'

export type { SyncStatus }

/** Subscribe to the sync engine's status for display. */
export function useSyncStatus() {
  const [state, setState] = useState(getSyncState())
  useEffect(() => {
    const unsub = subscribeSync(setState)
    return () => void unsub()
  }, [])
  return state
}

/** Start/stop the sync engine in step with the signed-in user. */
export function useSyncLifecycle(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    void startSync(userId)
    return () => stopSync()
  }, [userId])
}
