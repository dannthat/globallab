import { useCallback, useMemo, useState } from 'react'
import {
  acceptPreferenceSuggestion,
  buildLivingMasteryMap,
  clearPresentationPreference,
  decideUnderstandingClaim,
  deferPreferenceSuggestion,
  deleteLearningEvidence,
  deleteSourceLearningData,
  dismissPreferenceSuggestion,
  exportLearnerModel,
  getDueReviews,
  grantCrossSourcePermission,
  hasCrossSourcePermission,
  neverSuggestPreference,
  persistLearnerModel,
  readLearnerModel,
  recordHelpfulEvidence,
  recordQuizEvidence,
  recordRefinementEvidence,
  recordTutorEvidence,
  resetLearnerModel,
  revokeCrossSourcePermission,
  scheduleReview,
  setCrossSourcePermission,
  setExplicitPreference,
} from '../personalization/learnerModel'
import type {
  LearnerModelState,
  PersonalizationMode,
  PreferenceSignal,
  ReviewRating,
  SourceAnchor,
  StorageLike,
  TutorEvidence,
  UnderstandingClaimDecisionAction,
} from '../personalization/types'

interface UseLearnerModelOptions {
  storage?: StorageLike | null
  now?: () => Date
}

function systemNow() {
  return new Date()
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function useLearnerModel(options: UseLearnerModelOptions = {}) {
  const storage = options.storage === undefined ? browserStorage() : options.storage
  const now = options.now ?? systemNow
  const [state, setState] = useState<LearnerModelState>(() =>
    readLearnerModel(storage, now()),
  )

  const update = useCallback(
    (updater: (current: LearnerModelState) => LearnerModelState) => {
      setState((current) => {
        const next = updater(current)
        if (next !== current) persistLearnerModel(storage, next)
        return next
      })
    },
    [storage],
  )

  const recordRefinement = useCallback(
    (anchor: SourceAnchor, mode: PersonalizationMode) => {
      update((current) => recordRefinementEvidence(current, anchor, mode, now()))
    },
    [now, update],
  )

  const recordHelpful = useCallback(
    (anchor: SourceAnchor, mode: PersonalizationMode, helpful: boolean) => {
      update((current) => recordHelpfulEvidence(current, anchor, mode, helpful, now()))
    },
    [now, update],
  )

  const recordQuiz = useCallback(
    (
      anchor: SourceAnchor,
      score: number,
      total: number,
      mode: PersonalizationMode = 'test-me',
    ) => {
      update((current) => recordQuizEvidence(current, anchor, score, total, now(), mode))
    },
    [now, update],
  )

  const recordReview = useCallback(
    (anchor: SourceAnchor, rating: ReviewRating) => {
      update((current) => scheduleReview(current, anchor, rating, now()))
    },
    [now, update],
  )

  const recordTutorAttempt = useCallback(
    (
      anchor: SourceAnchor,
      mode: PersonalizationMode,
      tutor: TutorEvidence,
    ) => {
      const kind = tutor.phase === 'transfer' ? 'tutor-transfer' : 'tutor-attempt'
      update((current) =>
        recordTutorEvidence(current, anchor, mode, kind, tutor, now()),
      )
    },
    [now, update],
  )

  const recordTutorHint = useCallback(
    (
      anchor: SourceAnchor,
      mode: PersonalizationMode,
      tutor: TutorEvidence,
      revealed = false,
    ) => {
      update((current) =>
        recordTutorEvidence(
          current,
          anchor,
          mode,
          revealed ? 'tutor-reveal' : 'tutor-hint',
          tutor,
          now(),
        ),
      )
    },
    [now, update],
  )

  const recordTeachKoji = useCallback(
    (anchor: SourceAnchor, mode: PersonalizationMode, tutor: TutorEvidence) => {
      update((current) =>
        recordTutorEvidence(current, anchor, mode, 'teach-koji', tutor, now()),
      )
    },
    [now, update],
  )

  const recordPredictionCycle = useCallback(
    (anchor: SourceAnchor, mode: PersonalizationMode, tutor: TutorEvidence) => {
      update((current) =>
        recordTutorEvidence(current, anchor, mode, 'prediction-cycle', tutor, now()),
      )
    },
    [now, update],
  )

  const setPreference = useCallback(
    (signal: PreferenceSignal) => {
      update((current) => setExplicitPreference(current, signal, now()))
    },
    [now, update],
  )

  const clearPreference = useCallback(
    (dimension: PreferenceSignal['dimension']) => {
      update((current) => clearPresentationPreference(current, dimension, now()))
    },
    [now, update],
  )

  const acceptSuggestion = useCallback(
    (suggestionId: string) => {
      update((current) => acceptPreferenceSuggestion(current, suggestionId, now()))
    },
    [now, update],
  )

  const notNow = useCallback(
    (suggestionId: string) => {
      update((current) => deferPreferenceSuggestion(current, suggestionId, now()))
    },
    [now, update],
  )

  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      update((current) => dismissPreferenceSuggestion(current, suggestionId, now()))
    },
    [now, update],
  )

  const neverSuggest = useCallback(
    (suggestionId: string) => {
      update((current) => neverSuggestPreference(current, suggestionId, now()))
    },
    [now, update],
  )

  const decideClaim = useCallback(
    (
      claimId: string,
      action: UnderstandingClaimDecisionAction,
      correction?: string,
    ) => {
      update((current) =>
        decideUnderstandingClaim(current, claimId, action, now(), correction),
      )
    },
    [now, update],
  )

  const deleteEvidence = useCallback(
    (evidenceId: string) => {
      update((current) => deleteLearningEvidence(current, evidenceId, now()))
    },
    [now, update],
  )

  const deleteSourceData = useCallback(
    (sourceId: string) => {
      update((current) => deleteSourceLearningData(current, sourceId, now()))
    },
    [now, update],
  )

  const grantCrossSource = useCallback(
    (primary: SourceAnchor, secondary: SourceAnchor) => {
      update((current) =>
        grantCrossSourcePermission(current, primary, secondary, now()),
      )
    },
    [now, update],
  )

  const revokeCrossSource = useCallback(
    (permissionId: string) => {
      update((current) =>
        revokeCrossSourcePermission(current, permissionId, now()),
      )
    },
    [now, update],
  )

  const setCrossSourceAllowed = useCallback(
    (primary: SourceAnchor, secondary: SourceAnchor, allowed: boolean) => {
      update((current) =>
        setCrossSourcePermission(current, primary, secondary, allowed, now()),
      )
    },
    [now, update],
  )

  const reset = useCallback(() => {
    setState(resetLearnerModel(storage, now()))
  }, [now, storage])

  const exportState = useCallback(() => exportLearnerModel(state), [state])
  const dueReviews = useMemo(() => getDueReviews(state, now()), [now, state])
  const livingMasteryMap = useMemo(
    () => buildLivingMasteryMap(state, now()),
    [now, state],
  )
  const pendingSuggestions = useMemo(
    () => state.suggestions.filter((suggestion) => suggestion.status === 'pending'),
    [state.suggestions],
  )

  return {
    state,
    approvedPresentation: state.approvedPresentation,
    mastery: state.mastery,
    understandingClaims: state.inference.claims,
    livingMasteryMap,
    dueReviews,
    pendingSuggestions,
    recordRefinement,
    recordHelpful,
    recordQuiz,
    recordReview,
    recordTutorAttempt,
    recordTutorHint,
    recordTeachKoji,
    recordPredictionCycle,
    setExplicitPreference: setPreference,
    clearPreference,
    acceptSuggestion,
    notNow,
    dismissSuggestion,
    neverSuggest,
    decideUnderstandingClaim: decideClaim,
    deleteEvidence,
    deleteSourceData,
    grantCrossSourcePermission: grantCrossSource,
    revokeCrossSourcePermission: revokeCrossSource,
    setCrossSourcePermission: setCrossSourceAllowed,
    hasCrossSourcePermission: (primary: SourceAnchor, secondary: SourceAnchor) =>
      hasCrossSourcePermission(state, primary, secondary),
    getDueReviews: (at = now()) => getDueReviews(state, at),
    exportState,
    reset,
  }
}
