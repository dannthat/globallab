import { Atom } from 'lucide-react'
import type { PersonaSelection } from '../types'
import { AnalogyCard } from './AnalogyCard'

interface ExplorerStepProps {
  stepNumber: number
  question: string
  groundedAnswer: string
  analogy: string
  persona: PersonaSelection
  customInterest?: string
}

export function ExplorerStep({
  stepNumber,
  question,
  groundedAnswer,
  analogy,
  persona,
  customInterest,
}: ExplorerStepProps) {
  return (
    <article className="explorer-step animate-reveal">
      <header className="flex items-start gap-4">
        <span className="step-number" aria-hidden="true">
          {String(stepNumber).padStart(2, '0')}
        </span>
        <div>
          <p className="eyebrow">Question {stepNumber}</p>
          <h3 className="mt-2 text-xl font-semibold leading-snug tracking-[-0.025em] text-stone-900 sm:text-2xl">
            {question}
          </h3>
        </div>
      </header>

      <div className="science-answer">
        <div className="science-answer-label">
          <Atom size={16} aria-hidden="true" />
          Grounded explanation
        </div>
        <p className="mt-3 text-[15px] leading-7 text-stone-600 sm:text-base sm:leading-8">
          {groundedAnswer}
        </p>
      </div>

      <AnalogyCard analogy={analogy} persona={persona} customInterest={customInterest} />
    </article>
  )
}
