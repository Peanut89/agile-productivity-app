import { db, createEpic, createStory } from './db'
import { EPIC_COLORS } from './types'

// One-time starter data, applied as discrete "steps". Each step runs at most
// once (tracked in localStorage), so appending a new batch here is safe and
// deleting seeded items won't make them reappear on the next load.

const stepKey = (key: string) => `seed:${key}`
const isApplied = (key: string) => localStorage.getItem(stepKey(key)) === '1'
const markApplied = (key: string) => localStorage.setItem(stepKey(key), '1')

async function runStep(key: string, fn: () => Promise<void>) {
  if (isApplied(key)) return
  markApplied(key) // set up front so a double-invoke can't run it twice
  try {
    await fn()
  } catch (e) {
    localStorage.removeItem(stepKey(key)) // allow a retry on next load
    throw e
  }
}

const SEED_EPICS = [
  'Finish Kitchen',
  'Clean Garage',
  'Clean Attic',
  'Chrachel Wing Tody Catch-up',
  'Camp Barren Tody Catch-up',
]

async function seedEpics() {
  const existing = new Set((await db.epics.toArray()).map((e) => e.title))
  for (let i = 0; i < SEED_EPICS.length; i++) {
    if (!existing.has(SEED_EPICS[i])) {
      await createEpic({
        title: SEED_EPICS[i],
        color: EPIC_COLORS[i % EPIC_COLORS.length],
      })
    }
  }
}

/** Find an epic by title, creating it if it's missing, and return its id. */
async function epicIdByTitle(title: string): Promise<string> {
  const found = await db.epics.filter((e) => e.title === title).first()
  if (found) return found.id
  const color = EPIC_COLORS[SEED_EPICS.indexOf(title) % EPIC_COLORS.length]
  return createEpic({ title, color })
}

const KITCHEN_STORIES = [
  'Spackle ceilings',
  'Spackle wall',
  'Paint ceiling',
  'Patch holes in wall',
  'Furniture trim',
  'Plexiglass dog guard',
]

async function seedKitchenStories() {
  const epicId = await epicIdByTitle('Finish Kitchen')
  for (const title of KITCHEN_STORIES) {
    await createStory({ title, epicId, status: 'backlog', priority: 'medium' })
  }
}

// "Large" maps to 8 story points (Fibonacci).
const GARAGE_STORIES = ['Get rid of trash', 'Clean up sawdust', 'Organize tools']

async function seedGarageStories() {
  const epicId = await epicIdByTitle('Clean Garage')
  for (const title of GARAGE_STORIES) {
    await createStory({
      title,
      epicId,
      status: 'backlog',
      priority: 'medium',
      points: 8,
    })
  }
}

const CHRACHEL_WING_STORIES = ['Guest Room', 'Bedroom', 'Bathroom']

async function seedChrachelWingStories() {
  const epicId = await epicIdByTitle('Chrachel Wing Tody Catch-up')
  for (const title of CHRACHEL_WING_STORIES) {
    await createStory({ title, epicId, status: 'backlog', priority: 'medium' })
  }
}

export async function seedInitialData() {
  // Migrate the original single-flag seed to the step model.
  if (localStorage.getItem('seed-v1') && !isApplied('epics-v1')) {
    markApplied('epics-v1')
  }

  await runStep('epics-v1', seedEpics)
  await runStep('kitchen-stories-v1', seedKitchenStories)
  await runStep('garage-stories-v1', seedGarageStories)
  await runStep('chrachel-wing-stories-v1', seedChrachelWingStories)
}
