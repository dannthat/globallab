// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LEARNER_MODEL_STORAGE_KEY } from '../personalization/learnerModel'
import type { SourceAnchor } from '../personalization/types'
import { useLearnerModel } from './useLearnerModel'

const NOW = new Date('2026-08-26T10:00:00.000Z')
const clock = () => new Date(NOW)

function anchor(anchorId: string): SourceAnchor {
  return {
    sourceId: 'curated-biology',
    sourceKind: 'global-lab',
    sourceTitle: 'Cellular respiration',
    anchorId,
    anchorLabel: `Section ${anchorId}`,
    url: 'https://example.edu/biology',
    license: 'Open access',
    sourceRevision: '2026-08',
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('useLearnerModel', () => {
  it('persists evidence and exposes a cautious pending suggestion', () => {
    const { result } = renderHook(() =>
      useLearnerModel({ storage: window.localStorage, now: clock }),
    )

    act(() => {
      result.current.recordRefinement(anchor('one'), 'step-by-step')
      result.current.recordRefinement(anchor('one'), 'step-by-step')
      result.current.recordHelpful(anchor('two'), 'step-by-step', true)
    })

    expect(result.current.pendingSuggestions).toHaveLength(1)
    expect(result.current.approvedPresentation.structure).toBeUndefined()

    const stored = JSON.parse(
      window.localStorage.getItem(LEARNER_MODEL_STORAGE_KEY) ?? '{}',
    ) as { evidence?: unknown[]; suggestions?: unknown[] }
    expect(stored.evidence).toHaveLength(3)
    expect(stored.suggestions).toHaveLength(1)
  })

  it('requires acceptance before applying an inferred preference', () => {
    const { result } = renderHook(() =>
      useLearnerModel({ storage: window.localStorage, now: clock }),
    )

    act(() => {
      result.current.recordRefinement(anchor('one'), 'simpler')
      result.current.recordRefinement(anchor('one'), 'simpler')
      result.current.recordQuiz(anchor('two'), 5, 5, 'simpler')
    })
    const suggestionId = result.current.pendingSuggestions[0].id
    expect(result.current.approvedPresentation.detail).toBeUndefined()

    act(() => result.current.acceptSuggestion(suggestionId))
    expect(result.current.approvedPresentation.detail).toMatchObject({
      value: 'simpler',
      origin: 'inferred',
      proposalId: suggestionId,
    })
  })

  it('exports and resets presentation and mastery memory together but separately', () => {
    const { result } = renderHook(() =>
      useLearnerModel({ storage: window.localStorage, now: clock }),
    )

    act(() => {
      result.current.setExplicitPreference({ dimension: 'detail', value: 'detailed' })
      result.current.recordReview(anchor('one'), 5)
    })

    const exported = JSON.parse(result.current.exportState()) as {
      approvedPresentation: { detail?: { value: string } }
      mastery: Record<string, unknown>
    }
    expect(exported.approvedPresentation.detail?.value).toBe('detailed')
    expect(Object.keys(exported.mastery)).toHaveLength(1)

    act(() => result.current.reset())
    expect(result.current.approvedPresentation).toEqual({})
    expect(result.current.mastery).toEqual({})
    expect(window.localStorage.getItem(LEARNER_MODEL_STORAGE_KEY)).toBeNull()
  })

  it('lets the student revoke one saved presentation preference', () => {
    const { result } = renderHook(() =>
      useLearnerModel({ storage: window.localStorage, now: clock }),
    )

    act(() => {
      result.current.setExplicitPreference({ dimension: 'detail', value: 'simpler' })
      result.current.setExplicitPreference({ dimension: 'practice', value: 'quiz' })
    })
    expect(result.current.approvedPresentation.detail?.value).toBe('simpler')
    expect(result.current.approvedPresentation.practice?.value).toBe('quiz')

    act(() => result.current.clearPreference('detail'))
    expect(result.current.approvedPresentation.detail).toBeUndefined()
    expect(result.current.approvedPresentation.practice?.value).toBe('quiz')
  })
})
