import { useState } from 'react'
import { createSprint } from '../db'
import { Sheet } from './Sheet'
import { inputClass, labelClass, primaryBtnClass } from './ui'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateSprintSheet({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const submit = async () => {
    const n = name.trim()
    if (!n) return
    await createSprint({
      name: n,
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setName('')
    setGoal('')
    setStartDate('')
    setEndDate('')
    onClose()
  }

  return (
    <Sheet open={open} title="New sprint" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input
            autoFocus
            className={inputClass}
            placeholder="e.g. Sprint 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <div>
          <label className={labelClass}>Goal</label>
          <input
            className={inputClass}
            placeholder="Optional sprint goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Start</label>
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>End</label>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button onClick={submit} disabled={!name.trim()} className={primaryBtnClass}>
          Create sprint
        </button>
      </div>
    </Sheet>
  )
}
