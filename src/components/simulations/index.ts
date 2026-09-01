import type { ComponentType } from 'react'
import type { KnowledgeDiagram } from '../../types'
import type { SimulationComponentProps } from '../../personalization/simulationProtocol'
import { ActionPotentialSim } from './ActionPotentialSim'
import { ChemicalEquilibriumSim } from './ChemicalEquilibriumSim'
import { EnzymeKineticsSim } from './EnzymeKineticsSim'
import { WaveInterferenceSim } from './WaveInterferenceSim'

export interface SimulationRegistration {
  simulationId: string
  label: string
  Component: ComponentType<SimulationComponentProps>
  initialControls: Record<string, string | number | boolean>
  initialOutputs: Record<string, string | number | boolean>
  fallbackDiagram?: KnowledgeDiagram
}

const actionPotentialDiagram: KnowledgeDiagram = {
  url: '/diagrams/biology/resting-membrane-potential.png',
  caption:
    'Voltage trace showing the resting potential, threshold, depolarization, repolarization, and refractory dip.',
  alt: 'Graph of membrane potential against time showing resting potential at negative 70 millivolts, threshold at negative 55 millivolts, a peak near positive 40 millivolts, repolarization, and a refractory dip.',
}

const doubleSlitDiagram: KnowledgeDiagram = {
  url: '/diagrams/physics/wave-interference.png',
  caption:
    'Two coherent sources produce alternating constructive and destructive interference fringes.',
  alt: 'Wavefronts from two coherent sources overlap to form alternating bands of constructive and destructive interference.',
}

export const simulationRegistry = {
  'enzyme-kinetics::overview': {
    simulationId: 'enzyme-kinetics::overview',
    label: 'Michaelis–Menten lab',
    Component: EnzymeKineticsSim,
    initialControls: { vmax: 70, km: 8, substrate: 16, competitive: false, nonCompetitive: false },
    initialOutputs: { velocity: 46.7, effectiveKm: 8, effectiveVmax: 70 },
  },
  'enzyme-kinetics::enzyme-substrate': {
    simulationId: 'enzyme-kinetics::enzyme-substrate',
    label: 'Michaelis–Menten lab',
    Component: EnzymeKineticsSim,
    initialControls: { vmax: 70, km: 8, substrate: 16, competitive: false, nonCompetitive: false },
    initialOutputs: { velocity: 46.7, effectiveKm: 8, effectiveVmax: 70 },
  },
  'enzyme-kinetics::inhibition': {
    simulationId: 'enzyme-kinetics::inhibition',
    label: 'Enzyme inhibition lab',
    Component: EnzymeKineticsSim,
    initialControls: { vmax: 70, km: 8, substrate: 16, competitive: false, nonCompetitive: false },
    initialOutputs: { velocity: 46.7, effectiveKm: 8, effectiveVmax: 70 },
  },
  'action-potential::overview': {
    simulationId: 'action-potential::overview',
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
    initialControls: { stimulus: -50 },
    initialOutputs: { triggered: true, phase: 'Resting restored', voltage: -70 },
  },
  'action-potential::resting-potential': {
    simulationId: 'action-potential::resting-potential',
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
    initialControls: { stimulus: -50 },
    initialOutputs: { triggered: true, phase: 'Resting restored', voltage: -70 },
  },
  'action-potential::depolarization': {
    simulationId: 'action-potential::depolarization',
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
    initialControls: { stimulus: -50 },
    initialOutputs: { triggered: true, phase: 'Resting restored', voltage: -70 },
    fallbackDiagram: actionPotentialDiagram,
  },
  'action-potential::repolarization': {
    simulationId: 'action-potential::repolarization',
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
    initialControls: { stimulus: -50 },
    initialOutputs: { triggered: true, phase: 'Resting restored', voltage: -70 },
    fallbackDiagram: actionPotentialDiagram,
  },
  'wave-mechanics::overview': {
    simulationId: 'wave-mechanics::overview',
    label: 'Double-slit wave lab',
    Component: WaveInterferenceSim,
    initialControls: { wavelength: 540, slitSeparation: 0.5, screenDistance: 2.5 },
    initialOutputs: { fringeSpacingMillimetres: 2.7 },
  },
  'wave-mechanics::double-slit': {
    simulationId: 'wave-mechanics::double-slit',
    label: 'Double-slit wave lab',
    Component: WaveInterferenceSim,
    initialControls: { wavelength: 540, slitSeparation: 0.5, screenDistance: 2.5 },
    initialOutputs: { fringeSpacingMillimetres: 2.7 },
    fallbackDiagram: doubleSlitDiagram,
  },
  'thermodynamics::gibbs': {
    simulationId: 'thermodynamics::gibbs',
    label: 'Chemical equilibrium reactor',
    Component: ChemicalEquilibriumSim,
    initialControls: { increasedPressure: false, increasedTemperature: false, addedReactant: false },
    initialOutputs: { shift: 'No net predicted shift', productPercent: 45, reactantPercent: 55 },
  },
} satisfies Record<string, SimulationRegistration>

export type SimulationRegistryKey = keyof typeof simulationRegistry

export function simulationKey(topicId: string, sectionId: string) {
  return `${topicId}::${sectionId}`
}

export function getSimulationRegistration(
  topicId: string,
  sectionId: string,
): SimulationRegistration | null {
  const key = simulationKey(topicId, sectionId)
  return key in simulationRegistry
    ? simulationRegistry[key as SimulationRegistryKey]
    : null
}

export function hasInteractiveSimulation(topicId: string, sectionId: string) {
  return getSimulationRegistration(topicId, sectionId) !== null
}

export {
  ActionPotentialSim,
  ChemicalEquilibriumSim,
  EnzymeKineticsSim,
  WaveInterferenceSim,
}
