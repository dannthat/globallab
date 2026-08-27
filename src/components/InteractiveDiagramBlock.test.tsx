// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { KnowledgeDiagram } from '../types'
import { InteractiveDiagramBlock } from './InteractiveDiagramBlock'
import {
  getSimulationRegistration,
  hasInteractiveSimulation,
} from './simulations'

const michaelisMentenDiagram: KnowledgeDiagram = {
  url: '/diagrams/biology/michaelis-menten.png',
  caption: 'Michaelis–Menten reaction velocity curve.',
  alt: 'Reaction velocity approaches a maximum as substrate increases.',
}

afterEach(cleanup)

describe('InteractiveDiagramBlock', () => {
  it('starts with the canonical diagram and switches to the registered lab', async () => {
    const user = userEvent.setup()

    render(
      <InteractiveDiagramBlock
        topicId="enzyme-kinetics"
        sectionId="enzyme-substrate"
        diagram={michaelisMentenDiagram}
        figureNumber="2.1"
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Static Diagram' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')
    expect(
      screen.getByRole('img', { name: michaelisMentenDiagram.alt }),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Interactive Lab' }))

    expect(
      screen.getByRole('button', { name: 'Interactive Lab' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')
    expect(
      screen.getByRole('heading', { name: 'Enzyme kinetics' }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('img', { name: michaelisMentenDiagram.alt }),
    ).toBeNull()
  })

  it('uses a verified fallback diagram for registered sections without one', () => {
    render(
      <InteractiveDiagramBlock
        topicId="wave-mechanics"
        sectionId="double-slit"
        figureNumber="4.1"
      />,
    )

    expect(
      screen.getByRole('img', {
        name: /wavefronts from two coherent sources/i,
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Interactive Lab' }),
    ).toBeTruthy()
  })

  it('leaves an unregistered canonical diagram unchanged', () => {
    render(
      <InteractiveDiagramBlock
        topicId="cellular-respiration"
        sectionId="glycolysis"
        diagram={michaelisMentenDiagram}
      />,
    )

    expect(
      screen.getByRole('img', { name: michaelisMentenDiagram.alt }),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Interactive Lab' })).toBeNull()
  })

  it('registers only the requested topic and section combinations', () => {
    const keys = [
      ['enzyme-kinetics', 'overview'],
      ['enzyme-kinetics', 'enzyme-substrate'],
      ['enzyme-kinetics', 'inhibition'],
      ['action-potential', 'overview'],
      ['action-potential', 'resting-potential'],
      ['action-potential', 'depolarization'],
      ['action-potential', 'repolarization'],
      ['wave-mechanics', 'overview'],
      ['wave-mechanics', 'double-slit'],
      ['thermodynamics', 'gibbs'],
    ] as const

    for (const [topicId, sectionId] of keys) {
      expect(hasInteractiveSimulation(topicId, sectionId)).toBe(true)
      expect(getSimulationRegistration(topicId, sectionId)?.Component).toBeTypeOf(
        'function',
      )
    }

    expect(hasInteractiveSimulation('chemical-kinetics', 'overview')).toBe(
      false,
    )
  })
})
