import type { StudentProfile } from '../types'
import type {
  ApprovedPresentationPreferences,
  CompanionSourceScope,
  SourceExcerpt,
} from './types'

export const TUTOR_PHASES = [
  'diagnose',
  'scaffold',
  'guided-practice',
  'fade-support',
  'transfer',
  'complete',
] as const

export type TutorPhase = (typeof TUTOR_PHASES)[number]

export const TUTOR_INTENTS = [
  'start',
  'ask',
  'hint',
  'explain-differently',
  'show-visually',
  'another-example',
  'step-by-step',
  'test-me',
  'continue',
  'transfer',
  'teach-koji',
  'misconception-world',
  'prediction-cycle',
  'cross-source',
] as const

export type TutorIntent = (typeof TUTOR_INTENTS)[number]

export type TutorEntryPoint =
  | 'section'
  | 'selection'
  | 'upload'
  | 'diagram'
  | 'simulation'

export const TUTOR_LEARNING_MODES = [
  'guided',
  'teach-koji',
  'misconception-world',
  'prediction-cycle',
  'cross-source',
] as const

export type TutorLearningMode = (typeof TUTOR_LEARNING_MODES)[number]

export type TeachKojiStage =
  | 'invite-explanation'
  | 'check-coverage'
  | 'probe-gap'
  | 'independent-transfer'
  | 'complete'

export type MisconceptionWorldStage =
  | 'introduce'
  | 'predict'
  | 'inspect'
  | 'explain-failure'
  | 'reconstruct'
  | 'complete'

export type PredictionCycleStage =
  | 'predict'
  | 'act'
  | 'observe'
  | 'revise'
  | 'complete'

export interface TutorSimulationSnapshot {
  simulationId: string
  topicId: string
  sectionId: string
  label: string
  controls: Record<string, string | number | boolean>
  outputs: Record<string, string | number | boolean>
  updatedAt: string
}

/**
 * The complete, bounded context for one tutoring session. Source text remains
 * immutable and the provider never receives more than this focused excerpt.
 */
export interface TutorContext {
  sessionId: string
  entryPoint: TutorEntryPoint
  objective: string
  excerpt: SourceExcerpt
  scope: CompanionSourceScope
  topicTitle?: string
  student: Pick<
    StudentProfile,
    | 'interest'
    | 'gradeLevel'
    | 'preferredLanguage'
    | 'learningGoals'
    | 'startingSupport'
    | 'stuckSupport'
  > & {
    approvedPresentation: ApprovedPresentationPreferences
  }
  cloudAllowed: boolean
  simulation?: TutorSimulationSnapshot
  /** At most one additional focused extract, present only after explicit permission. */
  secondaryExcerpts?: SourceExcerpt[]
  crossSourcePermissionId?: string
}

export interface TutorCitation {
  anchorId: string
  quote: string
  label: string
}

export interface TutorUnderstandingCheck {
  coverage: 'complete' | 'partial' | 'unsupported'
  coveredConcepts: string[]
  missingSteps: string[]
  misunderstanding?: string
  evidenceQuote: string
}

export interface TutorHypotheticalWorld {
  label: 'Hypothetical'
  premise: string
  predictionPrompt: string
  failurePrompt: string
  reconstructionPrompt: string
  evidenceQuote: string
}

export interface TutorChoice {
  id: string
  label: string
}

interface TutorActivityBase {
  id: string
  prompt: string
  evidence: string
  skillTag: string
  misconceptionTags: string[]
  explanation: string
}

export interface TutorMultipleChoiceActivity extends TutorActivityBase {
  kind: 'multiple-choice'
  options: TutorChoice[]
  correctOptionId: string
}

export interface TutorShortAnswerActivity extends TutorActivityBase {
  kind: 'short-answer'
  acceptedAnswers: string[]
  requiredKeywords: string[]
}

export interface TutorOrderingActivity extends TutorActivityBase {
  kind: 'ordering'
  items: TutorChoice[]
  correctOrder: string[]
}

export interface TutorMatchingActivity extends TutorActivityBase {
  kind: 'matching'
  left: TutorChoice[]
  right: TutorChoice[]
  correctPairs: Record<string, string>
}

export interface TutorHotspotActivity extends TutorActivityBase {
  kind: 'hotspot'
  imageAlt: string
  hotspots: Array<TutorChoice & { x: number; y: number }>
  correctHotspotIds: string[]
}

export interface TutorSimulationPredictionActivity extends TutorActivityBase {
  kind: 'simulation-prediction'
  simulationId: string
  options: TutorChoice[]
  correctOptionId: string
  observationPrompt: string
}

export type TutorActivity =
  | TutorMultipleChoiceActivity
  | TutorShortAnswerActivity
  | TutorOrderingActivity
  | TutorMatchingActivity
  | TutorHotspotActivity
  | TutorSimulationPredictionActivity

export type TutorActivityResponse = string | string[] | Record<string, string>

export interface TutorActivityGrade {
  correct: boolean
  score: number
  total: number
  feedback: string
  evidence: string
  skillTag: string
  misconceptionTags: string[]
}

export type TutorAction =
  | {
      type: 'highlight-source'
      quote: string
      label: string
    }
  | {
      type: 'open-simulation'
      simulationId: string
      topicId: string
      sectionId: string
    }
  | {
      type: 'set-simulation-control'
      simulationId: string
      controlId: string
      value: string | number | boolean
    }
  | {
      type: 'present-activity'
      activity: TutorActivity
    }
  | {
      type: 'schedule-review'
      reason: string
    }
  | {
      type: 'complete-session'
      summary: string
    }

export interface TutorTurn {
  id: string
  phase: TutorPhase
  intent: TutorIntent
  message: string
  actions: TutorAction[]
  skillTags: string[]
  misconceptionTags: string[]
  citations: TutorCitation[]
  understandingCheck?: TutorUnderstandingCheck
  hypotheticalWorld?: TutorHypotheticalWorld
  provider: 'gemini' | 'local'
  model?: string
  createdAt: string
}

export interface TutorMessage {
  id: string
  role: 'student' | 'tutor'
  text: string
  createdAt: string
  phase: TutorPhase
  intent?: TutorIntent
}

export interface TutorMachineState {
  phase: TutorPhase
  turnCount: number
  attemptCount: number
  hintCount: number
  revealCount: number
  consecutiveCorrect: number
  lastAttemptCorrect: boolean | null
  learningMode: TutorLearningMode
  teachKoji: {
    stage: TeachKojiStage
    coverage?: TutorUnderstandingCheck['coverage']
    missingSteps: string[]
    misunderstanding?: string
  }
  misconceptionWorld: {
    stage: MisconceptionWorldStage
    world?: TutorHypotheticalWorld
    prediction?: string
    failureExplanation?: string
    reconstruction?: string
  }
  predictionCycle: {
    stage: PredictionCycleStage
    prediction?: string
    baseline?: TutorSimulationSnapshot
    observation?: TutorSimulationSnapshot
    revision?: string
    accurate?: boolean
  }
  completedAt?: string
}

export type TutorMachineEvent =
  | { type: 'turn-received'; requestedIntent: TutorIntent; proposedPhase?: TutorPhase }
  | { type: 'hint-requested' }
  | { type: 'answer-revealed' }
  | { type: 'activity-submitted'; correct: boolean; independent: boolean }
  | { type: 'transfer-requested' }
  | { type: 'session-completed'; at: string }
  | { type: 'mode-selected'; mode: TutorLearningMode }
  | {
      type: 'teach-koji-evaluated'
      check: TutorUnderstandingCheck
    }
  | { type: 'hypothetical-created'; world: TutorHypotheticalWorld }
  | { type: 'hypothetical-predicted'; prediction: string }
  | { type: 'hypothetical-inspected' }
  | { type: 'hypothetical-failure-explained'; explanation: string }
  | { type: 'hypothetical-reconstructed'; reconstruction: string }
  | {
      type: 'prediction-recorded'
      prediction: string
      baseline: TutorSimulationSnapshot
    }
  | { type: 'simulation-acted' }
  | { type: 'observation-recorded'; observation: TutorSimulationSnapshot }
  | { type: 'prediction-revised'; revision: string; accurate: boolean }

export interface TutorTurnRequest {
  context: TutorContext
  machine: TutorMachineState
  messages: TutorMessage[]
  intent: TutorIntent
  userText?: string
  activityResult?: TutorActivityGrade
  signal?: AbortSignal
}

export interface TutorAttemptTelemetry {
  activityId: string
  activityKind: TutorActivity['kind']
  correct: boolean
  score: number
  total: number
  hintsUsed: number
  revealed: boolean
  independent: boolean
  skillTag: string
  misconceptionTags: string[]
  phase: TutorPhase
  sessionId?: string
  turnId?: string
  responseSummary?: string
  coverage?: TutorUnderstandingCheck['coverage']
}
