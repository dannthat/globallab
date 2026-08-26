import { describe, expect, it } from 'vitest'
import {
  createLearnerModelState,
  deferPreferenceSuggestion,
  recordHelpfulEvidence,
  recordRefinementEvidence,
} from './learnerModel'
import type { SourceAnchor } from './types'

function anchor(id: string): SourceAnchor {
  return {
    sourceId: 'source',
    sourceKind: 'global-lab',
    sourceTitle: 'Source',
    anchorId: id,
    anchorLabel: `Section ${id}`,
    sourceRevision: 'v1',
  }
}

describe('preference suggestion decisions', () => {
  it('treats dismiss/not-now as temporary and never as silent approval', () => {
    const start = new Date('2026-08-26T00:00:00.000Z')
    let state = createLearnerModelState(start)
    state = recordRefinementEvidence(state, anchor('one'), 'simpler', start)
    state = recordRefinementEvidence(
      state,
      anchor('one'),
      'simpler',
      new Date('2026-08-26T00:01:00.000Z'),
    )
    state = recordHelpfulEvidence(
      state,
      anchor('two'),
      'simpler',
      true,
      new Date('2026-08-26T00:02:00.000Z'),
    )

    const deferred = deferPreferenceSuggestion(
      state,
      state.suggestions[0].id,
      new Date('2026-08-26T00:03:00.000Z'),
    )

    expect(deferred.suggestions[0].status).toBe('not-now')
    expect(deferred.suggestions[0].snoozedUntil).toBe('2026-09-09T00:03:00.000Z')
    expect(deferred.approvedPresentation.detail).toBeUndefined()
  })
})
