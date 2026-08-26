import { describe, expect, it } from 'vitest'
import {
  createLearnerModelState,
  recordHelpfulEvidence,
  recordRefinementEvidence,
} from './learnerModel'
import type { SourceAnchor } from './types'

const START = new Date('2026-08-26T00:00:00.000Z')

function at(minute: number) {
  return new Date(START.getTime() + minute * 60_000)
}

function anchor(id: string): SourceAnchor {
  return {
    sourceId: 'textbook',
    sourceKind: 'global-lab',
    sourceTitle: 'Textbook',
    anchorId: id,
    anchorLabel: `Section ${id}`,
    sourceRevision: 'v1',
  }
}

describe('preference suggestion thresholds', () => {
  it('does not propose from one anchor even when a helpful outcome exists', () => {
    let state = createLearnerModelState(START)
    state = recordRefinementEvidence(state, anchor('one'), 'simpler', at(0))
    state = recordRefinementEvidence(state, anchor('one'), 'simpler', at(1))
    state = recordHelpfulEvidence(state, anchor('one'), 'simpler', true, at(2))
    expect(state.suggestions).toHaveLength(0)

    state = recordRefinementEvidence(state, anchor('two'), 'simpler', at(3))
    expect(state.suggestions).toHaveLength(1)
  })

  it('does not propose without a successful outcome even across two anchors', () => {
    let state = createLearnerModelState(START)
    state = recordRefinementEvidence(state, anchor('one'), 'step-by-step', at(0))
    state = recordRefinementEvidence(state, anchor('two'), 'step-by-step', at(1))
    state = recordRefinementEvidence(state, anchor('two'), 'step-by-step', at(2))
    expect(state.suggestions).toHaveLength(0)

    state = recordHelpfulEvidence(state, anchor('one'), 'step-by-step', true, at(3))
    expect(state.suggestions).toHaveLength(1)
  })
})
