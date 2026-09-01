import { describe, expect, it } from 'vitest'
import {
  createTutorMachineState,
  gradeTutorActivity,
  reduceTutorMachine,
} from './tutorMachine'
import type { TutorActivity } from './tutorTypes'

describe('tutor machine', () => {
  it('moves from diagnosis through guided, faded, and transfer practice', () => {
    let state = createTutorMachineState()
    state = reduceTutorMachine(state, {
      type: 'activity-submitted',
      correct: true,
      independent: true,
    })
    expect(state.phase).toBe('guided-practice')

    state = reduceTutorMachine(state, {
      type: 'activity-submitted',
      correct: true,
      independent: true,
    })
    expect(state.phase).toBe('fade-support')

    state = reduceTutorMachine(state, {
      type: 'activity-submitted',
      correct: true,
      independent: true,
    })
    expect(state.phase).toBe('transfer')
  })

  it('returns to scaffolding after a hint or incorrect attempt', () => {
    let state = reduceTutorMachine(createTutorMachineState(), {
      type: 'hint-requested',
    })
    expect(state.phase).toBe('scaffold')
    expect(state.hintCount).toBe(1)

    state = reduceTutorMachine(state, {
      type: 'activity-submitted',
      correct: false,
      independent: false,
    })
    expect(state.phase).toBe('scaffold')
    expect(state.lastAttemptCorrect).toBe(false)
  })

  it('keeps a completed session complete when a provider turn regresses', () => {
    const complete = {
      ...createTutorMachineState(),
      phase: 'complete' as const,
      completedAt: '2026-08-28T10:00:00.000Z',
    }
    const next = reduceTutorMachine(complete, {
      type: 'turn-received',
      requestedIntent: 'continue',
      proposedPhase: 'diagnose',
    })
    expect(next.phase).toBe('complete')
    expect(next.turnCount).toBe(1)
  })

  it('ignores out-of-order misconception-world events', () => {
    const state = createTutorMachineState('misconception-world')
    expect(
      reduceTutorMachine(state, {
        type: 'hypothetical-predicted',
        prediction: 'It would speed up.',
      }),
    ).toEqual(state)

    const world = {
      label: 'Hypothetical' as const,
      premise: 'Hypothetical: ATP stores genetic information.',
      predictionPrompt: 'What would follow?',
      failurePrompt: 'Why does it fail?',
      reconstructionPrompt: 'Rebuild the correct model.',
      evidenceQuote: 'ATP stores immediately usable chemical energy',
    }
    let next = reduceTutorMachine(state, { type: 'hypothetical-created', world })
    next = reduceTutorMachine(next, {
      type: 'hypothetical-predicted',
      prediction: 'Energy and information would be the same.',
    })
    next = reduceTutorMachine(next, { type: 'hypothetical-inspected' })
    next = reduceTutorMachine(next, {
      type: 'hypothetical-failure-explained',
      explanation: 'The source assigns ATP an energy role.',
    })
    next = reduceTutorMachine(next, {
      type: 'hypothetical-reconstructed',
      reconstruction: 'ATP transfers usable chemical energy.',
    })
    expect(next.misconceptionWorld.stage).toBe('complete')
  })

  it('guards prediction order and completes Teach Koji only after independent transfer', () => {
    const snapshot = {
      simulationId: 'sim-1',
      topicId: 'biology',
      sectionId: 'membrane',
      label: 'Membrane lab',
      controls: { concentration: 1 },
      outputs: { flux: 2 },
      updatedAt: '2026-08-29T08:00:00.000Z',
    }
    const prediction = createTutorMachineState('prediction-cycle')
    expect(
      reduceTutorMachine(prediction, { type: 'simulation-acted' }),
    ).toEqual(prediction)
    let nextPrediction = reduceTutorMachine(prediction, {
      type: 'prediction-recorded',
      prediction: 'Flux will rise.',
      baseline: snapshot,
    })
    nextPrediction = reduceTutorMachine(nextPrediction, { type: 'simulation-acted' })
    nextPrediction = reduceTutorMachine(nextPrediction, {
      type: 'observation-recorded',
      observation: { ...snapshot, controls: { concentration: 2 }, outputs: { flux: 4 } },
    })
    nextPrediction = reduceTutorMachine(nextPrediction, {
      type: 'prediction-revised',
      revision: 'Flux rose with concentration.',
      accurate: true,
    })
    expect(nextPrediction.predictionCycle.stage).toBe('complete')

    let teach = createTutorMachineState('teach-koji')
    teach = reduceTutorMachine(teach, {
      type: 'teach-koji-evaluated',
      check: {
        coverage: 'complete',
        coveredConcepts: ['ATP'],
        missingSteps: [],
        evidenceQuote: 'ATP stores immediately usable chemical energy',
      },
    })
    expect(teach.teachKoji.stage).toBe('independent-transfer')
    teach = reduceTutorMachine(teach, {
      type: 'activity-submitted',
      correct: true,
      independent: true,
    })
    expect(teach.teachKoji.stage).toBe('complete')
  })
})

describe('activity grading', () => {
  it('grades multiple choice deterministically', () => {
    const activity: TutorActivity = {
      id: 'a1',
      kind: 'multiple-choice',
      prompt: 'Which term?',
      options: [
        { id: 'a', label: 'ATP' },
        { id: 'b', label: 'DNA' },
      ],
      correctOptionId: 'a',
      evidence: 'Cells produce ATP.',
      explanation: 'The source says cells produce ATP.',
      skillTag: 'identify-output',
      misconceptionTags: ['confuses-output'],
    }
    expect(gradeTutorActivity(activity, 'a').correct).toBe(true)
    expect(gradeTutorActivity(activity, 'b').misconceptionTags).toEqual([
      'confuses-output',
    ])
  })

  it('grades ordering and matching without a model call', () => {
    const ordering: TutorActivity = {
      id: 'order',
      kind: 'ordering',
      prompt: 'Order the stages',
      items: [
        { id: 'one', label: 'One' },
        { id: 'two', label: 'Two' },
      ],
      correctOrder: ['one', 'two'],
      evidence: 'One happens before two.',
      explanation: 'The source states the order.',
      skillTag: 'sequence',
      misconceptionTags: ['reverses-sequence'],
    }
    expect(gradeTutorActivity(ordering, ['one', 'two']).correct).toBe(true)

    const matching: TutorActivity = {
      id: 'match',
      kind: 'matching',
      prompt: 'Match each role',
      left: [{ id: 'atp', label: 'ATP' }],
      right: [{ id: 'energy', label: 'usable energy' }],
      correctPairs: { atp: 'energy' },
      evidence: 'ATP is usable energy.',
      explanation: 'The source provides the relationship.',
      skillTag: 'match-role',
      misconceptionTags: ['role-confusion'],
    }
    expect(gradeTutorActivity(matching, { atp: 'energy' }).correct).toBe(true)
  })
})
