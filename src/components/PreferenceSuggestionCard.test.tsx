// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PreferenceSuggestion } from '../personalization/types'
import { PreferenceSuggestionCard } from './PreferenceSuggestionCard'

const suggestion: PreferenceSuggestion = {
  id: 'suggestion-detail-simpler',
  signal: { dimension: 'detail', value: 'simpler' },
  reason: 'You chose shorter explanations in several different sections.',
  proposedValueLabel: 'Start future explanations with a shorter version',
  evidenceCount: 4,
  distinctAnchorCount: 3,
  successfulOutcomeCount: 2,
  evidenceIds: ['e1', 'e2', 'e3', 'e4'],
  status: 'pending',
  createdAt: '2026-08-26T00:00:00.000Z',
}

afterEach(cleanup)

describe('PreferenceSuggestionCard', () => {
  it('explains the optional suggestion and never applies it on render', () => {
    const onApply = vi.fn()
    const onNotNow = vi.fn()
    const onNeverSuggest = vi.fn()

    render(
      <PreferenceSuggestionCard
        suggestion={suggestion}
        onApply={onApply}
        onNotNow={onNotNow}
        onNeverSuggest={onNeverSuggest}
      />,
    )

    expect(
      screen.getByRole('complementary', {
        name: 'Would you like us to remember this?',
      }),
    ).toBeTruthy()
    expect(screen.getByText(suggestion.reason)).toBeTruthy()
    expect(screen.getByText(suggestion.proposedValueLabel)).toBeTruthy()
    expect(screen.getByText(/4 interactions across 3 source locations/)).toBeTruthy()
    expect(screen.getByText(/2 successful checks/)).toBeTruthy()
    expect(screen.getByText(/not a judgment/)).toBeTruthy()
    expect(screen.getByText(/Nothing changes unless you apply it/)).toBeTruthy()
    expect(onApply).not.toHaveBeenCalled()
    expect(onNotNow).not.toHaveBeenCalled()
    expect(onNeverSuggest).not.toHaveBeenCalled()
  })

  it('requires an explicit Apply, Not now, or Don’t suggest this action', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onNotNow = vi.fn()
    const onNeverSuggest = vi.fn()

    render(
      <PreferenceSuggestionCard
        suggestion={suggestion}
        onApply={onApply}
        onNotNow={onNotNow}
        onNeverSuggest={onNeverSuggest}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(suggestion)

    await user.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onNotNow).toHaveBeenCalledWith(suggestion)

    await user.click(screen.getByRole('button', { name: 'Don’t suggest this' }))
    expect(onNeverSuggest).toHaveBeenCalledWith(suggestion)
  })

  it('prevents repeated decisions after a suggestion is no longer pending', () => {
    render(
      <PreferenceSuggestionCard
        suggestion={{ ...suggestion, status: 'accepted' }}
        onApply={vi.fn()}
        onNotNow={vi.fn()}
        onNeverSuggest={vi.fn()}
      />,
    )

    expect(
      (screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Not now' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', {
        name: 'Don’t suggest this',
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByRole('status').textContent).toContain(
      'This suggestion has already been answered.',
    )
  })
})
