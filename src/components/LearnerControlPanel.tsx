import { BookOpenCheck, Download, Settings2, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useId, useState, type ChangeEvent } from 'react'
import type {
  ApprovedPresentationPreferences,
  MasteryRecord,
  PreferenceSignal,
  SourceAnchor,
} from '../personalization/types'

type PreferenceDimension = PreferenceSignal['dimension']

interface LearnerControlPanelProps {
  approvedPresentation: ApprovedPresentationPreferences
  dueReviews: MasteryRecord[]
  evidenceCount: number
  onSetPreference: (signal: PreferenceSignal) => void
  onClearPreference: (dimension: PreferenceDimension) => void
  onExport: () => string
  onReset: () => void
  onOpenReview?: (anchor: SourceAnchor) => void
}

const CONTROLS = [
  {
    dimension: 'detail',
    label: 'Explanation detail',
    options: [
      ['simpler', 'Shorter and simpler'],
      ['balanced', 'Balanced'],
      ['detailed', 'More detailed'],
    ],
  },
  {
    dimension: 'structure',
    label: 'Explanation structure',
    options: [
      ['narrative', 'Clear paragraphs'],
      ['steps', 'Step by step'],
    ],
  },
  {
    dimension: 'examples',
    label: 'Examples',
    options: [
      ['minimal', 'Only when needed'],
      ['more-examples', 'Use more examples'],
    ],
  },
  {
    dimension: 'practice',
    label: 'Practice',
    options: [
      ['explanation', 'Explanation first'],
      ['quiz', 'Offer a quick check'],
    ],
  },
] as const

function preferenceFor(
  preferences: ApprovedPresentationPreferences,
  dimension: PreferenceDimension,
) {
  return preferences[dimension]
}

function signalFromSelection(
  dimension: PreferenceDimension,
  value: string,
): PreferenceSignal | null {
  if (dimension === 'detail' && ['simpler', 'balanced', 'detailed'].includes(value)) {
    return { dimension, value: value as 'simpler' | 'balanced' | 'detailed' }
  }
  if (dimension === 'structure' && ['narrative', 'steps'].includes(value)) {
    return { dimension, value: value as 'narrative' | 'steps' }
  }
  if (dimension === 'examples' && ['minimal', 'more-examples'].includes(value)) {
    return { dimension, value: value as 'minimal' | 'more-examples' }
  }
  if (dimension === 'practice' && ['explanation', 'quiz'].includes(value)) {
    return { dimension, value: value as 'explanation' | 'quiz' }
  }
  return null
}

export function LearnerControlPanel({
  approvedPresentation,
  dueReviews,
  evidenceCount,
  onSetPreference,
  onClearPreference,
  onExport,
  onReset,
  onOpenReview,
}: LearnerControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [status, setStatus] = useState('')
  const headingId = useId()

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const updatePreference = (
    dimension: PreferenceDimension,
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value
    if (!value) {
      onClearPreference(dimension)
      setStatus('Saved preference removed.')
      return
    }
    const signal = signalFromSelection(dimension, value)
    if (signal) {
      onSetPreference(signal)
      setStatus('Learning preference saved.')
    }
  }

  const downloadModel = () => {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'global-lab-learning-data.json'
    link.click()
    URL.revokeObjectURL(url)
    setStatus('Learning data exported.')
  }

  const resetModel = () => {
    onReset()
    setConfirmReset(false)
    setStatus('All saved learning data was deleted.')
  }

  return (
    <div className="learner-controls">
      <button
        type="button"
        className="learner-controls__trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Settings2 size={15} aria-hidden="true" />
        Learning settings
        {dueReviews.length > 0 && (
          <span className="learner-controls__badge" aria-label={`${dueReviews.length} reviews due`}>
            {dueReviews.length}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="learner-controls__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
        >
          <header className="learner-controls__header">
            <div>
              <p className="learner-controls__eyebrow">Your learning controls</p>
              <h2 id={headingId}>What Global Lab remembers</h2>
            </div>
            <button
              type="button"
              className="learner-controls__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close learning settings"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </header>

          <div className="learner-controls__assurance" role="note">
            <ShieldCheck size={17} aria-hidden="true" />
            <p>
              <strong>You stay in control.</strong> Global Lab only applies a pattern after
              you approve it. Learning progress is stored separately from presentation
              preferences, and this is not a diagnosis.
            </p>
          </div>

          <section className="learner-controls__section" aria-labelledby={`${headingId}-preferences`}>
            <div className="learner-controls__section-heading">
              <h3 id={`${headingId}-preferences`}>Presentation preferences</h3>
              <span>{Object.keys(approvedPresentation).length} saved</span>
            </div>
            <div className="learner-controls__fields">
              {CONTROLS.map((control) => {
                const preference = preferenceFor(approvedPresentation, control.dimension)
                return (
                  <label key={control.dimension}>
                    <span>{control.label}</span>
                    <select
                      value={preference?.value ?? ''}
                      onChange={(event) => updatePreference(control.dimension, event)}
                    >
                      <option value="">No saved preference</option>
                      {control.options.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {preference && (
                      <small>
                        {preference.origin === 'inferred'
                          ? 'Suggested from repeated successful choices, then approved by you.'
                          : 'Chosen directly by you.'}
                      </small>
                    )}
                  </label>
                )
              })}
            </div>
          </section>

          <section className="learner-controls__section" aria-labelledby={`${headingId}-reviews`}>
            <div className="learner-controls__section-heading">
              <h3 id={`${headingId}-reviews`}>
                <BookOpenCheck size={16} aria-hidden="true" />
                Review queue
              </h3>
              <span>{dueReviews.length} due</span>
            </div>
            {dueReviews.length === 0 ? (
              <p className="learner-controls__empty">
                Nothing is due now. Quick checks create review reminders based on recall.
              </p>
            ) : (
              <ul className="learner-controls__reviews">
                {dueReviews.slice(0, 5).map((review) => (
                  <li key={review.anchorKey}>
                    <div>
                      <strong>{review.anchor.sourceTitle}</strong>
                      <span>{review.anchor.anchorLabel}</span>
                    </div>
                    {onOpenReview && (
                      <button type="button" onClick={() => onOpenReview(review.anchor)}>
                        Open source
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="learner-controls__section learner-controls__data" aria-labelledby={`${headingId}-data`}>
            <div>
              <h3 id={`${headingId}-data`}>Your data</h3>
              <p>{evidenceCount} learning interactions are stored in this browser.</p>
            </div>
            <div className="learner-controls__data-actions">
              <button type="button" onClick={downloadModel}>
                <Download size={14} aria-hidden="true" />
                Export
              </button>
              {!confirmReset ? (
                <button type="button" onClick={() => setConfirmReset(true)}>
                  <Trash2 size={14} aria-hidden="true" />
                  Delete learning data
                </button>
              ) : (
                <div className="learner-controls__confirm" role="group" aria-label="Confirm deletion">
                  <span>Delete preferences and review history?</span>
                  <button type="button" onClick={resetModel}>Yes, delete</button>
                  <button type="button" onClick={() => setConfirmReset(false)}>Cancel</button>
                </div>
              )}
            </div>
          </section>

          <p className="sr-only" aria-live="polite">{status}</p>
        </section>
      )}
    </div>
  )
}
