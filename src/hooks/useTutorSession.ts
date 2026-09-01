import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createTutorMachineState,
  gradeTutorActivity,
  reduceTutorMachine,
} from '../personalization/tutorMachine'
import { executeTutorActions } from '../personalization/simulationProtocol'
import type {
  TutorActivity,
  TutorActivityGrade,
  TutorActivityResponse,
  TutorAttemptTelemetry,
  TutorContext,
  TutorIntent,
  TutorLearningMode,
  TutorMachineState,
  TutorMessage,
  TutorTurn,
  TutorUnderstandingCheck,
} from '../personalization/tutorTypes'
import { createTutorTurn } from '../services/tutorService'

export interface TutorSeedArtifact {
  id: string
  title: string
  content: string
  limitations?: string
  provider: 'preset' | 'gemini' | 'local'
  model?: string
  quiz?: {
    question: string
    options: readonly string[]
    correctIndex: number
    explanation: string
    evidence: string
  }
}

interface UseTutorSessionOptions {
  context: TutorContext | null
  seed?: TutorSeedArtifact | null
  onAttempt?: (attempt: TutorAttemptTelemetry) => void
  onHint?: (phase: TutorMachineState['phase'], revealed: boolean) => void
  onIntent?: (intent: TutorIntent) => void
  onTeachKojiCheck?: (
    check: TutorUnderstandingCheck,
    turn: TutorTurn,
  ) => void
  onPredictionCycleComplete?: (
    cycle: TutorMachineState['predictionCycle'],
  ) => void
}

function nowIso() {
  return new Date().toISOString()
}

function seedMessages(
  context: TutorContext | null,
  seed?: TutorSeedArtifact | null,
): TutorMessage[] {
  if (!context || !seed) return []
  const limits = seed.limitations?.trim()
  return [
    {
      id: `${seed.id}::opening`,
      role: 'tutor',
      text: `${seed.content}${limits ? `\n\nWhere this help stops: ${limits}` : ''}\n\nBefore I add more: what part feels least clear?`,
      phase: 'diagnose',
      intent: 'start',
      createdAt: nowIso(),
    },
  ]
}

function seedActivity(
  context: TutorContext | null,
  seed?: TutorSeedArtifact | null,
): TutorActivity | null {
  if (!context || !seed?.quiz || seed.quiz.options.length < 2) return null
  const options = seed.quiz.options.map((label, index) => ({
    id: String(index),
    label,
  }))
  if (!options[seed.quiz.correctIndex]) return null
  return {
    id: `${seed.id}::quiz`,
    kind: 'multiple-choice',
    prompt: seed.quiz.question,
    options,
    correctOptionId: String(seed.quiz.correctIndex),
    explanation: seed.quiz.explanation,
    evidence: seed.quiz.evidence,
    skillTag: 'source-comprehension',
    misconceptionTags: ['source-comprehension-gap'],
  }
}

function answerSummary(activity: TutorActivity, response: TutorActivityResponse) {
  if (typeof response === 'string') {
    if (activity.kind === 'multiple-choice' || activity.kind === 'simulation-prediction') {
      return activity.options.find(({ id }) => id === response)?.label ?? response
    }
    return response
  }
  if (Array.isArray(response)) return response.join(' -> ')
  return Object.entries(response)
    .map(([left, right]) => `${left}: ${right}`)
    .join(', ')
}

const MAX_SESSION_MESSAGES = 30

export function useTutorSession({
  context,
  seed = null,
  onAttempt,
  onHint,
  onIntent,
  onTeachKojiCheck,
  onPredictionCycleComplete,
}: UseTutorSessionOptions) {
  const [machine, setMachine] = useState<TutorMachineState>(createTutorMachineState)
  const [messages, setMessages] = useState<TutorMessage[]>(() =>
    seedMessages(context, seed),
  )
  const [activeActivity, setActiveActivity] = useState<TutorActivity | null>(() =>
    seedActivity(context, seed),
  )
  const [activityGrade, setActivityGrade] = useState<TutorActivityGrade | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTurn, setLastTurn] = useState<TutorTurn | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const sessionKey = `${context?.sessionId ?? 'none'}::${seed?.id ?? 'no-seed'}`
  const resetInputRef = useRef({ context, seed })

  useEffect(() => {
    resetInputRef.current = { context, seed }
  }, [context, seed])

  useEffect(() => {
    controllerRef.current?.abort()
    const nextInput = resetInputRef.current
    // oxlint-disable-next-line react/set-state-in-effect -- A source/seed change is a new bounded tutor session.
    setMachine(createTutorMachineState())
    setMessages(seedMessages(nextInput.context, nextInput.seed))
    setActiveActivity(seedActivity(nextInput.context, nextInput.seed))
    setActivityGrade(null)
    setError(null)
    setLastTurn(null)
    setIsLoading(false)
  }, [sessionKey])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const appendMessages = useCallback((next: TutorMessage[]) => {
    setMessages((current) => [...current, ...next].slice(-MAX_SESSION_MESSAGES))
  }, [])

  const applyTurn = useCallback(
    (turn: TutorTurn, requestMachine: TutorMachineState) => {
      let nextMachine = reduceTutorMachine(requestMachine, {
        type: 'turn-received',
        requestedIntent: turn.intent,
        proposedPhase: turn.phase,
      })
      if (turn.understandingCheck) {
        nextMachine = reduceTutorMachine(nextMachine, {
          type: 'teach-koji-evaluated',
          check: turn.understandingCheck,
        })
        onTeachKojiCheck?.(turn.understandingCheck, turn)
      }
      if (turn.hypotheticalWorld) {
        nextMachine = reduceTutorMachine(nextMachine, {
          type: 'hypothetical-created',
          world: turn.hypotheticalWorld,
        })
      }
      setMachine(nextMachine)
      setLastTurn(turn)
      appendMessages([
        {
          id: turn.id,
          role: 'tutor',
          text: turn.message,
          phase: nextMachine.phase,
          intent: turn.intent,
          createdAt: turn.createdAt,
        },
      ])
      const activityAction = turn.actions.find(
        (action): action is Extract<typeof action, { type: 'present-activity' }> =>
          action.type === 'present-activity',
      )
      if (activityAction) {
        setActiveActivity(activityAction.activity)
        setActivityGrade(null)
      }
      executeTutorActions(turn.actions)
    },
    [appendMessages, onTeachKojiCheck],
  )

  const send = useCallback(
    async (
      intent: TutorIntent,
      userText?: string,
      machineOverride?: TutorMachineState,
    ) => {
      if (!context || isLoading) return
      const trimmed = userText?.trim()
      if (intent === 'ask' && !trimmed) return
      if (!['ask', 'continue', 'start', 'transfer'].includes(intent)) {
        onIntent?.(intent)
      }

      let requestMachine = machineOverride ?? machine
      if (intent === 'hint') {
        requestMachine = reduceTutorMachine(requestMachine, { type: 'hint-requested' })
        onHint?.(requestMachine.phase, false)
      } else if (intent === 'transfer') {
        requestMachine = reduceTutorMachine(requestMachine, { type: 'transfer-requested' })
      }
      setMachine(requestMachine)

      const studentMessage: TutorMessage | null =
        trimmed || intent !== 'ask'
          ? {
              id: `${context.sessionId}::student::${Date.now().toString(36)}`,
              role: 'student',
              text: trimmed || intent.replaceAll('-', ' '),
              phase: requestMachine.phase,
              intent,
              createdAt: nowIso(),
            }
          : null
      const requestMessages = studentMessage
        ? [...messages, studentMessage]
        : messages
      if (studentMessage) appendMessages([studentMessage])

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setIsLoading(true)
      setError(null)
      try {
        const turn = await createTutorTurn({
          context,
          machine: requestMachine,
          messages: requestMessages,
          intent,
          userText: trimmed,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) applyTurn(turn, requestMachine)
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'Koji could not answer. Try again.')
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setIsLoading(false)
        }
      }
    },
    [
      applyTurn,
      appendMessages,
      context,
      isLoading,
      machine,
      messages,
      onHint,
      onIntent,
    ],
  )

  const submitActivity = useCallback(
    async (response: TutorActivityResponse) => {
      if (!context || !activeActivity || isLoading) return
      const grade = gradeTutorActivity(activeActivity, response)
      const independent = machine.hintCount === 0 && machine.revealCount === 0
      let requestMachine = reduceTutorMachine(machine, {
        type: 'activity-submitted',
        correct: grade.correct,
        independent,
      })
      if (
        machine.learningMode === 'prediction-cycle' &&
        activeActivity.kind === 'simulation-prediction' &&
        context.simulation
      ) {
        requestMachine = reduceTutorMachine(requestMachine, {
          type: 'prediction-recorded',
          prediction: answerSummary(activeActivity, response),
          baseline: context.simulation,
        })
      }
      setMachine(requestMachine)
      setActivityGrade(grade)
      onAttempt?.({
        activityId: activeActivity.id,
        activityKind: activeActivity.kind,
        correct: grade.correct,
        score: grade.score,
        total: grade.total,
        hintsUsed: machine.hintCount,
        revealed: machine.revealCount > 0,
        independent,
        skillTag: grade.skillTag,
        misconceptionTags: grade.misconceptionTags,
        phase: machine.phase,
        sessionId: context.sessionId,
        turnId: lastTurn?.id,
        responseSummary: answerSummary(activeActivity, response).slice(0, 500),
        coverage: lastTurn?.understandingCheck?.coverage,
      })

      const attemptMessages: TutorMessage[] = [
        {
          id: `${context.sessionId}::answer::${Date.now().toString(36)}`,
          role: 'student',
          text: answerSummary(activeActivity, response),
          phase: machine.phase,
          createdAt: nowIso(),
        },
        {
          id: `${context.sessionId}::grade::${Date.now().toString(36)}`,
          role: 'tutor',
          text: grade.feedback,
          phase: requestMachine.phase,
          intent: 'continue',
          createdAt: nowIso(),
        },
      ]
      const requestMessages = [...messages, ...attemptMessages]
      appendMessages(attemptMessages)

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setIsLoading(true)
      setError(null)
      try {
        const turn = await createTutorTurn({
          context,
          machine: requestMachine,
          messages: requestMessages,
          intent: requestMachine.phase === 'transfer' ? 'transfer' : 'continue',
          activityResult: grade,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) applyTurn(turn, requestMachine)
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'Koji could not continue. Try again.')
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setIsLoading(false)
        }
      }
    },
    [
      activeActivity,
      applyTurn,
      appendMessages,
      context,
      isLoading,
      lastTurn,
      machine,
      messages,
      onAttempt,
    ],
  )

  const revealActivity = useCallback(() => {
    if (!activeActivity || activityGrade) return
    const next = reduceTutorMachine(machine, { type: 'answer-revealed' })
    setMachine(next)
    setActivityGrade({
      correct: false,
      score: 0,
      total: 1,
      feedback: activeActivity.explanation,
      evidence: activeActivity.evidence,
      skillTag: activeActivity.skillTag,
      misconceptionTags: activeActivity.misconceptionTags,
    })
    onHint?.(next.phase, true)
  }, [activeActivity, activityGrade, machine, onHint])

  const selectMode = useCallback(
    (mode: TutorLearningMode) => {
      if (!context || isLoading) return
      const next = reduceTutorMachine(machine, { type: 'mode-selected', mode })
      setMachine(next)
      setActiveActivity(null)
      setActivityGrade(null)
      setError(null)
      const intent: TutorIntent =
        mode === 'guided'
          ? 'start'
          : mode === 'teach-koji'
            ? 'teach-koji'
            : mode === 'misconception-world'
              ? 'misconception-world'
              : mode === 'prediction-cycle'
                ? 'prediction-cycle'
                : 'cross-source'
      void send(intent, undefined, next)
    },
    [context, isLoading, machine, send],
  )

  const submitTeachExplanation = useCallback(
    (explanation: string) => {
      if (machine.learningMode !== 'teach-koji') return
      void send('ask', explanation)
    },
    [machine.learningMode, send],
  )

  const simulation = context?.simulation

  const submitHypotheticalPrediction = useCallback((prediction: string) => {
    const value = prediction.trim()
    if (!value) return
    setMachine((current) =>
      reduceTutorMachine(current, {
        type: 'hypothetical-predicted',
        prediction: value,
      }),
    )
  }, [])

  const inspectHypothetical = useCallback(() => {
    setMachine((current) =>
      reduceTutorMachine(current, { type: 'hypothetical-inspected' }),
    )
  }, [])

  const submitFailureExplanation = useCallback((explanation: string) => {
    const value = explanation.trim()
    if (!value) return
    setMachine((current) =>
      reduceTutorMachine(current, {
        type: 'hypothetical-failure-explained',
        explanation: value,
      }),
    )
  }, [])

  const submitReconstruction = useCallback((reconstruction: string) => {
    const value = reconstruction.trim()
    if (!value) return
    setMachine((current) =>
      reduceTutorMachine(current, {
        type: 'hypothetical-reconstructed',
        reconstruction: value,
      }),
    )
  }, [])

  const recordPrediction = useCallback(
    (prediction: string) => {
      const value = prediction.trim()
      if (!value || !simulation) return
      setMachine((current) =>
        reduceTutorMachine(current, {
          type: 'prediction-recorded',
          prediction: value,
          baseline: simulation,
        }),
      )
    },
    [simulation],
  )

  const markSimulationActed = useCallback(() => {
    const baseline = machine.predictionCycle.baseline
    if (
      machine.learningMode !== 'prediction-cycle' ||
      machine.predictionCycle.stage !== 'act' ||
      !baseline ||
      !simulation ||
      baseline.simulationId !== simulation.simulationId
    ) return
    const controlIds = new Set([
      ...Object.keys(baseline.controls),
      ...Object.keys(simulation.controls),
    ])
    const changedControls = [...controlIds].filter(
      (controlId) =>
        baseline.controls[controlId] !== simulation.controls[controlId],
    )
    if (changedControls.length === 0) {
      setError('Change one control in the connected lab before continuing.')
      return
    }
    if (changedControls.length > 1) {
      setError('For this cycle, compare one changed control at a time.')
      return
    }
    setError(null)
    setMachine(reduceTutorMachine(machine, { type: 'simulation-acted' }))
  }, [machine, simulation])

  const captureObservation = useCallback(() => {
    if (
      !simulation ||
      machine.learningMode !== 'prediction-cycle' ||
      machine.predictionCycle.stage !== 'observe'
    ) return
    setError(null)
    setMachine(
      reduceTutorMachine(machine, {
        type: 'observation-recorded',
        observation: simulation,
      }),
    )
  }, [machine, simulation])

  const submitPredictionRevision = useCallback(
    (revision: string, accurate: boolean) => {
      const value = revision.trim()
      if (!value) return
      setMachine((current) => {
        const next = reduceTutorMachine(current, {
          type: 'prediction-revised',
          revision: value,
          accurate,
        })
        onPredictionCycleComplete?.(next.predictionCycle)
        return next
      })
    },
    [onPredictionCycleComplete],
  )

  const retry = useCallback(() => {
    const lastStudent = [...messages].reverse().find((message) => message.role === 'student')
    void send(lastStudent?.intent ?? 'continue', lastStudent?.intent === 'ask' ? lastStudent.text : undefined)
  }, [messages, send])

  return useMemo(
    () => ({
      machine,
      messages,
      activeActivity,
      activityGrade,
      isLoading,
      error,
      lastTurn,
      send,
      selectMode,
      submitTeachExplanation,
      submitHypotheticalPrediction,
      inspectHypothetical,
      submitFailureExplanation,
      submitReconstruction,
      recordPrediction,
      markSimulationActed,
      captureObservation,
      submitPredictionRevision,
      submitActivity,
      revealActivity,
      retry,
      clearActivity: () => {
        setActiveActivity(null)
        setActivityGrade(null)
      },
    }),
    [
      activeActivity,
      activityGrade,
      error,
      isLoading,
      lastTurn,
      machine,
      messages,
      retry,
      selectMode,
      submitTeachExplanation,
      submitHypotheticalPrediction,
      inspectHypothetical,
      submitFailureExplanation,
      submitReconstruction,
      recordPrediction,
      markSimulationActed,
      captureObservation,
      submitPredictionRevision,
      revealActivity,
      send,
      submitActivity,
    ],
  )
}

export type TutorSessionController = ReturnType<typeof useTutorSession>
