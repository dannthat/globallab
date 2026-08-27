import type { ComponentType } from 'react'
import type { KnowledgeDiagram } from '../../types'
import { ActionPotentialSim } from './ActionPotentialSim'
import { ChemicalEquilibriumSim } from './ChemicalEquilibriumSim'
import { EnzymeKineticsSim } from './EnzymeKineticsSim'
import { WaveInterferenceSim } from './WaveInterferenceSim'

export interface SimulationRegistration {
  label: string
  Component: ComponentType
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
    label: 'Michaelis–Menten lab',
    Component: EnzymeKineticsSim,
  },
  'enzyme-kinetics::enzyme-substrate': {
    label: 'Michaelis–Menten lab',
    Component: EnzymeKineticsSim,
  },
  'enzyme-kinetics::inhibition': {
    label: 'Enzyme inhibition lab',
    Component: EnzymeKineticsSim,
  },
  'action-potential::overview': {
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
  },
  'action-potential::resting-potential': {
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
  },
  'action-potential::depolarization': {
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
    fallbackDiagram: actionPotentialDiagram,
  },
  'action-potential::repolarization': {
    label: 'Action potential simulator',
    Component: ActionPotentialSim,
    fallbackDiagram: actionPotentialDiagram,
  },
  'wave-mechanics::overview': {
    label: 'Double-slit wave lab',
    Component: WaveInterferenceSim,
  },
  'wave-mechanics::double-slit': {
    label: 'Double-slit wave lab',
    Component: WaveInterferenceSim,
    fallbackDiagram: doubleSlitDiagram,
  },
  'thermodynamics::gibbs': {
    label: 'Chemical equilibrium reactor',
    Component: ChemicalEquilibriumSim,
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
