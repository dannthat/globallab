import type { Subject } from '../types'
import { actionPotential } from './biology/action-potential'
import { cellMembrane } from './biology/cell-membrane'
import { cellularRespiration } from './biology/cellular-respiration'
import { dnaExpression } from './biology/dna-expression'
import { enzymeKinetics } from './biology/enzyme-kinetics'
import {
  atomicStructure,
  chemicalBonding,
  chemicalKinetics,
  electrochemistry,
  thermodynamics,
} from './chemistry'
import {
  differentiation,
  differentialEquations,
  integration,
  linearAlgebra,
  statisticsProbability,
} from './mathematics'
import {
  electricFields,
  electromagneticInduction,
  quantumMechanics,
  specialRelativity,
  waveMechanics,
} from './physics'

export const subjects: Subject[] = [
  {
    id: 'biology',
    title: 'Biology',
    description: 'Life processes, cells, genetics, and organisms',
    color: 'emerald',
    topics: [cellularRespiration, cellMembrane, dnaExpression, actionPotential, enzymeKinetics],
  },
  {
    id: 'physics',
    title: 'Physics',
    description: 'Forces, energy, waves, and the physical world',
    color: 'blue',
    topics: [
      waveMechanics,
      electricFields,
      electromagneticInduction,
      quantumMechanics,
      specialRelativity,
    ],
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    description: 'Matter, reactions, and molecular interactions',
    color: 'violet',
    topics: [
      atomicStructure,
      chemicalBonding,
      thermodynamics,
      electrochemistry,
      chemicalKinetics,
    ],
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'Calculus, algebra, statistics, and abstract reasoning',
    color: 'amber',
    topics: [
      differentiation,
      integration,
      differentialEquations,
      linearAlgebra,
      statisticsProbability,
    ],
  },
]
