import {
  LEARNER_MODEL_VERSION,
  type ApprovedPresentationPreferences,
  type ApprovedPreference,
  type DetailPreference,
  type ExamplePreference,
  type LearnerModelState,
  type LearningEvidence,
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
} from './types'

export const LEARNER_MODEL_STORAGE_KEY = 'gl_learner_model_v1'
export const MAX_EVIDENCE_EVENTS = 200
export const MAX_REVIEW_HISTORY = 500
export const MAX_SUGGESTIONS = 50
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
    (value.kind !== 'refinement' && value.kind !== 'helpful' && value.kind !== 'quiz') ||
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
    !value.reviewHistory.every(isReviewAttempt)
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
  return {
    version: LEARNER_MODEL_VERSION,
    updatedAt: iso(now),
    approvedPresentation: {},
    evidence: [],
    suggestions: [],
    neverSuggest: [],
    mastery: {},
    reviewHistory: [],
  }
}

function capState(state: LearnerModelState): LearnerModelState {
  return {
    ...state,
    evidence: state.evidence.slice(-MAX_EVIDENCE_EVENTS),
    suggestions: state.suggestions.slice(-MAX_SUGGESTIONS),
    reviewHistory: state.reviewHistory.slice(-MAX_REVIEW_HISTORY),
  }
}

export function decodeLearnerModel(serialized: string | null, now: Date): LearnerModelState {
  if (!serialized) return createLearnerModelState(now)
  try {
    const parsed: unknown = JSON.parse(serialized)
    return isLearnerModelState(parsed) ? capState(parsed) : createLearnerModelState(now)
  } catch {
    return createLearnerModelState(now)
  }
}

export function readLearnerModel(storage: StorageLike | null, now: Date): LearnerModelState {
  if (!storage) return createLearnerModelState(now)
  try {
    return decodeLearnerModel(storage.getItem(LEARNER_MODEL_STORAGE_KEY), now)
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
): LearnerModelState {
  let next: LearnerModelState = {
    ...state,
    updatedAt: iso(now),
    evidence: [...state.evidence, evidence].slice(-MAX_EVIDENCE_EVENTS),
  }
  const suggestion = derivePreferenceSuggestion(next, evidence.signal, now)
  if (suggestion) {
    next = {
      ...next,
      suggestions: [...next.suggestions, suggestion].slice(-MAX_SUGGESTIONS),
    }
  }
  return next
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
