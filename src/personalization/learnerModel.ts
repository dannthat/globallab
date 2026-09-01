import {
  LEARNER_MODEL_VERSION,
  type ApprovedPresentationPreferences,
  type ApprovedPreference,
  type CrossSourcePermission,
  type DetailPreference,
  type EvidenceCitation,
  type ExamplePreference,
  type LearnerModelState,
  type LearningEvidence,
  type LivingMasteryNode,
  type MasteryRecord,
  type PersonalizationMode,
  type PracticePreference,
  type PreferenceSignal,
  type PreferenceSuggestion,
  type ReviewAttempt,
  type ReviewRating,
  type SourceAnchor,
  type StorageLike,
  type StructurePreference,
  type TutorEvidence,
  type UnderstandingClaim,
  type UnderstandingClaimDecision,
  type UnderstandingClaimDecisionAction,
  type UnderstandingClaimKind,
} from './types'

export const LEARNER_MODEL_STORAGE_KEY = 'gl_learner_model_v2'
export const LEGACY_LEARNER_MODEL_STORAGE_KEY = 'gl_learner_model_v1'
export const MAX_EVIDENCE_EVENTS = 200
export const MAX_REVIEW_HISTORY = 500
export const MAX_SUGGESTIONS = 50
export const MAX_CLAIM_DECISIONS = 200
export const MAX_CROSS_SOURCE_PERMISSIONS = 100
export const MIN_PROPOSAL_SIGNALS = 3
export const MIN_PROPOSAL_ANCHORS = 2
export const MIN_PROPOSAL_SUCCESSFUL_OUTCOMES = 1
export const NOT_NOW_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function iso(now: Date): string {
  if (!Number.isFinite(now.getTime())) throw new Error('A valid date is required.')
  return now.toISOString()
}

function isSourceAnchor(value: unknown): value is SourceAnchor {
  if (!isRecord(value)) return false
  if (
    !isNonEmptyString(value.sourceId) ||
    (value.sourceKind !== 'global-lab' && value.sourceKind !== 'upload') ||
    !isNonEmptyString(value.sourceTitle) ||
    !isNonEmptyString(value.anchorId) ||
    !isNonEmptyString(value.anchorLabel) ||
    !isOptionalString(value.url) ||
    !isOptionalString(value.license) ||
    !isOptionalString(value.sourceFingerprint) ||
    !isOptionalString(value.sourceRevision)
  ) {
    return false
  }
  if (
    value.page !== undefined &&
    (typeof value.page !== 'number' || !Number.isInteger(value.page) || value.page < 1)
  ) {
    return false
  }
  if (value.lineRange !== undefined) {
    if (!isRecord(value.lineRange)) return false
    const { start, end } = value.lineRange
    if (
      typeof start !== 'number' ||
      typeof end !== 'number' ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start
    ) {
      return false
    }
  }
  return true
}

const DETAIL_VALUES = new Set<DetailPreference>(['simpler', 'balanced', 'detailed'])
const STRUCTURE_VALUES = new Set<StructurePreference>(['narrative', 'steps'])
const EXAMPLE_VALUES = new Set<ExamplePreference>(['minimal', 'more-examples'])
const PRACTICE_VALUES = new Set<PracticePreference>(['explanation', 'quiz'])

function isPreferenceSignal(value: unknown): value is PreferenceSignal {
  if (!isRecord(value) || typeof value.value !== 'string') return false
  if (value.dimension === 'detail') {
    return DETAIL_VALUES.has(value.value as DetailPreference)
  }
  if (value.dimension === 'structure') {
    return STRUCTURE_VALUES.has(value.value as StructurePreference)
  }
  if (value.dimension === 'examples') {
    return EXAMPLE_VALUES.has(value.value as ExamplePreference)
  }
  if (value.dimension === 'practice') {
    return PRACTICE_VALUES.has(value.value as PracticePreference)
  }
  return false
}

function isApprovedPreference(
  value: unknown,
  validValues: ReadonlySet<string>,
): value is ApprovedPreference<string> {
  return (
    isRecord(value) &&
    typeof value.value === 'string' &&
    validValues.has(value.value) &&
    (value.origin === 'explicit' || value.origin === 'inferred') &&
    isTimestamp(value.approvedAt) &&
    isOptionalString(value.proposalId) &&
    (value.origin !== 'inferred' || isNonEmptyString(value.proposalId))
  )
}

function isApprovedPresentation(value: unknown): value is ApprovedPresentationPreferences {
  if (!isRecord(value)) return false
  return (
    (value.detail === undefined || isApprovedPreference(value.detail, DETAIL_VALUES)) &&
    (value.structure === undefined || isApprovedPreference(value.structure, STRUCTURE_VALUES)) &&
    (value.examples === undefined || isApprovedPreference(value.examples, EXAMPLE_VALUES)) &&
    (value.practice === undefined || isApprovedPreference(value.practice, PRACTICE_VALUES))
  )
}

function isPersonalizationMode(value: unknown): value is PersonalizationMode {
  return (
    value === 'analogy' ||
    value === 'simpler' ||
    value === 'more-detailed' ||
    value === 'step-by-step' ||
    value === 'another-example' ||
    value === 'test-me'
  )
}

function isLearningEvidence(value: unknown): value is LearningEvidence {
  if (!isRecord(value)) return false
  if (
    !isNonEmptyString(value.id) ||
    (value.kind !== 'refinement' &&
      value.kind !== 'helpful' &&
      value.kind !== 'quiz' &&
      value.kind !== 'tutor-attempt' &&
      value.kind !== 'tutor-hint' &&
      value.kind !== 'tutor-reveal' &&
      value.kind !== 'tutor-transfer' &&
      value.kind !== 'teach-koji' &&
      value.kind !== 'prediction-cycle') ||
    !isNonEmptyString(value.anchorKey) ||
    !isSourceAnchor(value.anchor) ||
    !isPreferenceSignal(value.signal) ||
    (value.outcome !== 'unknown' &&
      value.outcome !== 'successful' &&
      value.outcome !== 'needs-review') ||
    !isTimestamp(value.occurredAt) ||
    (value.refinement !== undefined && !isPersonalizationMode(value.refinement)) ||
    (value.helpful !== undefined && typeof value.helpful !== 'boolean')
  ) {
    return false
  }
  if (value.quiz !== undefined) {
    if (!isRecord(value.quiz)) return false
    const { score, total, ratio } = value.quiz
    if (
      !isFiniteNumber(score) ||
      !isFiniteNumber(total) ||
      !isFiniteNumber(ratio) ||
      total <= 0 ||
      score < 0 ||
      score > total ||
      ratio < 0 ||
      ratio > 1
    ) {
      return false
    }
  }
  if (value.tutor !== undefined) {
    if (!isRecord(value.tutor)) return false
    const phases = new Set([
      'diagnose',
      'scaffold',
      'guided-practice',
      'fade-support',
      'transfer',
      'complete',
    ])
    if (!phases.has(String(value.tutor.phase))) return false
    const activityKinds = new Set([
      'multiple-choice',
      'short-answer',
      'ordering',
      'matching',
      'hotspot',
      'simulation-prediction',
    ])
    if (
      value.tutor.activityKind !== undefined &&
      !activityKinds.has(String(value.tutor.activityKind))
    ) return false
    if (
      value.tutor.correct !== undefined &&
      typeof value.tutor.correct !== 'boolean'
    ) return false
    if (
      value.tutor.independent !== undefined &&
      typeof value.tutor.independent !== 'boolean'
    ) return false
    if (
      value.tutor.revealed !== undefined &&
      typeof value.tutor.revealed !== 'boolean'
    ) return false
    if (
      value.tutor.hintsUsed !== undefined &&
      (!Number.isInteger(value.tutor.hintsUsed) || Number(value.tutor.hintsUsed) < 0)
    ) return false
    if (
      value.tutor.skillTag !== undefined &&
      typeof value.tutor.skillTag !== 'string'
    ) return false
    if (
      value.tutor.misconceptionTags !== undefined &&
      (!Array.isArray(value.tutor.misconceptionTags) ||
        !value.tutor.misconceptionTags.every((tag) => typeof tag === 'string'))
    ) return false
    if (!isOptionalString(value.tutor.sessionId)) return false
    if (!isOptionalString(value.tutor.turnId)) return false
    if (!isOptionalString(value.tutor.responseSummary)) return false
    if (
      value.tutor.coverage !== undefined &&
      value.tutor.coverage !== 'complete' &&
      value.tutor.coverage !== 'partial' &&
      value.tutor.coverage !== 'unsupported'
    ) return false
    if (
      value.tutor.sourceQuotes !== undefined &&
      (!Array.isArray(value.tutor.sourceQuotes) ||
        !value.tutor.sourceQuotes.every((quote) => typeof quote === 'string'))
    ) return false
    if (value.tutor.predictionCycle !== undefined) {
      const cycle = value.tutor.predictionCycle
      if (
        !isRecord(cycle) ||
        !isNonEmptyString(cycle.prediction) ||
        !isNonEmptyString(cycle.observation) ||
        !isNonEmptyString(cycle.revision) ||
        typeof cycle.accurate !== 'boolean'
      ) return false
    }
  }
  return true
}

function isPreferenceSuggestion(value: unknown): value is PreferenceSuggestion {
  if (!isRecord(value)) return false
  return (
    isNonEmptyString(value.id) &&
    isPreferenceSignal(value.signal) &&
    isNonEmptyString(value.reason) &&
    isNonEmptyString(value.proposedValueLabel) &&
    typeof value.evidenceCount === 'number' &&
    Number.isInteger(value.evidenceCount) &&
    value.evidenceCount >= MIN_PROPOSAL_SIGNALS &&
    typeof value.distinctAnchorCount === 'number' &&
    Number.isInteger(value.distinctAnchorCount) &&
    value.distinctAnchorCount >= MIN_PROPOSAL_ANCHORS &&
    typeof value.successfulOutcomeCount === 'number' &&
    Number.isInteger(value.successfulOutcomeCount) &&
    value.successfulOutcomeCount >= MIN_PROPOSAL_SUCCESSFUL_OUTCOMES &&
    Array.isArray(value.evidenceIds) &&
    value.evidenceIds.every(isNonEmptyString) &&
    (value.evidence === undefined ||
      (Array.isArray(value.evidence) && value.evidence.every(isEvidenceCitation))) &&
    (value.status === 'pending' ||
      value.status === 'accepted' ||
      value.status === 'not-now' ||
      value.status === 'never-suggest') &&
    isTimestamp(value.createdAt) &&
    (value.decidedAt === undefined || isTimestamp(value.decidedAt)) &&
    (value.snoozedUntil === undefined || isTimestamp(value.snoozedUntil))
  )
}

function isReviewRating(value: unknown): value is ReviewRating {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0 && value <= 5
}

function isMasteryRecord(value: unknown): value is MasteryRecord {
  if (!isRecord(value)) return false
  return (
    isNonEmptyString(value.anchorKey) &&
    isSourceAnchor(value.anchor) &&
    typeof value.repetitions === 'number' &&
    Number.isInteger(value.repetitions) &&
    value.repetitions >= 0 &&
    typeof value.successfulReviews === 'number' &&
    Number.isInteger(value.successfulReviews) &&
    value.successfulReviews >= 0 &&
    typeof value.lapses === 'number' &&
    Number.isInteger(value.lapses) &&
    value.lapses >= 0 &&
    isFiniteNumber(value.easeFactor) &&
    value.easeFactor >= 1.3 &&
    isFiniteNumber(value.intervalDays) &&
    value.intervalDays > 0 &&
    isReviewRating(value.lastRating) &&
    isTimestamp(value.lastReviewedAt) &&
    isTimestamp(value.nextReviewAt)
  )
}

function isReviewAttempt(value: unknown): value is ReviewAttempt {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.anchorKey) &&
    isReviewRating(value.rating) &&
    isTimestamp(value.reviewedAt) &&
    isTimestamp(value.nextReviewAt)
  )
}

const UNDERSTANDING_KINDS = new Set<UnderstandingClaimKind>([
  'demonstrated',
  'fragile',
  'misconception',
  'missing-reasoning',
])

function isEvidenceCitation(value: unknown): value is EvidenceCitation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.evidenceId) &&
    isNonEmptyString(value.anchorKey) &&
    isSourceAnchor(value.anchor) &&
    isTimestamp(value.occurredAt) &&
    isOptionalString(value.sessionId) &&
    isOptionalString(value.turnId)
  )
}

function isUnderstandingClaim(value: unknown): value is UnderstandingClaim {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.conceptKey) &&
    typeof value.kind === 'string' &&
    UNDERSTANDING_KINDS.has(value.kind as UnderstandingClaimKind) &&
    isNonEmptyString(value.summary) &&
    (value.calibration === 'suggests' || value.calibration === 'may-indicate') &&
    (value.status === 'active' ||
      value.status === 'confirmed' ||
      value.status === 'corrected' ||
      value.status === 'dismissed') &&
    Array.isArray(value.evidence) &&
    value.evidence.length > 0 &&
    value.evidence.every(isEvidenceCitation) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt) &&
    isOptionalString(value.correction)
  )
}

function isClaimDecision(value: unknown): value is UnderstandingClaimDecision {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.claimId) &&
    (value.action === 'confirm' ||
      value.action === 'correct' ||
      value.action === 'dismiss' ||
      value.action === 'delete') &&
    isTimestamp(value.decidedAt) &&
    isOptionalString(value.correction) &&
    (value.action !== 'correct' || isNonEmptyString(value.correction))
  )
}

function isCrossSourcePermission(value: unknown): value is CrossSourcePermission {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.primaryAnchorKey) &&
    isNonEmptyString(value.secondaryAnchorKey) &&
    value.primaryAnchorKey !== value.secondaryAnchorKey &&
    (value.primaryAnchor === undefined || isSourceAnchor(value.primaryAnchor)) &&
    (value.secondaryAnchor === undefined || isSourceAnchor(value.secondaryAnchor)) &&
    isTimestamp(value.grantedAt) &&
    (value.revokedAt === undefined || isTimestamp(value.revokedAt))
  )
}

export function isLearnerModelState(value: unknown): value is LearnerModelState {
  if (!isRecord(value) || value.version !== LEARNER_MODEL_VERSION) return false
  if (
    !isTimestamp(value.updatedAt) ||
    !isApprovedPresentation(value.approvedPresentation) ||
    !Array.isArray(value.evidence) ||
    !value.evidence.every(isLearningEvidence) ||
    !Array.isArray(value.suggestions) ||
    !value.suggestions.every(isPreferenceSuggestion) ||
    !Array.isArray(value.neverSuggest) ||
    !value.neverSuggest.every(isNonEmptyString) ||
    !isRecord(value.mastery) ||
    !Object.values(value.mastery).every(isMasteryRecord) ||
    !Array.isArray(value.reviewHistory) ||
    !value.reviewHistory.every(isReviewAttempt) ||
    !isRecord(value.inference) ||
    !isTimestamp(value.inference.refreshedAt) ||
    !Array.isArray(value.inference.claims) ||
    !value.inference.claims.every(isUnderstandingClaim) ||
    !Array.isArray(value.claimDecisions) ||
    !value.claimDecisions.every(isClaimDecision) ||
    !Array.isArray(value.crossSourcePermissions) ||
    !value.crossSourcePermissions.every(isCrossSourcePermission)
  ) {
    return false
  }
  const candidate = value as unknown as LearnerModelState
  const inferredPreferences = Object.entries(candidate.approvedPresentation).filter(
    ([, preference]) => preference?.origin === 'inferred',
  )
  const inferredPreferencesAreApproved = inferredPreferences.every(
    ([dimension, preference]) =>
      Boolean(
        preference?.proposalId &&
        candidate.suggestions.some(
          (suggestion) =>
            suggestion.id === preference.proposalId &&
            suggestion.status === 'accepted' &&
            suggestion.signal.dimension === dimension &&
            suggestion.signal.value === preference.value,
        ),
      ),
  )
  if (!inferredPreferencesAreApproved) return false

  const mastery = value.mastery as Record<string, MasteryRecord>
  return Object.entries(mastery).every(([key, record]) => key === record.anchorKey)
}

export function createLearnerModelState(now: Date): LearnerModelState {
  const createdAt = iso(now)
  return {
    version: LEARNER_MODEL_VERSION,
    updatedAt: createdAt,
    approvedPresentation: {},
    evidence: [],
    suggestions: [],
    neverSuggest: [],
    mastery: {},
    reviewHistory: [],
    inference: {
      refreshedAt: createdAt,
      claims: [],
    },
    claimDecisions: [],
    crossSourcePermissions: [],
  }
}

function capState(state: LearnerModelState): LearnerModelState {
  return {
    ...state,
    evidence: state.evidence.slice(-MAX_EVIDENCE_EVENTS),
    suggestions: state.suggestions.slice(-MAX_SUGGESTIONS),
    reviewHistory: state.reviewHistory.slice(-MAX_REVIEW_HISTORY),
    claimDecisions: state.claimDecisions.slice(-MAX_CLAIM_DECISIONS),
    crossSourcePermissions: state.crossSourcePermissions.slice(
      -MAX_CROSS_SOURCE_PERMISSIONS,
    ),
  }
}

function isLegacyLearnerModelState(value: unknown): value is Omit<
  LearnerModelState,
  'version' | 'inference' | 'claimDecisions' | 'crossSourcePermissions'
> & { version: 1 } {
  if (!isRecord(value) || value.version !== 1) return false
  return (
    isTimestamp(value.updatedAt) &&
    isApprovedPresentation(value.approvedPresentation) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isLearningEvidence) &&
    Array.isArray(value.suggestions) &&
    value.suggestions.every(isPreferenceSuggestion) &&
    Array.isArray(value.neverSuggest) &&
    value.neverSuggest.every(isNonEmptyString) &&
    isRecord(value.mastery) &&
    Object.values(value.mastery).every(isMasteryRecord) &&
    Array.isArray(value.reviewHistory) &&
    value.reviewHistory.every(isReviewAttempt)
  )
}

export function migrateLearnerModelV1(
  legacy: Omit<
    LearnerModelState,
    'version' | 'inference' | 'claimDecisions' | 'crossSourcePermissions'
  > & { version: 1 },
  now: Date,
): LearnerModelState {
  const migrated: LearnerModelState = {
    ...legacy,
    version: LEARNER_MODEL_VERSION,
    updatedAt: iso(now),
    inference: {
      refreshedAt: iso(now),
      claims: [],
    },
    claimDecisions: [],
    crossSourcePermissions: [],
  }
  return refreshLearnerInferences(migrated, now)
}

export function decodeLearnerModel(serialized: string | null, now: Date): LearnerModelState {
  if (!serialized) return createLearnerModelState(now)
  try {
    const parsed: unknown = JSON.parse(serialized)
    if (isLearnerModelState(parsed)) return capState(parsed)
    if (isLegacyLearnerModelState(parsed)) {
      return capState(migrateLearnerModelV1(parsed, now))
    }
    return createLearnerModelState(now)
  } catch {
    return createLearnerModelState(now)
  }
}

export function readLearnerModel(storage: StorageLike | null, now: Date): LearnerModelState {
  if (!storage) return createLearnerModelState(now)
  try {
    const current = storage.getItem(LEARNER_MODEL_STORAGE_KEY)
    if (current) return decodeLearnerModel(current, now)
    return decodeLearnerModel(storage.getItem(LEGACY_LEARNER_MODEL_STORAGE_KEY), now)
  } catch {
    return createLearnerModelState(now)
  }
}

export function persistLearnerModel(
  storage: StorageLike | null,
  state: LearnerModelState,
): boolean {
  if (!storage || !isLearnerModelState(state)) return false
  try {
    storage.setItem(LEARNER_MODEL_STORAGE_KEY, JSON.stringify(capState(state)))
    return true
  } catch {
    return false
  }
}

export function exportLearnerModel(state: LearnerModelState): string {
  if (!isLearnerModelState(state)) throw new Error('Learner model state is invalid.')
  return JSON.stringify(capState(state), null, 2)
}

export function resetLearnerModel(
  storage: StorageLike | null,
  now: Date,
): LearnerModelState {
  if (storage) {
    try {
      storage.removeItem(LEARNER_MODEL_STORAGE_KEY)
      storage.removeItem(LEGACY_LEARNER_MODEL_STORAGE_KEY)
    } catch {
      // In-memory reset still succeeds if storage is unavailable.
    }
  }
  return createLearnerModelState(now)
}

export function sourceAnchorKey(anchor: SourceAnchor): string {
  const stableVersion = [anchor.sourceFingerprint, anchor.sourceRevision]
    .filter(Boolean)
    .join('@') || 'unversioned'
  return [anchor.sourceKind, anchor.sourceId, stableVersion, anchor.anchorId]
    .map((part) => encodeURIComponent(part))
    .join('::')
}

function normalizedConcept(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'source-understanding'
}

function evidenceConcept(event: LearningEvidence) {
  return normalizedConcept(
    event.tutor?.skillTag?.trim() || event.anchor.anchorLabel,
  )
}

function conceptLabel(event: LearningEvidence) {
  const skill = event.tutor?.skillTag?.trim()
  return (skill || event.anchor.anchorLabel)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function evidenceCitation(event: LearningEvidence): EvidenceCitation {
  return {
    evidenceId: event.id,
    anchorKey: event.anchorKey,
    anchor: event.anchor,
    occurredAt: event.occurredAt,
    sessionId: event.tutor?.sessionId,
    turnId: event.tutor?.turnId,
  }
}

function latestClaimDecision(
  decisions: UnderstandingClaimDecision[],
  claimId: string,
) {
  return [...decisions]
    .filter((decision) => decision.claimId === claimId)
    .sort((left, right) => Date.parse(right.decidedAt) - Date.parse(left.decidedAt))[0]
}

function withClaimDecision(
  claim: UnderstandingClaim,
  decisions: UnderstandingClaimDecision[],
): UnderstandingClaim | null {
  const decision = latestClaimDecision(decisions, claim.id)
  if (!decision) return claim
  if (decision.action === 'delete') return null
  if (decision.action === 'dismiss') return { ...claim, status: 'dismissed' }
  if (decision.action === 'confirm') return { ...claim, status: 'confirmed' }
  return {
    ...claim,
    status: 'corrected',
    correction: decision.correction,
  }
}

function buildClaim(
  kind: UnderstandingClaimKind,
  conceptKey: string,
  summary: string,
  events: LearningEvidence[],
  decisions: UnderstandingClaimDecision[],
): UnderstandingClaim | null {
  if (events.length === 0) return null
  const ordered = [...events].sort(
    (left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt),
  )
  const citations = ordered
    .filter(
      (event, index, all) =>
        all.findIndex((candidate) => candidate.id === event.id) === index,
    )
    .slice(-8)
    .map(evidenceCitation)
  const claim: UnderstandingClaim = {
    id: `understanding:${kind}:${conceptKey}`,
    conceptKey,
    kind,
    summary,
    calibration: kind === 'demonstrated' ? 'suggests' : 'may-indicate',
    status: 'active',
    evidence: citations,
    createdAt: ordered[0].occurredAt,
    updatedAt: ordered[ordered.length - 1].occurredAt,
  }
  return withClaimDecision(claim, decisions)
}

/**
 * Rebuilds cautious learner-facing claims from raw attempts. Provider prose is
 * never accepted as a permanent label; only validated activity telemetry is used.
 */
export function deriveUnderstandingClaims(
  state: LearnerModelState,
): UnderstandingClaim[] {
  const assessable = state.evidence.filter(
    (event) => event.kind === 'quiz' || Boolean(event.tutor),
  )
  const grouped = new Map<string, LearningEvidence[]>()
  assessable.forEach((event) => {
    const key = evidenceConcept(event)
    grouped.set(key, [...(grouped.get(key) ?? []), event])
  })

  const claims: UnderstandingClaim[] = []
  grouped.forEach((events, conceptKey) => {
    const ordered = [...events].sort(
      (left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt),
    )
    const label = conceptLabel(ordered[ordered.length - 1])
    const independentSuccess = ordered.filter(
      (event) =>
        (event.tutor?.correct === true &&
          event.tutor.independent === true &&
          !event.tutor.revealed &&
          (event.tutor.hintsUsed ?? 0) === 0) ||
        (event.quiz?.ratio ?? 0) >= 0.8 ||
        event.tutor?.predictionCycle?.accurate === true,
    )
    const needsSupport = ordered.filter(
      (event) =>
        event.outcome === 'needs-review' ||
        event.tutor?.revealed === true ||
        (event.tutor?.hintsUsed ?? 0) > 0 ||
        event.tutor?.coverage === 'partial' ||
        event.tutor?.coverage === 'unsupported',
    )
    const latestIndependent = independentSuccess.at(-1)
    const latestSupport = needsSupport.at(-1)
    const supportStillCurrent =
      Boolean(latestSupport) &&
      (!latestIndependent ||
        Date.parse(latestSupport!.occurredAt) > Date.parse(latestIndependent.occurredAt))

    if (independentSuccess.length > 0 && !supportStillCurrent) {
      const claim = buildClaim(
        'demonstrated',
        conceptKey,
        `Evidence suggests you can use ${label} independently in a check or transfer.`,
        independentSuccess,
        state.claimDecisions,
      )
      if (claim) claims.push(claim)
    }

    if (needsSupport.length > 0 && supportStillCurrent) {
      const claim = buildClaim(
        'fragile',
        conceptKey,
        `Your recent work may indicate that ${label} needs another source-grounded check.`,
        needsSupport,
        state.claimDecisions,
      )
      if (claim) claims.push(claim)
    }

    const missingReasoning = ordered.filter(
      (event) =>
        event.tutor?.revealed === true ||
        event.tutor?.coverage === 'partial' ||
        event.tutor?.coverage === 'unsupported',
    )
    if (missingReasoning.length > 0 && supportStillCurrent) {
      const claim = buildClaim(
        'missing-reasoning',
        conceptKey,
        `A recent explanation may be missing a reasoning step for ${label}; the cited source is the place to verify it.`,
        missingReasoning,
        state.claimDecisions,
      )
      if (claim) claims.push(claim)
    }

    const misconceptionEvents = new Map<string, LearningEvidence[]>()
    ordered.forEach((event) => {
      if (event.outcome !== 'needs-review' && event.tutor?.correct !== false) return
      event.tutor?.misconceptionTags?.forEach((tag) => {
        const key = normalizedConcept(tag)
        misconceptionEvents.set(key, [
          ...(misconceptionEvents.get(key) ?? []),
          event,
        ])
      })
    })
    misconceptionEvents.forEach((tagEvents, tag) => {
      const lastTagEvent = tagEvents.at(-1)
      if (
        lastTagEvent &&
        latestIndependent &&
        Date.parse(latestIndependent.occurredAt) > Date.parse(lastTagEvent.occurredAt)
      ) return
      const tagLabel = tag.replace(/-/g, ' ')
      const claim = buildClaim(
        'misconception',
        `${conceptKey}:${tag}`,
        `One response may reflect a ${tagLabel} mix-up. This is a hypothesis to inspect, not a fact about you.`,
        tagEvents,
        state.claimDecisions,
      )
      if (claim) claims.push(claim)
    })
  })

  return claims.sort((left, right) => {
    const priority: Record<UnderstandingClaimKind, number> = {
      misconception: 0,
      'missing-reasoning': 1,
      fragile: 2,
      demonstrated: 3,
    }
    return priority[left.kind] - priority[right.kind] ||
      Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  })
}

export function refreshLearnerInferences(
  state: LearnerModelState,
  now: Date,
): LearnerModelState {
  const refreshedAt = iso(now)
  const next = {
    ...state,
    inference: {
      refreshedAt,
      claims: [] as UnderstandingClaim[],
    },
  }
  return {
    ...next,
    inference: {
      refreshedAt,
      claims: deriveUnderstandingClaims(next),
    },
  }
}

export function preferenceSignalKey(signal: PreferenceSignal): string {
  return `${signal.dimension}:${signal.value}`
}

export function signalForMode(mode: PersonalizationMode): PreferenceSignal {
  if (mode === 'simpler') return { dimension: 'detail', value: 'simpler' }
  if (mode === 'more-detailed') return { dimension: 'detail', value: 'detailed' }
  if (mode === 'step-by-step') return { dimension: 'structure', value: 'steps' }
  if (mode === 'test-me') return { dimension: 'practice', value: 'quiz' }
  if (mode === 'another-example') {
    return { dimension: 'examples', value: 'more-examples' }
  }
  // A successful analogy is evidence for explanation-based support, not a
  // request for additional examples. The interest itself is already explicit.
  return { dimension: 'practice', value: 'explanation' }
}

function labelForSignal(signal: PreferenceSignal): string {
  if (signal.dimension === 'detail' && signal.value === 'simpler') {
    return 'shorter, simpler explanations'
  }
  if (signal.dimension === 'detail' && signal.value === 'detailed') {
    return 'more detailed explanations'
  }
  if (signal.dimension === 'structure' && signal.value === 'steps') {
    return 'step-by-step explanations'
  }
  if (signal.dimension === 'structure' && signal.value === 'narrative') {
    return 'paragraph explanations'
  }
  if (signal.dimension === 'examples' && signal.value === 'more-examples') {
    return 'more examples'
  }
  if (signal.dimension === 'examples' && signal.value === 'minimal') {
    return 'fewer examples'
  }
  if (signal.dimension === 'practice' && signal.value === 'quiz') {
    return 'a quick check after explanations'
  }
  if (signal.dimension === 'practice' && signal.value === 'explanation') {
    return 'explanations without an automatic check'
  }
  return 'balanced explanations'
}

export function proposalReason(
  signal: PreferenceSignal,
  distinctAnchorCount: number,
  successfulOutcomeCount: number,
): string {
  const outcomeCopy = successfulOutcomeCount === 1
    ? 'one learning check went well'
    : `${successfulOutcomeCount} learning checks went well`
  return (
    `You chose ${labelForSignal(signal)} across ${distinctAnchorCount} different sections, ` +
    `and ${outcomeCopy}. Would you like to use this format for future help?`
  )
}

function approvedForDimension(
  approved: ApprovedPresentationPreferences,
  signal: PreferenceSignal,
): ApprovedPreference<string> | undefined {
  if (signal.dimension === 'detail') return approved.detail
  if (signal.dimension === 'structure') return approved.structure
  if (signal.dimension === 'examples') return approved.examples
  return approved.practice
}

function applyApprovedPreference(
  approved: ApprovedPresentationPreferences,
  signal: PreferenceSignal,
  preference: ApprovedPreference<string>,
): ApprovedPresentationPreferences {
  if (signal.dimension === 'detail') {
    return { ...approved, detail: preference as ApprovedPreference<DetailPreference> }
  }
  if (signal.dimension === 'structure') {
    return { ...approved, structure: preference as ApprovedPreference<StructurePreference> }
  }
  if (signal.dimension === 'examples') {
    return { ...approved, examples: preference as ApprovedPreference<ExamplePreference> }
  }
  return { ...approved, practice: preference as ApprovedPreference<PracticePreference> }
}

export function derivePreferenceSuggestion(
  state: LearnerModelState,
  signal: PreferenceSignal,
  now: Date,
): PreferenceSuggestion | null {
  const key = preferenceSignalKey(signal)
  if (state.neverSuggest.includes(key)) return null

  const approved = approvedForDimension(state.approvedPresentation, signal)
  if (approved?.origin === 'explicit' || approved?.value === signal.value) return null

  const matching = state.evidence.filter(
    (event) => preferenceSignalKey(event.signal) === key,
  )
  const distinctAnchors = new Set(matching.map((event) => event.anchorKey))
  const successfulOutcomes = matching.filter(
    (event) => event.outcome === 'successful',
  ).length

  if (
    matching.length < MIN_PROPOSAL_SIGNALS ||
    distinctAnchors.size < MIN_PROPOSAL_ANCHORS ||
    successfulOutcomes < MIN_PROPOSAL_SUCCESSFUL_OUTCOMES
  ) {
    return null
  }

  const previous = [...state.suggestions]
    .reverse()
    .find((suggestion) => preferenceSignalKey(suggestion.signal) === key)
  if (previous?.status === 'pending' || previous?.status === 'never-suggest') return null
  if (previous?.status === 'accepted' && approved?.value === signal.value) return null
  if (previous?.status === 'not-now') {
    if (previous.snoozedUntil && Date.parse(previous.snoozedUntil) > now.getTime()) {
      return null
    }
    if (matching.length < previous.evidenceCount + 2) return null
  }

  const createdAt = iso(now)
  return {
    id: `${key}:${createdAt}:${matching.length}`,
    signal,
    reason: proposalReason(signal, distinctAnchors.size, successfulOutcomes),
    proposedValueLabel: labelForSignal(signal),
    evidenceCount: matching.length,
    distinctAnchorCount: distinctAnchors.size,
    successfulOutcomeCount: successfulOutcomes,
    evidenceIds: matching.map((event) => event.id),
    evidence: matching.slice(-12).map(evidenceCitation),
    status: 'pending',
    createdAt,
  }
}

function nextEventId(
  state: LearnerModelState,
  kind: LearningEvidence['kind'],
  occurredAt: string,
): string {
  const prefix = `${kind}:${occurredAt}:`
  let ordinal = 1
  while (state.evidence.some((event) => event.id === `${prefix}${ordinal}`)) ordinal += 1
  return `${prefix}${ordinal}`
}

function appendEvidence(
  state: LearnerModelState,
  evidence: LearningEvidence,
  now: Date,
  deriveSuggestion = true,
): LearnerModelState {
  let next: LearnerModelState = {
    ...state,
    updatedAt: iso(now),
    evidence: [...state.evidence, evidence].slice(-MAX_EVIDENCE_EVENTS),
  }
  const suggestion = deriveSuggestion
    ? derivePreferenceSuggestion(next, evidence.signal, now)
    : null
  if (suggestion) {
    next = {
      ...next,
      suggestions: [...next.suggestions, suggestion].slice(-MAX_SUGGESTIONS),
    }
  }
  return refreshLearnerInferences(next, now)
}

export function recordTutorEvidence(
  state: LearnerModelState,
  anchor: SourceAnchor,
  mode: PersonalizationMode,
  kind: Extract<
    LearningEvidence['kind'],
    | 'tutor-attempt'
    | 'tutor-hint'
    | 'tutor-reveal'
    | 'tutor-transfer'
    | 'teach-koji'
    | 'prediction-cycle'
  >,
  tutor: TutorEvidence,
  now: Date,
): LearnerModelState {
  const occurredAt = iso(now)
  const correct = tutor.correct
  const withEvidence = appendEvidence(
    state,
    {
      id: nextEventId(state, kind, occurredAt),
      kind,
      anchorKey: sourceAnchorKey(anchor),
      anchor,
      signal: signalForMode(mode),
      outcome:
        correct === undefined
          ? 'unknown'
          : correct
            ? 'successful'
            : 'needs-review',
      occurredAt,
      refinement: mode,
      tutor,
    },
    now,
    false,
  )
  if (
    kind !== 'tutor-transfer' &&
    kind !== 'teach-koji' &&
    kind !== 'prediction-cycle'
  ) return withEvidence
  if (kind === 'teach-koji' && tutor.independent !== true) return withEvidence
  if (correct === undefined) return withEvidence
  return scheduleReview(withEvidence, anchor, correct ? 5 : 2, now)
}

export function recordRefinementEvidence(
  state: LearnerModelState,
  anchor: SourceAnchor,
  mode: PersonalizationMode,
  now: Date,
): LearnerModelState {
  const occurredAt = iso(now)
  return appendEvidence(
    state,
    {
      id: nextEventId(state, 'refinement', occurredAt),
      kind: 'refinement',
      anchorKey: sourceAnchorKey(anchor),
      anchor,
      signal: signalForMode(mode),
      outcome: 'unknown',
      occurredAt,
      refinement: mode,
    },
    now,
  )
}

export function recordHelpfulEvidence(
  state: LearnerModelState,
  anchor: SourceAnchor,
  mode: PersonalizationMode,
  helpful: boolean,
  now: Date,
): LearnerModelState {
  const occurredAt = iso(now)
  return appendEvidence(
    state,
    {
      id: nextEventId(state, 'helpful', occurredAt),
      kind: 'helpful',
      anchorKey: sourceAnchorKey(anchor),
      anchor,
      signal: signalForMode(mode),
      outcome: helpful ? 'successful' : 'needs-review',
      occurredAt,
      refinement: mode,
      helpful,
    },
    now,
  )
}

function quizRating(ratio: number): ReviewRating {
  if (ratio >= 0.9) return 5
  if (ratio >= 0.75) return 4
  if (ratio >= 0.6) return 3
  if (ratio >= 0.4) return 2
  if (ratio > 0) return 1
  return 0
}

export function scheduleReview(
  state: LearnerModelState,
  anchor: SourceAnchor,
  rating: ReviewRating,
  now: Date,
): LearnerModelState {
  const anchorKey = sourceAnchorKey(anchor)
  const previous = state.mastery[anchorKey]
  const success = rating >= 3
  const previousEase = previous?.easeFactor ?? 2.5
  const easeAdjustment = success
    ? 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
    : -0.2
  const easeFactor = Math.max(1.3, Number((previousEase + easeAdjustment).toFixed(2)))
  const repetitions = success ? (previous?.repetitions ?? 0) + 1 : 0
  const intervalDays = !success
    ? 1
    : repetitions === 1
      ? 1
      : repetitions === 2
        ? 3
        : Math.max(4, Math.round((previous?.intervalDays ?? 3) * previousEase))
  const reviewedAt = iso(now)
  const nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString()
  const mastery: MasteryRecord = {
    anchorKey,
    anchor,
    repetitions,
    successfulReviews: (previous?.successfulReviews ?? 0) + (success ? 1 : 0),
    lapses: (previous?.lapses ?? 0) + (success ? 0 : 1),
    easeFactor,
    intervalDays,
    lastRating: rating,
    lastReviewedAt: reviewedAt,
    nextReviewAt,
  }
  const attempt: ReviewAttempt = {
    id: `review:${anchorKey}:${reviewedAt}:${state.reviewHistory.length + 1}`,
    anchorKey,
    rating,
    reviewedAt,
    nextReviewAt,
  }
  return {
    ...state,
    updatedAt: reviewedAt,
    mastery: { ...state.mastery, [anchorKey]: mastery },
    reviewHistory: [...state.reviewHistory, attempt].slice(-MAX_REVIEW_HISTORY),
  }
}

export function recordQuizEvidence(
  state: LearnerModelState,
  anchor: SourceAnchor,
  score: number,
  total: number,
  now: Date,
  mode: PersonalizationMode = 'test-me',
): LearnerModelState {
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
    throw new Error('Quiz score must be between zero and the quiz total.')
  }
  const ratio = score / total
  const occurredAt = iso(now)
  const withEvidence = appendEvidence(
    state,
    {
      id: nextEventId(state, 'quiz', occurredAt),
      kind: 'quiz',
      anchorKey: sourceAnchorKey(anchor),
      anchor,
      signal: signalForMode(mode),
      outcome: ratio >= 0.7 ? 'successful' : 'needs-review',
      occurredAt,
      refinement: mode,
      quiz: { score, total, ratio },
    },
    now,
  )
  return scheduleReview(withEvidence, anchor, quizRating(ratio), now)
}

export function setExplicitPreference(
  state: LearnerModelState,
  signal: PreferenceSignal,
  now: Date,
): LearnerModelState {
  const approvedAt = iso(now)
  return {
    ...state,
    updatedAt: approvedAt,
    approvedPresentation: applyApprovedPreference(state.approvedPresentation, signal, {
      value: signal.value,
      origin: 'explicit',
      approvedAt,
    }),
  }
}

export function clearPresentationPreference(
  state: LearnerModelState,
  dimension: PreferenceSignal['dimension'],
  now: Date,
): LearnerModelState {
  if (!state.approvedPresentation[dimension]) return state
  const approvedPresentation = { ...state.approvedPresentation }
  delete approvedPresentation[dimension]
  return {
    ...state,
    updatedAt: iso(now),
    approvedPresentation,
  }
}

export function acceptPreferenceSuggestion(
  state: LearnerModelState,
  suggestionId: string,
  now: Date,
): LearnerModelState {
  const suggestion = state.suggestions.find(
    (candidate) => candidate.id === suggestionId && candidate.status === 'pending',
  )
  if (!suggestion) return state

  const approvedAt = iso(now)
  return {
    ...state,
    updatedAt: approvedAt,
    approvedPresentation: applyApprovedPreference(
      state.approvedPresentation,
      suggestion.signal,
      {
        value: suggestion.signal.value,
        origin: 'inferred',
        approvedAt,
        proposalId: suggestion.id,
      },
    ),
    suggestions: state.suggestions.map((candidate) =>
      candidate.id === suggestion.id
        ? { ...candidate, status: 'accepted', decidedAt: approvedAt }
        : candidate,
    ),
  }
}

export function deferPreferenceSuggestion(
  state: LearnerModelState,
  suggestionId: string,
  now: Date,
  days = NOT_NOW_DAYS,
): LearnerModelState {
  const decidedAt = iso(now)
  const snoozeDays = Number.isFinite(days) && days > 0 ? days : NOT_NOW_DAYS
  let changed = false
  const suggestions = state.suggestions.map((suggestion) => {
    if (suggestion.id !== suggestionId || suggestion.status !== 'pending') return suggestion
    changed = true
    return {
      ...suggestion,
      status: 'not-now' as const,
      decidedAt,
      snoozedUntil: new Date(now.getTime() + snoozeDays * DAY_MS).toISOString(),
    }
  })
  return changed ? { ...state, updatedAt: decidedAt, suggestions } : state
}

/** Dismiss is deliberately equivalent to “not now”, not permanent rejection. */
export function dismissPreferenceSuggestion(
  state: LearnerModelState,
  suggestionId: string,
  now: Date,
): LearnerModelState {
  return deferPreferenceSuggestion(state, suggestionId, now)
}

export function neverSuggestPreference(
  state: LearnerModelState,
  suggestionId: string,
  now: Date,
): LearnerModelState {
  const suggestion = state.suggestions.find(
    (candidate) => candidate.id === suggestionId && candidate.status === 'pending',
  )
  if (!suggestion) return state

  const decidedAt = iso(now)
  const key = preferenceSignalKey(suggestion.signal)
  return {
    ...state,
    updatedAt: decidedAt,
    neverSuggest: state.neverSuggest.includes(key)
      ? state.neverSuggest
      : [...state.neverSuggest, key],
    suggestions: state.suggestions.map((candidate) =>
      candidate.id === suggestion.id
        ? { ...candidate, status: 'never-suggest', decidedAt }
        : candidate,
    ),
  }
}

export function allowPreferenceSuggestion(
  state: LearnerModelState,
  signal: PreferenceSignal,
  now: Date,
): LearnerModelState {
  const key = preferenceSignalKey(signal)
  if (!state.neverSuggest.includes(key)) return state
  return {
    ...state,
    updatedAt: iso(now),
    neverSuggest: state.neverSuggest.filter((blocked) => blocked !== key),
  }
}

export function getDueReviews(state: LearnerModelState, now: Date): MasteryRecord[] {
  const nowTime = now.getTime()
  if (!Number.isFinite(nowTime)) return []
  return Object.values(state.mastery)
    .filter((record) => Date.parse(record.nextReviewAt) <= nowTime)
    .sort((left, right) => {
      const dueDifference = Date.parse(left.nextReviewAt) - Date.parse(right.nextReviewAt)
      return dueDifference || left.anchorKey.localeCompare(right.anchorKey)
    })
}

export function decideUnderstandingClaim(
  state: LearnerModelState,
  claimId: string,
  action: UnderstandingClaimDecisionAction,
  now: Date,
  correction?: string,
): LearnerModelState {
  const claim = state.inference.claims.find((candidate) => candidate.id === claimId)
  if (!claim) return state
  const normalizedCorrection = correction?.trim()
  if (action === 'correct' && !normalizedCorrection) {
    throw new Error('A correction must explain what should change.')
  }
  const decidedAt = iso(now)
  const decision: UnderstandingClaimDecision = {
    id: `claim-decision:${claimId}:${decidedAt}:${state.claimDecisions.length + 1}`,
    claimId,
    action,
    decidedAt,
    correction: action === 'correct' ? normalizedCorrection : undefined,
  }
  return refreshLearnerInferences(
    {
      ...state,
      updatedAt: decidedAt,
      claimDecisions: [...state.claimDecisions, decision].slice(
        -MAX_CLAIM_DECISIONS,
      ),
    },
    now,
  )
}

export function deleteLearningEvidence(
  state: LearnerModelState,
  evidenceId: string,
  now: Date,
): LearnerModelState {
  if (!state.evidence.some((event) => event.id === evidenceId)) return state
  return refreshLearnerInferences(
    {
      ...state,
      updatedAt: iso(now),
      evidence: state.evidence.filter((event) => event.id !== evidenceId),
    },
    now,
  )
}

export function deleteSourceLearningData(
  state: LearnerModelState,
  sourceId: string,
  now: Date,
): LearnerModelState {
  const anchorKeys = new Set(
    state.evidence
      .filter((event) => event.anchor.sourceId === sourceId)
      .map((event) => event.anchorKey),
  )
  const mastery = Object.fromEntries(
    Object.entries(state.mastery).filter(
      ([key, record]) =>
        !anchorKeys.has(key) && record.anchor.sourceId !== sourceId,
    ),
  )
  const updatedAt = iso(now)
  return refreshLearnerInferences(
    {
      ...state,
      updatedAt,
      evidence: state.evidence.filter((event) => event.anchor.sourceId !== sourceId),
      mastery,
      reviewHistory: state.reviewHistory.filter(
        (attempt) => !anchorKeys.has(attempt.anchorKey),
      ),
      crossSourcePermissions: state.crossSourcePermissions.filter(
        (permission) =>
          !anchorKeys.has(permission.primaryAnchorKey) &&
          !anchorKeys.has(permission.secondaryAnchorKey) &&
          permission.primaryAnchor?.sourceId !== sourceId &&
          permission.secondaryAnchor?.sourceId !== sourceId,
      ),
    },
    now,
  )
}

function crossSourcePermissionId(primary: SourceAnchor, secondary: SourceAnchor) {
  const keys = [sourceAnchorKey(primary), sourceAnchorKey(secondary)].sort()
  return `cross-source:${keys[0]}::${keys[1]}`
}

export function grantCrossSourcePermission(
  state: LearnerModelState,
  primary: SourceAnchor,
  secondary: SourceAnchor,
  now: Date,
): LearnerModelState {
  const primaryAnchorKey = sourceAnchorKey(primary)
  const secondaryAnchorKey = sourceAnchorKey(secondary)
  if (primaryAnchorKey === secondaryAnchorKey) {
    throw new Error('Cross-source permission requires two different source locations.')
  }
  const id = crossSourcePermissionId(primary, secondary)
  const grantedAt = iso(now)
  const permission: CrossSourcePermission = {
    id,
    primaryAnchorKey,
    secondaryAnchorKey,
    primaryAnchor: primary,
    secondaryAnchor: secondary,
    grantedAt,
  }
  return {
    ...state,
    updatedAt: grantedAt,
    crossSourcePermissions: [
      ...state.crossSourcePermissions.filter((candidate) => candidate.id !== id),
      permission,
    ].slice(-MAX_CROSS_SOURCE_PERMISSIONS),
  }
}

export function revokeCrossSourcePermission(
  state: LearnerModelState,
  permissionId: string,
  now: Date,
): LearnerModelState {
  let changed = false
  const revokedAt = iso(now)
  const crossSourcePermissions = state.crossSourcePermissions.map((permission) => {
    if (permission.id !== permissionId || permission.revokedAt) return permission
    changed = true
    return { ...permission, revokedAt }
  })
  return changed
    ? { ...state, updatedAt: revokedAt, crossSourcePermissions }
    : state
}

export function hasCrossSourcePermission(
  state: LearnerModelState,
  primary: SourceAnchor,
  secondary: SourceAnchor,
): boolean {
  const id = crossSourcePermissionId(primary, secondary)
  return state.crossSourcePermissions.some(
    (permission) => permission.id === id && !permission.revokedAt,
  )
}

export function setCrossSourcePermission(
  state: LearnerModelState,
  primary: SourceAnchor,
  secondary: SourceAnchor,
  allowed: boolean,
  now: Date,
): LearnerModelState {
  if (allowed) return grantCrossSourcePermission(state, primary, secondary, now)
  const id = crossSourcePermissionId(primary, secondary)
  return revokeCrossSourcePermission(state, id, now)
}

function uniqueAnchors(citations: EvidenceCitation[]) {
  const seen = new Set<string>()
  return citations
    .filter((citation) => {
      if (seen.has(citation.anchorKey)) return false
      seen.add(citation.anchorKey)
      return true
    })
    .map((citation) => citation.anchor)
}

export function buildLivingMasteryMap(
  state: LearnerModelState,
  now: Date,
): LivingMasteryNode[] {
  const conceptKeys = new Set<string>()
  state.evidence.forEach((event) => {
    if (event.kind === 'quiz' || event.tutor) conceptKeys.add(evidenceConcept(event))
  })
  state.inference.claims.forEach((claim) => {
    conceptKeys.add(claim.conceptKey.split(':')[0])
  })

  return [...conceptKeys]
    .map((conceptKey): LivingMasteryNode => {
      const events = state.evidence.filter(
        (event) => evidenceConcept(event) === conceptKey,
      )
      const claims = state.inference.claims.filter(
        (claim) =>
          claim.conceptKey === conceptKey ||
          claim.conceptKey.startsWith(`${conceptKey}:`),
      )
      const activeClaims = claims.filter((claim) => claim.status !== 'dismissed')
      const citations = activeClaims.length > 0
        ? activeClaims.flatMap((claim) => claim.evidence)
        : events.slice(-8).map(evidenceCitation)
      const masteryRecords = Object.values(state.mastery).filter((record) =>
        events.some((event) => event.anchorKey === record.anchorKey),
      )
      const nextReviewAt = masteryRecords
        .map((record) => record.nextReviewAt)
        .sort((left, right) => Date.parse(left) - Date.parse(right))[0]
      const transfers = events.filter(
        (event) =>
          event.kind === 'tutor-transfer' ||
          event.kind === 'teach-koji' ||
          event.kind === 'prediction-cycle',
      )
      let status: LivingMasteryNode['status'] = 'unrated'
      if (activeClaims.some((claim) => claim.kind === 'misconception')) {
        status = 'misconception'
      } else if (
        activeClaims.some(
          (claim) => claim.kind === 'fragile' || claim.kind === 'missing-reasoning',
        )
      ) {
        status = 'fragile'
      } else if (activeClaims.some((claim) => claim.kind === 'demonstrated')) {
        status = 'confident'
      } else if (masteryRecords.some((record) => record.lastRating >= 4)) {
        status = 'confident'
      } else if (masteryRecords.length > 0) {
        status = 'prerequisite'
      }
      return {
        conceptKey,
        label: events.length > 0
          ? conceptLabel(events[events.length - 1])
          : conceptKey.replace(/-/g, ' '),
        status,
        evidence: citations
          .filter(
            (citation, index, all) =>
              all.findIndex((candidate) => candidate.evidenceId === citation.evidenceId) === index,
          )
          .slice(-8),
        sourceAnchors: uniqueAnchors(citations),
        prerequisiteNotes: activeClaims
          .filter((claim) => claim.kind === 'missing-reasoning')
          .map((claim) => claim.correction || claim.summary),
        transferAttempts: transfers.length,
        successfulTransfers: transfers.filter(
          (event) =>
            event.tutor?.correct === true ||
            event.tutor?.predictionCycle?.accurate === true,
        ).length,
        nextReviewAt,
        isReviewDue: Boolean(nextReviewAt && Date.parse(nextReviewAt) <= now.getTime()),
      }
    })
    .sort((left, right) => {
      const priority: Record<LivingMasteryNode['status'], number> = {
        misconception: 0,
        fragile: 1,
        prerequisite: 2,
        confident: 3,
        unrated: 4,
      }
      return priority[left.status] - priority[right.status] ||
        left.label.localeCompare(right.label)
    })
}
