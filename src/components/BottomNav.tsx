import type { ComponentType, SVGProps } from 'react'
import { BoardIcon, ListIcon, LayersIcon, SprintIcon } from './icons'

export type Tab = 'board' | 'backlog' | 'epics' | 'sprints'

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] =
  [
    { id: 'board', label: 'Board', Icon: BoardIcon },
    { id: 'backlog', label: 'Backlog', Icon: ListIcon },
    { id: 'epics', label: 'Epics', Icon: LayersIcon },
    { id: 'sprints', label: 'Sprints', Icon: SprintIcon },
  ]

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 ${
                isActive ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <Icon width={22} height={22} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
