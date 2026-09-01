import { describe, expect, it } from 'vitest'
import {
  LEARNER_MODEL_STORAGE_KEY,
  MAX_EVIDENCE_EVENTS,
  acceptPreferenceSuggestion,
  createLearnerModelState,
  decodeLearnerModel,
  exportLearnerModel,
  getDueReviews,
  neverSuggestPreference,
  persistLearnerModel,
  readLearnerModel,
  recordHelpfulEvidence,
  recordQuizEvidence,
  recordRefinementEvidence,
  resetLearnerModel,
  scheduleReview,
  setExplicitPreference,
  signalForMode,
  sourceAnchorKey,
} from './learnerModel'
import type { SourceAnchor, StorageLike } from './types'

const NOW = new Date('2026-08-26T00:00:00.000Z')
const LATER = new Date('2026-08-26T00:01:00.000Z')

function anchor(anchorId: string, fingerprint = 'source-hash'): SourceAnchor {
  return {
    sourceId: 'biology-book',
    sourceKind: 'upload',
    sourceTitle: 'Biology notes',
    anchorId,
    anchorLabel: `Page ${anchorId}`,
    page: Number(anchorId),
    sourceFingerprint: fingerprint,
  }
}

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

function buildSimplerSuggestion() {
  let state = createLearnerModelState(NOW)
  state = recordRefinementEvidence(state, anchor('1'), 'simpler', NOW)
  state = recordRefinementEvidence(state, anchor('1'), 'simpler', LATER)
  state = recordHelpfulEvidence(
    state,
    anchor('2'),
    'simpler',
    true,
    new Date('2026-08-26T00:02:00.000Z'),
  )
  return state
}

describe('learner model persistence', () => {
  it('uses a versioned runtime-validated state and safely resets invalid data', () => {
    const initial = createLearnerModelState(NOW)
    expect(initial.version).toBe(2)
    expect(decodeLearnerModel(JSON.stringify(initial), LATER)).toEqual(initial)

    const invalid = JSON.stringify({ ...initial, approvedPresentation: { detail: 42 } })
    const recovered = decodeLearnerModel(invalid, LATER)
    expect(recovered).toEqual(createLearnerModelState(LATER))

    const wrongVersion = decodeLearnerModel(
      JSON.stringify({ ...initial, version: 999 }),
      LATER,
    )
    expect(wrongVersion).toEqual(createLearnerModelState(LATER))

    const forgedInference = decodeLearnerModel(
      JSON.stringify({
        ...initial,
        approvedPresentation: {
          detail: {
            value: 'simpler',
            origin: 'inferred',
            approvedAt: NOW.toISOString(),
            proposalId: 'proposal-that-was-not-accepted',
          },
        },
      }),
      LATER,
    )
    expect(forgedInference).toEqual(createLearnerModelState(LATER))
  })

  it('persists, exports, and resets without mixing presentation and mastery data', () => {
    const storage = new MemoryStorage()
    let state = createLearnerModelState(NOW)
    state = setExplicitPreference(
      state,
      { dimension: 'structure', value: 'steps' },
      LATER,
    )
    state = scheduleReview(state, anchor('1'), 5, LATER)

    expect(persistLearnerModel(storage, state)).toBe(true)
    expect(readLearnerModel(storage, NOW)).toEqual(state)
    const exported = JSON.parse(exportLearnerModel(state)) as typeof state
    expect(exported.approvedPresentation.structure?.value).toBe('steps')
    expect(Object.keys(exported.mastery)).toHaveLength(1)

    const reset = resetLearnerModel(storage, LATER)
    expect(storage.getItem(LEARNER_MODEL_STORAGE_KEY)).toBeNull()
    expect(reset.approvedPresentation).toEqual({})
    expect(reset.mastery).toEqual({})
  })

  it('includes immutable source identity in anchor keys', () => {
    expect(sourceAnchorKey(anchor('1', 'first-hash'))).not.toBe(
      sourceAnchorKey(anchor('1', 'second-hash')),
    )
  })
})

describe('cautious preference suggestions', () => {
  it('does not mistake a helpful analogy for a request for more examples', () => {
    expect(signalForMode('analogy')).toEqual({
      dimension: 'practice',
      value: 'explanation',
    })
    expect(signalForMode('another-example')).toEqual({
      dimension: 'examples',
      value: 'more-examples',
    })
  })

  it('waits for three signals, two anchors, and one successful outcome', () => {
    let state = createLearnerModelState(NOW)
    state = recordRefinementEvidence(state, anchor('1'), 'simpler', NOW)
    state = recordRefinementEvidence(state, anchor('1'), 'simpler', LATER)
    expect(state.suggestions).toHaveLength(0)

    state = recordHelpfulEvidence(
      state,
      anchor('2'),
      'simpler',
      true,
      new Date('2026-08-26T00:02:00.000Z'),
    )

    expect(state.suggestions).toHaveLength(1)
    expect(state.approvedPresentation.detail).toBeUndefined()
    expect(state.suggestions[0]).toMatchObject({
      evidenceCount: 3,
      distinctAnchorCount: 2,
      successfulOutcomeCount: 1,
      status: 'pending',
    })
    expect(state.suggestions[0].reason).toContain('You chose')
    expect(state.suggestions[0].reason).toContain('went well')
    expect(state.suggestions[0].reason).not.toMatch(/lost|struggle|difficulty|diagnos/i)
  })

  it('changes inferred preferences only when a pending suggestion is accepted', () => {
    const pending = buildSimplerSuggestion()
    const suggestionId = pending.suggestions[0].id
    expect(pending.approvedPresentation.detail).toBeUndefined()

    const ignoredUnknown = acceptPreferenceSuggestion(pending, 'missing', LATER)
    expect(ignoredUnknown).toBe(pending)

    const accepted = acceptPreferenceSuggestion(pending, suggestionId, LATER)
    expect(accepted.approvedPresentation.detail).toEqual({
      value: 'simpler',
      origin: 'inferred',
      approvedAt: LATER.toISOString(),
      proposalId: suggestionId,
    })
    expect(accepted.suggestions[0].status).toBe('accepted')
  })

  it('keeps explicit preferences explicit and does not propose over them', () => {
    let state = setExplicitPreference(
      createLearnerModelState(NOW),
      { dimension: 'detail', value: 'balanced' },
      NOW,
    )
    state = recordRefinementEvidence(state, anchor('1'), 'simpler', NOW)
    state = recordRefinementEvidence(state, anchor('1'), 'simpler', LATER)
    state = recordHelpfulEvidence(state, anchor('2'), 'simpler', true, LATER)

    expect(state.approvedPresentation.detail?.origin).toBe('explicit')
    expect(state.approvedPresentation.detail?.value).toBe('balanced')
    expect(state.suggestions).toHaveLength(0)
  })

  it('supports never-suggest without changing approved preferences', () => {
    const pending = buildSimplerSuggestion()
    const blocked = neverSuggestPreference(
      pending,
      pending.suggestions[0].id,
      new Date('2026-08-26T00:03:00.000Z'),
    )
    expect(blocked.approvedPresentation.detail).toBeUndefined()
    expect(blocked.suggestions[0].status).toBe('never-suggest')

    let withMoreEvidence = recordRefinementEvidence(
      blocked,
      anchor('3'),
      'simpler',
      new Date('2026-09-30T00:00:00.000Z'),
    )
    withMoreEvidence = recordHelpfulEvidence(
      withMoreEvidence,
      anchor('3'),
      'simpler',
      true,
      new Date('2026-09-30T00:01:00.000Z'),
    )
    expect(withMoreEvidence.suggestions).toHaveLength(1)
  })

  it('caps the evidence log', () => {
    let state = createLearnerModelState(NOW)
    for (let index = 0; index < MAX_EVIDENCE_EVENTS + 25; index += 1) {
      state = recordRefinementEvidence(
        state,
        anchor(String((index % 2) + 1)),
        'step-by-step',
        new Date(NOW.getTime() + index * 1000),
      )
    }
    expect(state.evidence).toHaveLength(MAX_EVIDENCE_EVENTS)
  })
})

describe('mastery and delayed review', () => {
  it('uses an SM-2-lite progression and returns due reviews deterministically', () => {
    const first = scheduleReview(createLearnerModelState(NOW), anchor('1'), 5, NOW)
    const firstRecord = first.mastery[sourceAnchorKey(anchor('1'))]
    expect(firstRecord.intervalDays).toBe(1)
    expect(getDueReviews(first, NOW)).toHaveLength(0)

    const firstDue = new Date(firstRecord.nextReviewAt)
    expect(getDueReviews(first, firstDue)).toHaveLength(1)

    const second = scheduleReview(first, anchor('1'), 4, firstDue)
    expect(second.mastery[sourceAnchorKey(anchor('1'))].intervalDays).toBe(3)

    const lapse = scheduleReview(second, anchor('1'), 1, new Date('2026-09-01T00:00:00.000Z'))
    expect(lapse.mastery[sourceAnchorKey(anchor('1'))]).toMatchObject({
      repetitions: 0,
      intervalDays: 1,
      lapses: 1,
    })
  })

  it('records quiz evidence as an outcome while updating separate mastery memory', () => {
    const state = recordQuizEvidence(
      createLearnerModelState(NOW),
      anchor('1'),
      4,
      5,
      NOW,
    )
    expect(state.evidence[0]).toMatchObject({
      kind: 'quiz',
      outcome: 'successful',
      quiz: { score: 4, total: 5, ratio: 0.8 },
    })
    expect(state.mastery[sourceAnchorKey(anchor('1'))].lastRating).toBe(4)
  })
})
