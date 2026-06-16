import { useState } from 'react'
import { createStory } from '../db'
import {
  STORY_STATUSES,
  STATUS_LABEL,
  PRIORITY_LABEL,
  type Epic,
  type Sprint,
  type Priority,
  type StoryStatus,
} from '../types'
import { Sheet } from './Sheet'
import { inputClass, labelClass, primaryBtnClass } from './ui'

interface Props {
  open: boolean
  epics: Epic[]
  sprints: Sprint[]
  defaultStatus?: StoryStatus
  defaultSprintId?: string
  onClose: () => void
  onCreated?: (id: string) => void
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export function CreateStorySheet({
  open,
  epics,
  sprints,
  defaultStatus = 'backlog',
  defaultSprintId,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<StoryStatus>(defaultStatus)
  const [points, setPoints] = useState('')
  const [epicId, setEpicId] = useState('')
  const [sprintId, setSprintId] = useState(defaultSprintId ?? '')

  // Re-sync defaults each time the sheet opens.
  const reset = () => {
    setTitle('')
    setPriority('medium')
    setStatus(defaultStatus)
    setPoints('')
    setEpicId('')
    setSprintId(defaultSprintId ?? '')
  }

  const submit = async () => {
    const t = title.trim()
    if (!t) return
    const id = await createStory({
      title: t,
      priority,
      status,
      points: points ? Number(points) : undefined,
      epicId: epicId || undefined,
      sprintId: sprintId || undefined,
    })
    reset()
    onClose()
    onCreated?.(id)
  }

  return (
    <Sheet open={open} title="New story" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            autoFocus
            className={inputClass}
            placeholder="As a user, I want to…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as StoryStatus)}
            >
              {STORY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Points</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className={inputClass}
              placeholder="—"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Epic</label>
            <select
              className={inputClass}
              value={epicId}
              onChange={(e) => setEpicId(e.target.value)}
            >
              <option value="">None</option>
              {epics.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Sprint</label>
          <select
            className={inputClass}
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
          >
            <option value="">Backlog (no sprint)</option>
            {sprints.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={submit} disabled={!title.trim()} className={primaryBtnClass}>
          Create story
        </button>
      </div>
    </Sheet>
  )
}
