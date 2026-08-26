export const LEARNER_MODEL_VERSION = 1 as const

export const PERSONALIZATION_MODES = [
  'analogy',
  'simpler',
  'more-detailed',
  'step-by-step',
  'another-example',
  'test-me',
] as const

export type PersonalizationMode = (typeof PERSONALIZATION_MODES)[number]

export type SourceKind = 'global-lab' | 'upload'

export interface SourceLineRange {
  start: number
  end: number
}

/**
 * A stable pointer into canonical content. The source itself is never changed;
 * companions, evidence, and review memory refer back to this anchor.
 */
export interface SourceAnchor {
  sourceId: string
  sourceKind: SourceKind
  sourceTitle: string
  anchorId: string
  anchorLabel: string
  page?: number
  lineRange?: SourceLineRange
  url?: string
  license?: string
  /** Immutable hash of the uploaded/original source when one is available. */
  sourceFingerprint?: string
  /** Immutable revision identifier supplied by a curated source or adapter. */
  sourceRevision?: string
}

export interface SourceExcerpt {
  anchor: SourceAnchor
  text: string
}

export type DetailPreference = 'simpler' | 'balanced' | 'detailed'
export type StructurePreference = 'narrative' | 'steps'
export type ExamplePreference = 'minimal' | 'more-examples'
export type PracticePreference = 'explanation' | 'quiz'

export type PreferenceSignal =
  | { dimension: 'detail'; value: DetailPreference }
  | { dimension: 'structure'; value: StructurePreference }
  | { dimension: 'examples'; value: ExamplePreference }
  | { dimension: 'practice'; value: PracticePreference }

export type PreferenceOrigin = 'explicit' | 'inferred'

export interface ApprovedPreference<Value extends string> {
  value: Value
  origin: PreferenceOrigin
  approvedAt: string
  proposalId?: string
}

/** User-approved presentation choices only. Mastery is intentionally separate. */
export interface ApprovedPresentationPreferences {
  detail?: ApprovedPreference<DetailPreference>
  structure?: ApprovedPreference<StructurePreference>
  examples?: ApprovedPreference<ExamplePreference>
  practice?: ApprovedPreference<PracticePreference>
}

export type EvidenceKind = 'refinement' | 'helpful' | 'quiz'
export type LearningOutcome = 'unknown' | 'successful' | 'needs-review'

export interface QuizOutcome {
  score: number
  total: number
  ratio: number
}

export interface LearningEvidence {
  id: string
  kind: EvidenceKind
  anchorKey: string
  anchor: SourceAnchor
  signal: PreferenceSignal
  outcome: LearningOutcome
  occurredAt: string
  refinement?: PersonalizationMode
  helpful?: boolean
  quiz?: QuizOutcome
}

export type PreferenceSuggestionStatus =
  | 'pending'
  | 'accepted'
  | 'not-now'
  | 'never-suggest'

export interface PreferenceSuggestion {
  id: string
  signal: PreferenceSignal
  reason: string
  proposedValueLabel: string
  evidenceCount: number
  distinctAnchorCount: number
  successfulOutcomeCount: number
  evidenceIds: string[]
  status: PreferenceSuggestionStatus
  createdAt: string
  decidedAt?: string
  snoozedUntil?: string
}

export type PreferenceProposal = PreferenceSuggestion

export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5

export interface ReviewAttempt {
  id: string
  anchorKey: string
  rating: ReviewRating
  reviewedAt: string
  nextReviewAt: string
}

/** SM-2-lite scheduling state. Kept apart from presentation preferences. */
export interface MasteryRecord {
  anchorKey: string
  anchor: SourceAnchor
  repetitions: number
  successfulReviews: number
  lapses: number
  easeFactor: number
  intervalDays: number
  lastRating: ReviewRating
  lastReviewedAt: string
  nextReviewAt: string
}

export interface LearnerModelState {
  version: typeof LEARNER_MODEL_VERSION
  updatedAt: string
  approvedPresentation: ApprovedPresentationPreferences
  evidence: LearningEvidence[]
  suggestions: PreferenceSuggestion[]
  neverSuggest: string[]
  mastery: Record<string, MasteryRecord>
  reviewHistory: ReviewAttempt[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
