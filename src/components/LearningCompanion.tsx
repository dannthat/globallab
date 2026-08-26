import { useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Info,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  WandSparkles,
  X,
} from 'lucide-react'
import type {
  LearningOutcome,
  PersonalizationMode,
  SourceAnchor,
} from '../personalization/types'

type FeedbackOutcome = Exclude<LearningOutcome, 'unknown'>

export interface LearningCompanionQuiz {
  question: string
  options: Array<{ id: string; label: string }>
  selectedOptionId?: string | null
  submitted?: boolean
  revealed?: boolean
  correctOptionId?: string
  feedback?: string | null
  outcome?: { score: number; total: number; ratio: number } | null
}

export interface LearningCompanionProps {
  sourceAnchor: SourceAnchor
  interest: string
  mode: PersonalizationMode
  title: string
  content: string | null
  limits: string
  quiz?: LearningCompanionQuiz | null
  isLoading?: boolean
  error?: string | null
  onAction: (mode: PersonalizationMode) => void
  onOutcome: (outcome: FeedbackOutcome) => void
  onSelectQuizOption: (optionId: string) => void
  onSubmitQuiz: (optionId: string) => void
  onRevealQuiz: () => void
  onRetry: () => void
  onDismiss: () => void
}

const MODE_LABELS: Record<PersonalizationMode, string> = {
  analogy: 'Analogy',
  simpler: 'Simpler',
  'more-detailed': 'More detailed',
  'step-by-step': 'Step by step',
  'another-example': 'Another example',
  'test-me': 'Test me',
}

const REFINEMENTS: PersonalizationMode[] = [
  'analogy',
  'simpler',
  'more-detailed',
  'step-by-step',
  'another-example',
  'test-me',
]

function sourceLocation(anchor: SourceAnchor) {
  const parts: string[] = []
  if (anchor.page) parts.push(`page ${anchor.page}`)
  if (anchor.lineRange) {
    parts.push(`lines ${anchor.lineRange.start}–${anchor.lineRange.end}`)
  }
  return parts.join(' · ')
}

export function LearningCompanion({
  sourceAnchor,
  interest,
  mode,
  title,
  content,
  limits,
  quiz = null,
  isLoading = false,
  error = null,
  onAction,
  onOutcome,
  onSelectQuizOption,
  onSubmitQuiz,
  onRevealQuiz,
  onRetry,
  onDismiss,
}: LearningCompanionProps) {
  const location = sourceLocation(sourceAnchor)
  const revealAnswer = Boolean(quiz?.revealed || quiz?.submitted)
  const normalizedInterest = interest.trim().replace(/\s+/g, ' ')
  const hasInterestLens =
    Boolean(normalizedInterest) && normalizedInterest.toLowerCase() !== 'neutral'
  const feedbackKey = [
    sourceAnchor.sourceId,
    sourceAnchor.sourceRevision ?? sourceAnchor.sourceFingerprint ?? '',
    sourceAnchor.anchorId,
    mode,
    title,
    content ?? '',
  ].join('::')
  const [feedback, setFeedback] = useState<{
    key: string
    outcome: FeedbackOutcome
  } | null>(null)
  const selectedOutcome = feedback?.key === feedbackKey ? feedback.outcome : null

  const submitOutcome = (outcome: FeedbackOutcome) => {
    if (selectedOutcome === outcome) return
    setFeedback({ key: feedbackKey, outcome })
    onOutcome(outcome)
  }

  return (
    <aside
      className='learning-companion'
      aria-label={title}
      aria-busy={isLoading}
    >
      <header className='learning-companion__header'>
        <div>
          <p className='learning-companion__eyebrow'>
            <WandSparkles size={14} aria-hidden='true' />
            <span>{hasInterestLens ? `Lens: ${normalizedInterest} ·` : 'Learn your way ·'}</span>
            <strong>{MODE_LABELS[mode]}</strong>
          </p>
          <h2>{title}</h2>
        </div>
        <button
          type='button'
          className='learning-companion__dismiss'
          onClick={onDismiss}
          aria-label='Dismiss learning companion'
        >
          <X size={16} aria-hidden='true' />
        </button>
      </header>

      <p className='learning-companion__integrity'>
        <ShieldCheck size={15} aria-hidden='true' />
        <span><strong>Original unchanged.</strong> This help stays separate from the source.</span>
      </p>

      {isLoading && (
        <p className='learning-companion__status' role='status'>
          <LoaderCircle className='liyw-spinner' size={15} aria-hidden='true' />
          Creating personalized help…
        </p>
      )}

      {error && (
        <div className='learning-companion__error' role='alert'>
          <Info size={16} aria-hidden='true' />
          <p>{error}</p>
          <button type='button' onClick={onRetry} disabled={isLoading}>
            <RefreshCw size={14} aria-hidden='true' />
            Try again
          </button>
        </div>
      )}

      {content && (
        <div className='learning-companion__content'>
          {content.split(/\n{2,}/).map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
          ))}
        </div>
      )}

      {limits.trim() && (
        <p className='learning-companion__limits'>
          <Info size={14} aria-hidden='true' />
          <span><strong>Where this help stops:</strong> {limits}</span>
        </p>
      )}

      {quiz && (
        <section className='learning-companion__quiz' aria-label='Source-grounded check'>
          <fieldset>
            <legend>{quiz.question}</legend>
            <div>
              {quiz.options.map((option) => {
                const isCorrect =
                  revealAnswer && option.id === quiz.correctOptionId
                const label = isCorrect
                  ? `${option.label} — correct answer`
                  : option.label
                return (
                  <label key={option.id}>
                    <input
                      type='radio'
                      name={`learning-companion-${sourceAnchor.anchorId}`}
                      value={option.id}
                      checked={quiz.selectedOptionId === option.id}
                      onChange={() => onSelectQuizOption(option.id)}
                      disabled={isLoading}
                      aria-label={label}
                    />
                    <span>{option.label}</span>
                    {isCorrect && <CheckCircle2 size={15} aria-hidden='true' />}
                  </label>
                )
              })}
            </div>
          </fieldset>
          <div className='learning-companion__quiz-actions'>
            <button
              type='button'
              onClick={() => quiz.selectedOptionId && onSubmitQuiz(quiz.selectedOptionId)}
              disabled={!quiz.selectedOptionId || isLoading}
            >
              Submit answer
            </button>
            <button
              type='button'
              onClick={onRevealQuiz}
              disabled={revealAnswer || isLoading}
            >
              Reveal answer
            </button>
          </div>
          {revealAnswer && quiz.feedback && (
            <p className='learning-companion__quiz-feedback'>{quiz.feedback}</p>
          )}
          {quiz.outcome && (
            <p className='learning-companion__quiz-score' role='status'>
              Score: {quiz.outcome.score} of {quiz.outcome.total}
            </p>
          )}
        </section>
      )}

      <div className='learning-companion__refinements' role='group' aria-label='Refine this help'>
        {REFINEMENTS.map((refinement) => (
          <button
            key={refinement}
            type='button'
            onClick={() => onAction(refinement)}
            disabled={isLoading}
            aria-pressed={mode === refinement}
          >
            {refinement === 'analogy' && hasInterestLens && mode !== 'analogy'
              ? `Back to ${normalizedInterest} lens`
              : MODE_LABELS[refinement]}
          </button>
        ))}
      </div>

      <footer className='learning-companion__footer'>
        <div className='learning-companion__source'>
          <BookOpen size={14} aria-hidden='true' />
          <p>
            {sourceAnchor.sourceKind === 'upload'
              ? 'From your uploaded source: '
              : 'According to '}
            {sourceAnchor.url ? (
              <a href={sourceAnchor.url} target='_blank' rel='noreferrer'>
                {sourceAnchor.sourceTitle}
              </a>
            ) : (
              <strong>{sourceAnchor.sourceTitle}</strong>
            )}
            <span>{sourceAnchor.anchorLabel}{location ? ` · ${location}` : ''}</span>
          </p>
        </div>
        <div className='learning-companion__feedback'>
          <div className='learning-companion__outcomes' role='group' aria-label='Was this helpful?'>
            <button
              type='button'
              aria-pressed={selectedOutcome === 'successful'}
              onClick={() => submitOutcome('successful')}
            >
              <ThumbsUp size={14} aria-hidden='true' />
              Helped
            </button>
            <button
              type='button'
              aria-pressed={selectedOutcome === 'needs-review'}
              onClick={() => submitOutcome('needs-review')}
            >
              <ThumbsDown size={14} aria-hidden='true' />
              Not yet
            </button>
          </div>
          {selectedOutcome && (
            <p
              className='learning-companion__feedback-status'
              role='status'
              aria-label='Helpfulness feedback'
              aria-live='polite'
              aria-atomic='true'
            >
              <CheckCircle2 size={13} aria-hidden='true' />
              {selectedOutcome === 'successful'
                ? 'Saved — this helps tune future support.'
                : 'Saved — try another format above; I’ll learn from this.'}
            </p>
          )}
        </div>
      </footer>
    </aside>
  )
}
