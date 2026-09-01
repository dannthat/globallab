import { describe, expect, it } from 'vitest'
import {
  buildLivingMasteryMap,
  createLearnerModelState,
  decideUnderstandingClaim,
  decodeLearnerModel,
  deleteLearningEvidence,
  deleteSourceLearningData,
  grantCrossSourcePermission,
  hasCrossSourcePermission,
  recordTutorEvidence,
  revokeCrossSourcePermission,
} from './learnerModel'
import type { SourceAnchor } from './types'

const NOW = new Date('2026-08-29T08:00:00.000Z')
const LATER = new Date('2026-08-29T09:00:00.000Z')

function anchor(sourceId: string, anchorId: string): SourceAnchor {
  return {
    sourceId,
    sourceKind: sourceId.startsWith('upload') ? 'upload' : 'global-lab',
    sourceTitle: sourceId === 'upload-notes' ? 'My notes' : 'Cell biology',
    anchorId,
    anchorLabel: `Section ${anchorId}`,
    page: sourceId.startsWith('upload') ? Number(anchorId) : undefined,
  }
}

describe('learner model V2 migration and inspectability', () => {
  it('migrates valid V1 data without losing raw evidence or approved preferences', () => {
    const current = createLearnerModelState(NOW)
    const legacy = JSON.parse(JSON.stringify(current)) as Record<string, unknown>
    legacy.version = 1
    delete legacy.inference
    delete legacy.claimDecisions
    delete legacy.crossSourcePermissions

    const migrated = decodeLearnerModel(JSON.stringify(legacy), LATER)
    expect(migrated.version).toBe(2)
    expect(migrated.evidence).toEqual(current.evidence)
    expect(migrated.approvedPresentation).toEqual(current.approvedPresentation)
    expect(migrated.inference).toEqual({
      refreshedAt: LATER.toISOString(),
      claims: [],
    })
    expect(migrated.claimDecisions).toEqual([])
    expect(migrated.crossSourcePermissions).toEqual([])
  })

  it('derives cautious claims with exact evidence pointers and lets the learner correct or delete them', () => {
    let state = recordTutorEvidence(
      createLearnerModelState(NOW),
      anchor('biology', 'respiration'),
      'test-me',
      'tutor-attempt',
      {
        phase: 'guided-practice',
        correct: false,
        independent: true,
        skillTag: 'energy-carrier',
        misconceptionTags: ['confuses-energy-output'],
        sessionId: 'session-1',
        turnId: 'turn-2',
        responseSummary: 'DNA is the immediate energy carrier.',
      },
      NOW,
    )

    const misconception = state.inference.claims.find(
      (claim) => claim.kind === 'misconception',
    )
    expect(misconception).toBeTruthy()
    expect(misconception?.summary).toMatch(/may reflect|hypothesis/i)
    expect(misconception?.summary).not.toMatch(/ability|intelligence|diagnos/i)
    expect(misconception?.evidence[0]).toMatchObject({
      evidenceId: state.evidence[0].id,
      sessionId: 'session-1',
      turnId: 'turn-2',
      anchor: { anchorId: 'respiration' },
    })

    state = decideUnderstandingClaim(
      state,
      misconception!.id,
      'correct',
      LATER,
      'I confused stored information with immediately usable energy.',
    )
    expect(
      state.inference.claims.find((claim) => claim.id === misconception!.id),
    ).toMatchObject({
      status: 'corrected',
      correction: 'I confused stored information with immediately usable energy.',
    })

    state = deleteLearningEvidence(state, state.evidence[0].id, LATER)
    expect(state.evidence).toHaveLength(0)
    expect(state.inference.claims).toHaveLength(0)
  })

  it('keeps mastery and misconception state separate while counting independent transfer', () => {
    let state = recordTutorEvidence(
      createLearnerModelState(NOW),
      anchor('biology', 'membrane'),
      'test-me',
      'tutor-transfer',
      {
        phase: 'transfer',
        correct: true,
        independent: true,
        hintsUsed: 0,
        revealed: false,
        skillTag: 'selective-permeability',
      },
      NOW,
    )
    const map = buildLivingMasteryMap(state, NOW)
    expect(map).toHaveLength(1)
    expect(map[0]).toMatchObject({
      status: 'confident',
      transferAttempts: 1,
      successfulTransfers: 1,
    })
    expect(state.approvedPresentation).toEqual({})
  })
})

describe('cross-source consent and deletion', () => {
  it('stores a labelled, revocable permission for exactly two source anchors', () => {
    const primary = anchor('biology', 'respiration')
    const secondary = anchor('upload-notes', '4')
    let state = grantCrossSourcePermission(
      createLearnerModelState(NOW),
      primary,
      secondary,
      NOW,
    )
    expect(hasCrossSourcePermission(state, primary, secondary)).toBe(true)
    expect(state.crossSourcePermissions[0]).toMatchObject({
      primaryAnchor: primary,
      secondaryAnchor: secondary,
    })

    state = revokeCrossSourcePermission(
      state,
      state.crossSourcePermissions[0].id,
      LATER,
    )
    expect(hasCrossSourcePermission(state, primary, secondary)).toBe(false)
    expect(state.crossSourcePermissions[0].revokedAt).toBe(LATER.toISOString())
  })

  it('deletes evidence, mastery, and active permissions associated with one source', () => {
    const primary = anchor('biology', 'respiration')
    const secondary = anchor('upload-notes', '4')
    let state = recordTutorEvidence(
      createLearnerModelState(NOW),
      secondary,
      'test-me',
      'tutor-transfer',
      {
        phase: 'transfer',
        correct: true,
        independent: true,
        skillTag: 'uploaded-concept',
      },
      NOW,
    )
    state = grantCrossSourcePermission(state, primary, secondary, NOW)
    state = deleteSourceLearningData(state, 'upload-notes', LATER)
    expect(state.evidence).toHaveLength(0)
    expect(state.mastery).toEqual({})
    expect(state.crossSourcePermissions).toHaveLength(0)
  })
})
