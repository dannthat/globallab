import type {
  TutorAction,
  TutorSimulationSnapshot,
} from './tutorTypes'

export const SIMULATION_STATE_EVENT = 'gl:simulation-state'
export const SIMULATION_ACTION_EVENT = 'gl:simulation-action'

export type TutorSimulationAction = Extract<
  TutorAction,
  { type: 'open-simulation' | 'set-simulation-control' }
>

export interface SimulationComponentProps {
  simulationId?: string
  topicId?: string
  sectionId?: string
}

export function publishSimulationState(snapshot: TutorSimulationSnapshot) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<TutorSimulationSnapshot>(SIMULATION_STATE_EVENT, {
      detail: snapshot,
    }),
  )
}

export function dispatchTutorSimulationAction(action: TutorSimulationAction) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<TutorSimulationAction>(SIMULATION_ACTION_EVENT, {
      detail: action,
    }),
  )
}

export function subscribeToTutorSimulationActions(
  simulationId: string,
  handler: (action: TutorSimulationAction) => void,
) {
  if (typeof window === 'undefined') return () => undefined
  const listener = (event: Event) => {
    const action = (event as CustomEvent<TutorSimulationAction>).detail
    if (!action || action.simulationId !== simulationId) return
    handler(action)
  }
  window.addEventListener(SIMULATION_ACTION_EVENT, listener)
  return () => window.removeEventListener(SIMULATION_ACTION_EVENT, listener)
}

export function executeTutorActions(actions: TutorAction[]) {
  actions.forEach((action) => {
    if (action.type === 'open-simulation' || action.type === 'set-simulation-control') {
      dispatchTutorSimulationAction(action)
    }
    if (action.type === 'schedule-review' && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gl:tutor-review-requested', { detail: action }),
      )
    }
  })
}
