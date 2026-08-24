import type { Subject } from '../types'
import { actionPotential } from './biology/action-potential'
import { cellMembrane } from './biology/cell-membrane'
import { cellularRespiration } from './biology/cellular-respiration'
import { dnaExpression } from './biology/dna-expression'
import { enzymeKinetics } from './biology/enzyme-kinetics'

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
    topics: [],
    comingSoon: true,
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    description: 'Matter, reactions, and molecular interactions',
    color: 'amber',
    topics: [],
    comingSoon: true,
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'Calculus, algebra, statistics, and abstract reasoning',
    color: 'violet',
    topics: [],
    comingSoon: true,
  },
]
