import { BookOpenCheck, Download, Settings2, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useId, useState, type ChangeEvent } from 'react'
import type {
  ApprovedPresentationPreferences,
  CrossSourcePermission,
  MasteryRecord,
  LivingMasteryNode,
  PreferenceSignal,
  SourceAnchor,
  UnderstandingClaim,
  UnderstandingClaimDecisionAction,
} from '../personalization/types'
import { UnderstandingMirrorPanel } from './UnderstandingMirrorPanel'
import type { StudentProfile } from '../types'

type PreferenceDimension = PreferenceSignal['dimension']

interface LearnerControlPanelProps {
  studentProfile?: StudentProfile
  approvedPresentation: ApprovedPresentationPreferences
  dueReviews: MasteryRecord[]
  evidenceCount: number
  understandingClaims?: UnderstandingClaim[]
  masteryMap?: LivingMasteryNode[]
  sourceData?: Array<{
    sourceId: string
    sourceTitle: string
    sourceKind: SourceAnchor['sourceKind']
    evidenceCount: number
  }>
  crossSourcePermissions?: CrossSourcePermission[]
  onSetPreference: (signal: PreferenceSignal) => void
  onClearPreference: (dimension: PreferenceDimension) => void
  onExport: () => string
  onReset: () => void
  onOpenReview?: (anchor: SourceAnchor) => void
  onDecideClaim?: (
    claimId: string,
    action: UnderstandingClaimDecisionAction,
    correction?: string,
  ) => void
  onDeleteSourceData?: (sourceId: string) => void
  onRevokeCrossSourcePermission?: (permissionId: string) => void
  onUpdateStudentProfile?: (profile: Omit<StudentProfile, 'createdAt'>) => void
}

const LEARNING_LEVELS = [
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'University',
  'Independent learner',
] as const

const LEARNING_GOALS = [
  'Understand difficult material',
  'Prepare for an exam',
  'Finish an assignment',
  'Review what I learned',
  'Explore something new',
] as const

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
  studentProfile,
  approvedPresentation,
  dueReviews,
  evidenceCount,
  understandingClaims = [],
  masteryMap = [],
  sourceData = [],
  crossSourcePermissions = [],
  onSetPreference,
  onClearPreference,
  onExport,
  onReset,
  onOpenReview,
  onDecideClaim = () => undefined,
  onDeleteSourceData,
  onRevokeCrossSourcePermission,
  onUpdateStudentProfile,
}: LearnerControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmSourceId, setConfirmSourceId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [interestDraft, setInterestDraft] = useState(studentProfile?.interest ?? '')
  const headingId = useId()

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const updateStudentProfile = (updates: Partial<Omit<StudentProfile, 'createdAt'>>) => {
    if (!studentProfile || !onUpdateStudentProfile) return
    const { createdAt: _createdAt, ...editableProfile } = studentProfile
    onUpdateStudentProfile({ ...editableProfile, ...updates })
    setStatus('Koji defaults saved.')
  }

  const toggleLearningGoal = (goal: string) => {
    const current = studentProfile?.learningGoals ?? []
    const next = current.includes(goal)
      ? current.filter((item) => item !== goal)
      : current.length >= 2
        ? [current[1], goal]
        : [...current, goal]
    updateStudentProfile({ learningGoals: next })
  }

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
        onClick={() => {
          if (!isOpen) setInterestDraft(studentProfile?.interest ?? '')
          setIsOpen((open) => !open)
        }}
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

          <UnderstandingMirrorPanel
            claims={understandingClaims}
            masteryMap={masteryMap}
            onDecideClaim={onDecideClaim}
            onOpenSource={onOpenReview}
          />

          {studentProfile && onUpdateStudentProfile && (
            <section className={'learner-controls__section'} aria-labelledby={`${headingId}-koji-defaults`}>
              <div className={'learner-controls__section-heading'}>
                <h3 id={`${headingId}-koji-defaults`}>Koji starting defaults</h3>
                <span>Editable anytime</span>
              </div>
              <p className={'learner-controls__empty'}>
                These guide the first response. Got it and Still stuck keep improving future help.
              </p>
              <div className={'learner-controls__fields learner-controls__profile-fields'}>
                <label>
                  <span>Learning context</span>
                  <select
                    value={studentProfile.gradeLevel ?? 'Independent learner'}
                    onChange={(event) => updateStudentProfile({ gradeLevel: event.target.value })}
                  >
                    {LEARNING_LEVELS.map((level) => <option key={level}>{level}</option>)}
                  </select>
                </label>
                <label>
                  <span>Response language</span>
                  <select
                    value={studentProfile.preferredLanguage ?? 'English'}
                    onChange={(event) => updateStudentProfile({ preferredLanguage: event.target.value })}
                  >
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </label>
                <label>
                  <span>Start explanations</span>
                  <select
                    value={studentProfile.startingSupport ?? 'balanced'}
                    onChange={(event) => updateStudentProfile({
                      startingSupport: event.target.value as NonNullable<StudentProfile['startingSupport']>,
                    })}
                  >
                    <option value={'quick'}>Quick and direct</option>
                    <option value={'balanced'}>Balanced</option>
                    <option value={'guided'}>Guide me carefully</option>
                  </select>
                </label>
                <label>
                  <span>When I am still stuck</span>
                  <select
                    value={studentProfile.stuckSupport ?? 'different-explanation'}
                    onChange={(event) => updateStudentProfile({
                      stuckSupport: event.target.value as NonNullable<StudentProfile['stuckSupport']>,
                    })}
                  >
                    <option value={'hint'}>Give me a hint</option>
                    <option value={'different-explanation'}>Try a new explanation</option>
                    <option value={'walk-through'}>Walk through it with me</option>
                  </select>
                </label>
              </div>
              <div className={'learner-controls__goals'} aria-label={'Learning goals'}>
                <span>Goals (choose up to two)</span>
                <div>
                  {LEARNING_GOALS.map((goal) => (
                    <button
                      type={'button'}
                      key={goal}
                      aria-pressed={studentProfile.learningGoals?.includes(goal) ?? false}
                      onClick={() => toggleLearningGoal(goal)}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <form
                className={'learner-controls__lens-form'}
                onSubmit={(event) => {
                  event.preventDefault()
                  const interest = interestDraft.trim().replace(/\s+/g, ' ').slice(0, 60)
                  if (!interest) return
                  setInterestDraft(interest)
                  updateStudentProfile({ interest })
                }}
              >
                <label htmlFor={`${headingId}-interest`}>Interest lens</label>
                <div>
                  <input
                    id={`${headingId}-interest`}
                    value={interestDraft}
                    maxLength={60}
                    onChange={(event) => setInterestDraft(event.target.value)}
                  />
                  <button type={'submit'} disabled={!interestDraft.trim()}>Save lens</button>
                </div>
              </form>
            </section>
          )}

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
            {sourceData.length > 0 && onDeleteSourceData && (
              <div className="learner-controls__source-data">
                <h4>Data by source</h4>
                <ul>
                  {sourceData.map((source) => (
                    <li key={source.sourceId}>
                      <div>
                        <strong>{source.sourceTitle}</strong>
                        <span>
                          {source.sourceKind === 'upload' ? 'Uploaded source' : 'Global Lab source'}
                          {' - '}{source.evidenceCount} interaction{source.evidenceCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      {confirmSourceId === source.sourceId ? (
                        <div className="learner-controls__confirm" role="group" aria-label={'Confirm deletion for ' + source.sourceTitle}>
                          <span>Delete this source's learning data?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSourceData(source.sourceId)
                              setConfirmSourceId(null)
                              setStatus(`Deleted saved learning data for ${source.sourceTitle}.`)
                            }}
                          >Yes</button>
                          <button type="button" onClick={() => setConfirmSourceId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmSourceId(source.sourceId)}>
                          <Trash2 size={13} aria-hidden="true" /> Delete source data
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {crossSourcePermissions.length > 0 && onRevokeCrossSourcePermission && (
              <div className="learner-controls__source-data">
                <h4>Allowed source connections</h4>
                <ul>
                  {crossSourcePermissions.map((permission) => (
                    <li key={permission.id}>
                      <div>
                        <strong>
                          {permission.primaryAnchor?.sourceTitle ?? 'Focused source'}
                          {' + '}
                          {permission.secondaryAnchor?.sourceTitle ?? 'Second focused source'}
                        </strong>
                        <span>Only the two approved extracts may be compared.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onRevokeCrossSourcePermission(permission.id)
                          setStatus('Source comparison permission revoked.')
                        }}
                      >Revoke</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                  <span>Delete preferences, evidence, mirror claims, and review history?</span>
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
