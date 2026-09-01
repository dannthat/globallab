import type {
  TutorActivity,
  TutorActivityGrade,
  TutorActivityResponse,
  TutorMachineEvent,
  TutorMachineState,
  TutorLearningMode,
  TutorPhase,
} from './tutorTypes'

export function createTutorMachineState(
  learningMode: TutorLearningMode = 'guided',
): TutorMachineState {
  return {
    phase: 'diagnose',
    turnCount: 0,
    attemptCount: 0,
    hintCount: 0,
    revealCount: 0,
    consecutiveCorrect: 0,
    lastAttemptCorrect: null,
    learningMode,
    teachKoji: {
      stage: 'invite-explanation',
      missingSteps: [],
    },
    misconceptionWorld: {
      stage: 'introduce',
    },
    predictionCycle: {
      stage: 'predict',
    },
  }
}

const PHASE_ORDER: TutorPhase[] = [
  'diagnose',
  'scaffold',
  'guided-practice',
  'fade-support',
  'transfer',
  'complete',
]

function earlierPhase(left: TutorPhase, right: TutorPhase) {
  return PHASE_ORDER.indexOf(left) <= PHASE_ORDER.indexOf(right) ? left : right
}

function nextSuccessfulPhase(state: TutorMachineState, independent: boolean): TutorPhase {
  if (state.phase === 'complete') return 'complete'
  if (state.phase === 'transfer') return independent ? 'complete' : 'transfer'
  if (state.phase === 'fade-support') return independent ? 'transfer' : 'fade-support'
  if (state.phase === 'guided-practice') return independent ? 'fade-support' : 'guided-practice'
  return 'guided-practice'
}

/** The client owns progression; a provider may suggest an earlier phase, never skip ahead. */
export function reduceTutorMachine(
  state: TutorMachineState,
  event: TutorMachineEvent,
): TutorMachineState {
  switch (event.type) {
    case 'turn-received': {
      if (state.phase === 'complete') {
        return { ...state, turnCount: state.turnCount + 1 }
      }
      const requestedPhase = event.proposedPhase ?? state.phase
      const phase =
        event.requestedIntent === 'transfer'
          ? 'transfer'
          : earlierPhase(requestedPhase, state.phase)
      return { ...state, phase, turnCount: state.turnCount + 1 }
    }
    case 'hint-requested':
      return {
        ...state,
        phase: state.phase === 'complete' ? 'complete' : 'scaffold',
        hintCount: state.hintCount + 1,
      }
    case 'answer-revealed':
      return {
        ...state,
        phase: state.phase === 'complete' ? 'complete' : 'scaffold',
        revealCount: state.revealCount + 1,
        consecutiveCorrect: 0,
      }
    case 'activity-submitted':
      return {
        ...state,
        phase: event.correct
          ? nextSuccessfulPhase(state, event.independent)
          : 'scaffold',
        attemptCount: state.attemptCount + 1,
        consecutiveCorrect: event.correct ? state.consecutiveCorrect + 1 : 0,
        lastAttemptCorrect: event.correct,
        teachKoji:
          state.learningMode === 'teach-koji' &&
          state.teachKoji.stage === 'independent-transfer'
            ? {
                ...state.teachKoji,
                stage:
                  event.correct && event.independent
                    ? 'complete'
                    : 'probe-gap',
              }
            : state.teachKoji,
      }
    case 'transfer-requested':
      return {
        ...state,
        phase: state.phase === 'complete' ? 'complete' : 'transfer',
      }
    case 'session-completed':
      return { ...state, phase: 'complete', completedAt: event.at }
    case 'mode-selected':
      return {
        ...createTutorMachineState(event.mode),
        turnCount: state.turnCount,
      }
    case 'teach-koji-evaluated':
      if (
        state.learningMode !== 'teach-koji' ||
        state.teachKoji.stage === 'complete'
      ) return state
      return {
        ...state,
        teachKoji: {
          stage:
            event.check.coverage === 'complete'
              ? 'independent-transfer'
              : 'probe-gap',
          coverage: event.check.coverage,
          missingSteps: event.check.missingSteps,
          misunderstanding: event.check.misunderstanding,
        },
      }
    case 'hypothetical-created':
      if (
        state.learningMode !== 'misconception-world' ||
        state.misconceptionWorld.stage !== 'introduce'
      ) return state
      return {
        ...state,
        misconceptionWorld: {
          stage: 'predict',
          world: event.world,
        },
      }
    case 'hypothetical-predicted':
      if (
        state.learningMode !== 'misconception-world' ||
        state.misconceptionWorld.stage !== 'predict' ||
        !state.misconceptionWorld.world
      ) return state
      return {
        ...state,
        misconceptionWorld: {
          ...state.misconceptionWorld,
          stage: 'inspect',
          prediction: event.prediction,
        },
      }
    case 'hypothetical-inspected':
      if (
        state.learningMode !== 'misconception-world' ||
        state.misconceptionWorld.stage !== 'inspect'
      ) return state
      return {
        ...state,
        misconceptionWorld: {
          ...state.misconceptionWorld,
          stage: 'explain-failure',
        },
      }
    case 'hypothetical-failure-explained':
      if (
        state.learningMode !== 'misconception-world' ||
        state.misconceptionWorld.stage !== 'explain-failure'
      ) return state
      return {
        ...state,
        misconceptionWorld: {
          ...state.misconceptionWorld,
          stage: 'reconstruct',
          failureExplanation: event.explanation,
        },
      }
    case 'hypothetical-reconstructed':
      if (
        state.learningMode !== 'misconception-world' ||
        state.misconceptionWorld.stage !== 'reconstruct'
      ) return state
      return {
        ...state,
        misconceptionWorld: {
          ...state.misconceptionWorld,
          stage: 'complete',
          reconstruction: event.reconstruction,
        },
      }
    case 'prediction-recorded':
      if (
        state.learningMode !== 'prediction-cycle' ||
        state.predictionCycle.stage !== 'predict'
      ) return state
      return {
        ...state,
        predictionCycle: {
          stage: 'act',
          prediction: event.prediction,
          baseline: event.baseline,
        },
      }
    case 'simulation-acted':
      if (
        state.learningMode !== 'prediction-cycle' ||
        state.predictionCycle.stage !== 'act' ||
        !state.predictionCycle.baseline
      ) return state
      return {
        ...state,
        predictionCycle: {
          ...state.predictionCycle,
          stage: 'observe',
        },
      }
    case 'observation-recorded':
      if (
        state.learningMode !== 'prediction-cycle' ||
        state.predictionCycle.stage !== 'observe' ||
        !state.predictionCycle.baseline ||
        event.observation.simulationId !==
          state.predictionCycle.baseline.simulationId
      ) return state
      return {
        ...state,
        predictionCycle: {
          ...state.predictionCycle,
          stage: 'revise',
          observation: event.observation,
        },
      }
    case 'prediction-revised':
      if (
        state.learningMode !== 'prediction-cycle' ||
        state.predictionCycle.stage !== 'revise' ||
        !state.predictionCycle.observation
      ) return state
      return {
        ...state,
        predictionCycle: {
          ...state.predictionCycle,
          stage: 'complete',
          revision: event.revision,
          accurate: event.accurate,
        },
      }
  }
}

function normalizeAnswer(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function sameSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const expected = new Set(right)
  return left.every((value) => expected.has(value))
}

export function gradeTutorActivity(
  activity: TutorActivity,
  response: TutorActivityResponse,
): TutorActivityGrade {
  let correct = false

  switch (activity.kind) {
    case 'multiple-choice':
    case 'simulation-prediction':
      correct = typeof response === 'string' && response === activity.correctOptionId
      break
    case 'short-answer': {
      if (typeof response !== 'string') break
      const normalized = normalizeAnswer(response)
      const accepted = activity.acceptedAnswers.some(
        (answer) => normalizeAnswer(answer) === normalized,
      )
      const keywords = activity.requiredKeywords.map(normalizeAnswer).filter(Boolean)
      const keywordMatches = keywords.filter((keyword) => normalized.includes(keyword))
      correct = accepted || (keywords.length > 0 && keywordMatches.length === keywords.length)
      break
    }
    case 'ordering':
      correct =
        Array.isArray(response) &&
        response.length === activity.correctOrder.length &&
        response.every((value, index) => value === activity.correctOrder[index])
      break
    case 'matching':
      correct =
        !Array.isArray(response) &&
        typeof response === 'object' &&
        response !== null &&
        Object.entries(activity.correctPairs).every(
          ([left, right]) => response[left] === right,
        ) &&
        Object.keys(response).length === Object.keys(activity.correctPairs).length
      break
    case 'hotspot':
      correct = Array.isArray(response) && sameSet(response, activity.correctHotspotIds)
      break
  }

  return {
    correct,
    score: correct ? 1 : 0,
    total: 1,
    feedback: correct
      ? `Correct. ${activity.explanation}`
      : `Not yet. Recheck the source evidence before another attempt.`,
    evidence: activity.evidence,
    skillTag: activity.skillTag,
    misconceptionTags: correct ? [] : activity.misconceptionTags,
  }
}
