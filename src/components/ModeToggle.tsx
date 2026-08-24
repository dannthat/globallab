import { BookOpenText, Compass, Star } from 'lucide-react'
import type { StudyMode } from '../types'

interface ModeToggleProps {
  mode: StudyMode
  preferredMode?: StudyMode
  onChange: (mode: StudyMode) => void
}

const modes = [
  {
    id: 'cram' as const,
    label: 'Cram',
    description: 'Exam-ready essentials',
    icon: BookOpenText,
  },
  {
    id: 'explorer' as const,
    label: 'Explorer',
    description: 'Understand the why',
    icon: Compass,
  },
]

export function ModeToggle({ mode, preferredMode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="Choose a study mode">
      {modes.map((option) => {
        const Icon = option.icon
        const isActive = mode === option.id
        const isPreferred = preferredMode === option.id

        return (
          <button
            key={option.id}
            type="button"
            className={`mode-option ${isActive ? 'mode-option-active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
          >
            <span className="mode-icon" aria-hidden="true">
              <Icon size={19} strokeWidth={2} />
            </span>
            <span className="min-w-0 text-left">
              <span className="flex items-center gap-2">
                <span className="mode-label">{option.label}</span>
                {isPreferred && (
                  <span className="preferred-badge">
                    <Star size={10} fill="currentColor" aria-hidden="true" />
                    Preferred
                  </span>
                )}
              </span>
              <span className="mode-description">{option.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
