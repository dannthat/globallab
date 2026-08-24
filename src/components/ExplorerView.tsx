import { ArrowRight, Check, MessageCircleMore } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CustomPersonaResult, PersonaSelection, Topic } from '../types'
import { ExplorerStep } from './ExplorerStep'
import { HelpfulButton } from './HelpfulButton'

interface ExplorerViewProps {
  topic: Topic
  persona: PersonaSelection
  customResult: CustomPersonaResult | null
  isPreferred: boolean
  onMarkHelpful: () => void
}

export function ExplorerView({
  topic,
  persona,
  customResult,
  isPreferred,
  onMarkHelpful,
}: ExplorerViewProps) {
  const [visibleCount, setVisibleCount] = useState(1)

  const steps = useMemo(() => {
    if (persona === 'custom' && customResult) return customResult.steps

    const preset = persona === 'custom' ? 'neutral' : persona
    return topic.explorer.map((step) => ({
      question: step.question,
      groundedAnswer: step.groundedAnswer,
      analogy: step.analogies[preset],
    }))
  }, [customResult, persona, topic])

  const isComplete = visibleCount >= steps.length

  return (
    <div className="space-y-5">
      <div className="explorer-progress">
        <div className="flex items-center gap-3">
          <span className="progress-icon" aria-hidden="true">
            <MessageCircleMore size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-800">Socratic path</p>
            <p className="text-xs text-stone-500">Follow the mechanism one question at a time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2" aria-label={`${visibleCount} of ${steps.length} questions revealed`}>
          {steps.map((step, index) => (
            <span
              key={step.question}
              className={`progress-pip ${index < visibleCount ? 'progress-pip-active' : ''}`}
            />
          ))}
          <span className="ml-1 text-xs font-semibold text-stone-500">
            {visibleCount}/{steps.length}
          </span>
        </div>
      </div>

      {steps.slice(0, visibleCount).map((step, index) => (
        <ExplorerStep
          key={`${customResult?.interest ?? persona}-${step.question}`}
          stepNumber={index + 1}
          question={step.question}
          groundedAnswer={step.groundedAnswer}
          analogy={step.analogy}
          persona={persona}
          customInterest={customResult?.interest}
        />
      ))}

      {!isComplete ? (
        <button
          type="button"
          className="continue-button"
          onClick={() => setVisibleCount((count) => Math.min(count + 1, steps.length))}
        >
          Next question
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      ) : (
        <div className="completion-note animate-reveal">
          <Check size={17} aria-hidden="true" />
          You followed the energy pathway from fuel to failure point.
        </div>
      )}

      {isComplete && (
        <HelpfulButton mode="explorer" isPreferred={isPreferred} onSave={onMarkHelpful} />
      )}
    </div>
  )
}
