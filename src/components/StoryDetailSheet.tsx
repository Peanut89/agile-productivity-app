import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  updateStory,
  deleteStory,
  createTask,
  toggleTask,
  deleteTask,
} from '../db'
import { useTasksByStory } from '../hooks'
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
import { CheckIcon, TrashIcon, PlusIcon } from './icons'
import { inputClass, labelClass } from './ui'

interface Props {
  storyId: string | null
  epics: Epic[]
  sprints: Sprint[]
  onClose: () => void
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export function StoryDetailSheet({ storyId, epics, sprints, onClose }: Props) {
  const story = useLiveQuery(
    () => (storyId ? db.stories.get(storyId) : undefined),
    [storyId],
    undefined,
  )
  const tasks = useTasksByStory(storyId ?? undefined)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newTask, setNewTask] = useState('')
  const newTaskRef = useRef<HTMLInputElement>(null)

  // Sync local text fields when the story loads/changes.
  useEffect(() => {
    if (story) {
      setTitle(story.title)
      setDescription(story.description ?? '')
    }
  }, [story?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!storyId) return null

  const commitTitle = () => {
    const t = title.trim()
    if (story && t && t !== story.title) updateStory(story.id, { title: t })
  }
  const commitDescription = () => {
    if (story && description !== (story.description ?? ''))
      updateStory(story.id, { description: description.trim() || undefined })
  }

  const addTask = async () => {
    const t = newTask.trim()
    if (!t || !story) return
    await createTask(story.id, t)
    setNewTask('')
    newTaskRef.current?.focus()
  }

  const handleDelete = async () => {
    if (!story) return
    if (confirm(`Delete "${story.title}" and its checklist?`)) {
      await deleteStory(story.id)
      onClose()
    }
  }

  return (
    <Sheet open={!!storyId} title="Story" onClose={onClose}>
      {!story ? (
        <p className="py-8 text-center text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={description}
              placeholder="Details, acceptance criteria…"
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={story.status}
                onChange={(e) =>
                  updateStory(story.id, { status: e.target.value as StoryStatus })
                }
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
                value={story.priority}
                onChange={(e) =>
                  updateStory(story.id, { priority: e.target.value as Priority })
                }
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
                value={story.points ?? ''}
                onChange={(e) =>
                  updateStory(story.id, {
                    points: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Epic</label>
              <select
                className={inputClass}
                value={story.epicId ?? ''}
                onChange={(e) =>
                  updateStory(story.id, { epicId: e.target.value || undefined })
                }
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
              value={story.sprintId ?? ''}
              onChange={(e) =>
                updateStory(story.id, { sprintId: e.target.value || undefined })
              }
            >
              <option value="">Backlog (no sprint)</option>
              {sprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist */}
          <div>
            <label className={labelClass}>
              Checklist ({tasks.filter((t) => t.done).length}/{tasks.length})
            </label>
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-2)] px-2.5 py-2"
                >
                  <button
                    onClick={() => toggleTask(task.id, !task.done)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      task.done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-500'
                    }`}
                    aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.done && <CheckIcon width={14} height={14} />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      task.done ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-slate-500 active:text-red-400"
                    aria-label="Delete task"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                ref={newTaskRef}
                className={inputClass}
                placeholder="Add a checklist item…"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <button
                onClick={addTask}
                disabled={!newTask.trim()}
                className="flex w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white active:bg-blue-700 disabled:opacity-40"
                aria-label="Add task"
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-3 font-medium text-red-400 active:bg-red-500/10"
          >
            <TrashIcon width={18} height={18} /> Delete story
          </button>
        </div>
      )}
    </Sheet>
  )
}
