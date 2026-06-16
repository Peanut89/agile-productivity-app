export type Priority = 'low' | 'medium' | 'high'

export type StoryStatus = 'backlog' | 'todo' | 'in_progress' | 'done'

export const STORY_STATUSES: StoryStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'done',
]

export const BOARD_STATUSES: StoryStatus[] = ['todo', 'in_progress', 'done']

export const STATUS_LABEL: Record<StoryStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/** Tailwind-ish hex palette used for epic color dots. */
export const EPIC_COLORS = [
  '#60a5fa', // blue
  '#34d399', // green
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#f87171', // red
  '#22d3ee', // cyan
  '#fb923c', // orange
] as const

export interface Epic {
  id: string
  title: string
  description?: string
  color: string
  createdAt: number
}

export interface Sprint {
  id: string
  name: string
  goal?: string
  startDate?: string // ISO date (yyyy-mm-dd)
  endDate?: string
  status: 'planned' | 'active' | 'completed'
  createdAt: number
}

export interface Story {
  id: string
  title: string
  description?: string
  epicId?: string
  sprintId?: string
  status: StoryStatus
  priority: Priority
  points?: number
  order: number // sort order within a status column
  createdAt: number
}

export interface Task {
  id: string
  storyId: string
  title: string
  done: boolean
  order: number
  createdAt: number
}
