import { useState } from 'react'
import { useStories, useEpics, useSprints, useActiveSprint, useTaskCounts } from './hooks'
import { useSession } from './auth/useSession'
import { useSyncLifecycle, useSyncStatus } from './sync/useSync'
import { BottomNav, type Tab } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { Board } from './components/Board'
import { Backlog } from './components/Backlog'
import { Epics } from './components/Epics'
import { Sprints } from './components/Sprints'
import { StoryDetailSheet } from './components/StoryDetailSheet'
import { CreateStorySheet } from './components/CreateStorySheet'
import { CreateEpicSheet } from './components/CreateEpicSheet'
import { CreateSprintSheet } from './components/CreateSprintSheet'
import { AccountSheet } from './components/AccountSheet'
import { PlusIcon } from './components/icons'

type CreateKind = 'story' | 'epic' | 'sprint' | null

export function App() {
  const [tab, setTab] = useState<Tab>('board')
  const [openStoryId, setOpenStoryId] = useState<string | null>(null)
  const [creating, setCreating] = useState<CreateKind>(null)
  const [accountOpen, setAccountOpen] = useState(false)

  const { session } = useSession()
  useSyncLifecycle(session?.user.id)
  const sync = useSyncStatus()

  const stories = useStories()
  const epics = useEpics()
  const sprints = useSprints()
  const activeSprint = useActiveSprint()
  const counts = useTaskCounts()

  // The floating + button is contextual to the current tab.
  const fabAction = () => {
    if (tab === 'epics') setCreating('epic')
    else if (tab === 'sprints') setCreating('sprint')
    else setCreating('story')
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <TopBar
        status={sync.status}
        signedIn={!!session}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <main className="min-h-0 flex-1 pt-3">
        {tab === 'board' && (
          <Board
            stories={stories}
            epics={epics}
            activeSprint={activeSprint}
            counts={counts}
            onOpenStory={setOpenStoryId}
          />
        )}
        {tab === 'backlog' && (
          <Backlog
            stories={stories}
            epics={epics}
            counts={counts}
            onOpenStory={setOpenStoryId}
          />
        )}
        {tab === 'epics' && <Epics epics={epics} stories={stories} />}
        {tab === 'sprints' && <Sprints sprints={sprints} stories={stories} />}
      </main>

      {/* Contextual floating action button */}
      <button
        onClick={fabAction}
        className="safe-bottom fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40 active:bg-blue-700"
        aria-label="Add"
      >
        <PlusIcon width={26} height={26} />
      </button>

      <BottomNav active={tab} onChange={setTab} />

      {/* Sheets */}
      <StoryDetailSheet
        storyId={openStoryId}
        epics={epics}
        sprints={sprints}
        onClose={() => setOpenStoryId(null)}
      />
      <CreateStorySheet
        open={creating === 'story'}
        epics={epics}
        sprints={sprints}
        defaultStatus={tab === 'backlog' ? 'backlog' : 'todo'}
        defaultSprintId={tab === 'board' ? activeSprint?.id : undefined}
        onClose={() => setCreating(null)}
        onCreated={(id) => setOpenStoryId(id)}
      />
      <CreateEpicSheet open={creating === 'epic'} onClose={() => setCreating(null)} />
      <CreateSprintSheet
        open={creating === 'sprint'}
        onClose={() => setCreating(null)}
      />
      <AccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        session={session}
        status={sync.status}
        lastSyncedAt={sync.lastSyncedAt}
      />
    </div>
  )
}
