import { Lightbulb } from 'lucide-react'
import type { PersonaSelection } from '../types'

interface AnalogyCardProps {
  analogy: string
  persona: PersonaSelection
  customInterest?: string
}

const labels: Record<Exclude<PersonaSelection, 'custom'>, string> = {
  neutral: 'Clear analogy',
  gaming: 'Gaming analogy',
  sports: 'Sports analogy',
  music: 'Music analogy',
}

export function AnalogyCard({ analogy, persona, customInterest }: AnalogyCardProps) {
  const label = persona === 'custom' ? `${customInterest ?? 'Custom'} analogy` : labels[persona]

  return (
    <aside className="analogy-card" aria-label={label}>
      <div className="analogy-icon" aria-hidden="true">
        <Lightbulb size={18} strokeWidth={2.2} />
      </div>
      <div>
        <p className="analogy-label">{label}</p>
        <p className="mt-2 text-[15px] leading-7 text-[#5d3928] sm:text-base">{analogy}</p>
      </div>
    </aside>
  )
}
