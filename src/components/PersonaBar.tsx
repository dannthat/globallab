import { Gamepad2, Headphones, Plus, Sparkles, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PersonaPreset, PersonaSelection } from '../types'

interface PersonaBarProps {
  persona: PersonaSelection
  customInterest?: string
  onSelect: (persona: PersonaPreset) => void
  onCustomClick: () => void
}

const personas: Array<{
  id: PersonaPreset
  label: string
  icon: LucideIcon
}> = [
  { id: 'neutral', label: 'Neutral', icon: Sparkles },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'music', label: 'Music', icon: Headphones },
]

export function PersonaBar({
  persona,
  customInterest,
  onSelect,
  onCustomClick,
}: PersonaBarProps) {
  return (
    <section className="persona-panel" aria-labelledby="learning-lens-label">
      <div>
        <p id="learning-lens-label" className="eyebrow">
          Learning lens
        </p>
        <p className="mt-1 text-sm leading-5 text-stone-500">
          The science stays fixed. Only the analogy changes.
        </p>
      </div>

      <div className="persona-options" role="group" aria-label="Analogy style">
        {personas.map((option) => {
          const Icon = option.icon
          const isActive = persona === option.id

          return (
            <button
              key={option.id}
              type="button"
              className={`persona-chip ${isActive ? 'persona-chip-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onSelect(option.id)}
            >
              <Icon size={15} aria-hidden="true" />
              {option.label}
            </button>
          )
        })}

        <button
          type="button"
          className={`persona-chip persona-chip-custom ${persona === 'custom' ? 'persona-chip-active' : ''}`}
          aria-pressed={persona === 'custom'}
          onClick={onCustomClick}
        >
          <Plus size={15} aria-hidden="true" />
          {persona === 'custom' && customInterest ? customInterest : 'Your interest'}
        </button>
      </div>
    </section>
  )
}
