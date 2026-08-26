// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SourceAnchor } from '../personalization/types'
import {
  LearningCompanion,
  type LearningCompanionQuiz,
} from './LearningCompanion'

const sourceAnchor: SourceAnchor = {
  sourceId: 'cellular-respiration',
  sourceKind: 'global-lab',
  sourceTitle: 'Cellular Respiration & ATP Synthesis',
  anchorId: 'krebs-cycle',
  anchorLabel: 'Stage 2 — The Krebs Cycle',
  page: 6,
  lineRange: { start: 14, end: 22 },
  url: 'https://example.test/cellular-respiration',
  license: 'Public domain',
  sourceRevision: 'v1',
}

function defaultProps() {
  return {
    sourceAnchor,
    interest: 'basketball',
    mode: 'analogy' as const,
    title: 'See this mechanism through basketball',
    content: 'NADH carries energy like a player moving the ball toward a scoring play.',
    limits: 'A cell has no coach or intent.',
    onAction: vi.fn(),
    onOutcome: vi.fn(),
    onSelectQuizOption: vi.fn(),
    onSubmitQuiz: vi.fn(),
    onRevealQuiz: vi.fn(),
    onRetry: vi.fn(),
    onDismiss: vi.fn(),
  }
}

afterEach(cleanup)

describe('LearningCompanion', () => {
  it('keeps help separate and names its immutable source anchor', () => {
    const props = defaultProps()
    render(<LearningCompanion {...props} />)

    const companion = screen.getByRole('complementary', {
      name: props.title,
    })

    expect(within(companion).getAllByText('Analogy')).toHaveLength(2)
    expect(within(companion).getByText(/Lens: basketball/)).toBeTruthy()
    expect(within(companion).getByText(props.content)).toBeTruthy()
    expect(within(companion).getByText(/A cell has no coach or intent/)).toBeTruthy()
    expect(within(companion).getByText(/Original unchanged/)).toBeTruthy()
    expect(within(companion).getByText(/According to/)).toBeTruthy()
    expect(
      within(companion).getByRole('link', {
        name: 'Cellular Respiration & ATP Synthesis',
      }),
    ).toHaveProperty('href', 'https://example.test/cellular-respiration')
    expect(within(companion).getByText(/Stage 2 — The Krebs Cycle/)).toBeTruthy()
    expect(within(companion).getByText(/page 6/)).toBeTruthy()
    expect(within(companion).getByText(/lines 14–22/)).toBeTruthy()
  })

  it('labels student uploads without implying an outside authority', () => {
    const props = defaultProps()
    render(
      <LearningCompanion
        {...props}
        sourceAnchor={{
          ...props.sourceAnchor,
          sourceKind: 'upload',
          sourceTitle: 'My lecture notes.pdf',
          url: undefined,
        }}
      />,
    )

    expect(screen.getByText(/From your uploaded source:/)).toBeTruthy()
    expect(screen.queryByText(/According to/)).toBeNull()
  })

  it('offers every refinement and reports outcomes through callbacks', async () => {
    const user = userEvent.setup()
    const props = defaultProps()
    render(<LearningCompanion {...props} />)

    for (const [label, mode] of [
      ['Simpler', 'simpler'],
      ['More detailed', 'more-detailed'],
      ['Step by step', 'step-by-step'],
      ['Another example', 'another-example'],
      ['Test me', 'test-me'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(props.onAction).toHaveBeenLastCalledWith(mode)
    }

    await user.click(screen.getByRole('button', { name: 'Helped' }))
    expect(props.onOutcome).toHaveBeenLastCalledWith('successful')

    await user.click(screen.getByRole('button', { name: 'Not yet' }))
    expect(props.onOutcome).toHaveBeenLastCalledWith('needs-review')

    await user.click(screen.getByRole('button', { name: 'Dismiss learning companion' }))
    expect(props.onDismiss).toHaveBeenCalledOnce()
  })

  it('offers a direct return to the selected interest lens', async () => {
    const user = userEvent.setup()
    const props = defaultProps()
    render(<LearningCompanion {...props} mode='simpler' />)

    await user.click(
      screen.getByRole('button', { name: 'Back to basketball lens' }),
    )
    expect(props.onAction).toHaveBeenCalledWith('analogy')
  })

  it('announces loading and errors, disables refinements, and retries', async () => {
    const user = userEvent.setup()
    const loadingProps = defaultProps()
    const { rerender } = render(
      <LearningCompanion {...loadingProps} content={null} isLoading />,
    )

    expect(screen.getByRole('status').textContent).toContain('Creating personalized help')
    expect(screen.getByRole('complementary').getAttribute('aria-busy')).toBe('true')
    expect(
      (screen.getByRole('button', { name: 'Simpler' }) as HTMLButtonElement).disabled,
    ).toBe(true)

    const errorProps = defaultProps()
    rerender(
      <LearningCompanion
        {...errorProps}
        content={null}
        error="The service is taking longer than expected."
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'The service is taking longer than expected.',
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(errorProps.onRetry).toHaveBeenCalledOnce()
  })

  it('uses a controlled semantic quiz with select, submit, and reveal callbacks', async () => {
    const user = userEvent.setup()
    const props = defaultProps()
    const quiz: LearningCompanionQuiz = {
      question: 'Where does the Krebs cycle occur?',
      options: [
        { id: 'cytoplasm', label: 'Cytoplasm' },
        { id: 'matrix', label: 'Mitochondrial matrix' },
      ],
      selectedOptionId: 'matrix',
      correctOptionId: 'matrix',
      feedback: 'The mitochondrial matrix is correct.',
      revealed: true,
      outcome: { score: 1, total: 1, ratio: 1 },
    }

    render(<LearningCompanion {...props} mode="test-me" quiz={quiz} />)

    const group = screen.getByRole('group', { name: quiz.question })
    const cytoplasm = within(group).getByRole('radio', { name: 'Cytoplasm' })
    const matrix = within(group).getByRole('radio', {
      name: /Mitochondrial matrix.*correct answer/,
    })

    expect((matrix as HTMLInputElement).checked).toBe(true)
    await user.click(cytoplasm)
    expect(props.onSelectQuizOption).toHaveBeenCalledWith('cytoplasm')

    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    expect(props.onSubmitQuiz).toHaveBeenCalledWith('matrix')
    expect(screen.getByRole('status').textContent).toContain('Score: 1 of 1')
    expect(
      (screen.getByRole('button', { name: 'Reveal answer' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('invokes reveal without selecting or submitting an answer', async () => {
    const user = userEvent.setup()
    const props = defaultProps()
    const quiz: LearningCompanionQuiz = {
      question: 'Which molecule carries usable cellular energy?',
      options: [
        { id: 'atp', label: 'ATP' },
        { id: 'water', label: 'Water' },
      ],
    }

    render(<LearningCompanion {...props} mode="test-me" quiz={quiz} />)

    expect(
      (screen.getByRole('button', { name: 'Submit answer' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))
    expect(props.onRevealQuiz).toHaveBeenCalledOnce()
    expect(props.onSubmitQuiz).not.toHaveBeenCalled()
  })
})
