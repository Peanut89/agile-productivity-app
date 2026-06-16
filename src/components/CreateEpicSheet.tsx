import { useState } from 'react'
import { createEpic } from '../db'
import { EPIC_COLORS } from '../types'
import { Sheet } from './Sheet'
import { inputClass, labelClass, primaryBtnClass } from './ui'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateEpicSheet({ open, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(EPIC_COLORS[0])

  const submit = async () => {
    const t = title.trim()
    if (!t) return
    await createEpic({ title: t, description: description.trim() || undefined, color })
    setTitle('')
    setDescription('')
    setColor(EPIC_COLORS[0])
    onClose()
  }

  return (
    <Sheet open={open} title="New epic" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            autoFocus
            className={inputClass}
            placeholder="e.g. Onboarding flow"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <input
            className={inputClass}
            placeholder="Optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Color</label>
          <div className="flex flex-wrap gap-2.5">
            {EPIC_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-110 border-white' : 'border-transparent'
                }`}
                style={{ background: c }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={!title.trim()} className={primaryBtnClass}>
          Create epic
        </button>
      </div>
    </Sheet>
  )
}
