export const LEARNER_MODEL_VERSION = 2 as const

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

/** The exact amount of canonical source the student asked the companion to use. */
export type CompanionSourceScope = 'section' | 'selection'

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

export type EvidenceKind =
  | 'refinement'
  | 'helpful'
  | 'quiz'
  | 'tutor-attempt'
  | 'tutor-hint'
  | 'tutor-reveal'
  | 'tutor-transfer'
  | 'teach-koji'
  | 'prediction-cycle'
export type LearningOutcome = 'unknown' | 'successful' | 'needs-review'

export type TutorEvidencePhase =
  | 'diagnose'
  | 'scaffold'
  | 'guided-practice'
  | 'fade-support'
  | 'transfer'
  | 'complete'

export interface TutorEvidence {
  phase: TutorEvidencePhase
  activityKind?:
    | 'multiple-choice'
    | 'short-answer'
    | 'ordering'
    | 'matching'
    | 'hotspot'
    | 'simulation-prediction'
  correct?: boolean
  independent?: boolean
  hintsUsed?: number
  revealed?: boolean
  skillTag?: string
  misconceptionTags?: string[]
  /** Stable session pointers keep claims inspectable without storing a transcript twice. */
  sessionId?: string
  turnId?: string
  responseSummary?: string
  coverage?: 'complete' | 'partial' | 'unsupported'
  sourceQuotes?: string[]
  predictionCycle?: {
    prediction: string
    observation: string
    revision: string
    accurate: boolean
  }
}

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
  tutor?: TutorEvidence
}

export type UnderstandingClaimKind =
  | 'demonstrated'
  | 'fragile'
  | 'misconception'
  | 'missing-reasoning'

export type UnderstandingClaimStatus =
  | 'active'
  | 'confirmed'
  | 'corrected'
  | 'dismissed'

export interface EvidenceCitation {
  evidenceId: string
  anchorKey: string
  anchor: SourceAnchor
  occurredAt: string
  sessionId?: string
  turnId?: string
}

/**
 * A cautious, derived interpretation of raw evidence. It is never an ability,
 * personality, medical, or protected-trait label and always cites its basis.
 */
export interface UnderstandingClaim {
  id: string
  conceptKey: string
  kind: UnderstandingClaimKind
  summary: string
  calibration: 'suggests' | 'may-indicate'
  status: UnderstandingClaimStatus
  evidence: EvidenceCitation[]
  createdAt: string
  updatedAt: string
  correction?: string
}

export type UnderstandingClaimDecisionAction =
  | 'confirm'
  | 'correct'
  | 'dismiss'
  | 'delete'

export interface UnderstandingClaimDecision {
  id: string
  claimId: string
  action: UnderstandingClaimDecisionAction
  decidedAt: string
  correction?: string
}

export interface LearnerInferenceState {
  refreshedAt: string
  claims: UnderstandingClaim[]
}

export interface CrossSourcePermission {
  id: string
  primaryAnchorKey: string
  secondaryAnchorKey: string
  primaryAnchor?: SourceAnchor
  secondaryAnchor?: SourceAnchor
  grantedAt: string
  revokedAt?: string
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
  /** Snapshot of the exact source locations behind the suggestion. */
  evidence?: EvidenceCitation[]
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

export type MasteryMapStatus =
  | 'confident'
  | 'fragile'
  | 'misconception'
  | 'prerequisite'
  | 'unrated'

export interface LivingMasteryNode {
  conceptKey: string
  label: string
  status: MasteryMapStatus
  evidence: EvidenceCitation[]
  sourceAnchors: SourceAnchor[]
  prerequisiteNotes: string[]
  transferAttempts: number
  successfulTransfers: number
  nextReviewAt?: string
  isReviewDue: boolean
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
  /** Raw evidence stays separate from these reproducible, student-editable inferences. */
  inference: LearnerInferenceState
  claimDecisions: UnderstandingClaimDecision[]
  crossSourcePermissions: CrossSourcePermission[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
