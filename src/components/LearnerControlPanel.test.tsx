// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MasteryRecord } from '../personalization/types'
import { LearnerControlPanel } from './LearnerControlPanel'

const dueReview: MasteryRecord = {
  anchorKey: 'upload::book::v1::page-2',
  anchor: {
    sourceId: 'book',
    sourceKind: 'upload',
    sourceTitle: 'Biology notes',
    anchorId: 'page-2',
    anchorLabel: 'Page 2',
    page: 2,
    sourceFingerprint: 'v1',
  },
  repetitions: 0,
  successfulReviews: 0,
  lapses: 1,
  easeFactor: 2.3,
  intervalDays: 1,
  lastRating: 1,
  lastReviewedAt: '2026-08-24T00:00:00.000Z',
  nextReviewAt: '2026-08-25T00:00:00.000Z',
}

function props() {
  return {
    approvedPresentation: {
      detail: {
        value: 'simpler' as const,
        origin: 'explicit' as const,
        approvedAt: '2026-08-26T00:00:00.000Z',
      },
    },
    dueReviews: [dueReview],
    evidenceCount: 7,
    onSetPreference: vi.fn(),
    onClearPreference: vi.fn(),
    onExport: vi.fn(() => '{"version":1}'),
    onReset: vi.fn(),
    onOpenReview: vi.fn(),
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('LearnerControlPanel', () => {
  it('explains memory, exposes due reviews, and lets the student edit or revoke preferences', async () => {
    const user = userEvent.setup()
    const current = props()
    render(<LearnerControlPanel {...current} />)

    await user.click(screen.getByRole('button', { name: /Learning settings/ }))
    expect(screen.getByRole('dialog').textContent).toContain('not a diagnosis')
    expect(screen.getByText('Biology notes')).toBeTruthy()
    expect(screen.getByText(/7 learning interactions/)).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Explanation structure'), 'steps')
    expect(current.onSetPreference).toHaveBeenCalledWith({
      dimension: 'structure',
      value: 'steps',
    })

    await user.selectOptions(screen.getAllByRole('combobox')[0], '')
    expect(current.onClearPreference).toHaveBeenCalledWith('detail')

    await user.click(screen.getByRole('button', { name: 'Open source' }))
    expect(current.onOpenReview).toHaveBeenCalledWith(dueReview.anchor)
  })

  it('requires confirmation before deleting learning data', async () => {
    const user = userEvent.setup()
    const current = props()
    render(<LearnerControlPanel {...current} />)

    await user.click(screen.getByRole('button', { name: /Learning settings/ }))
    await user.click(screen.getByRole('button', { name: 'Delete learning data' }))
    expect(current.onReset).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(current.onReset).toHaveBeenCalledOnce()
  })

  it('exports a local copy of the learner model', async () => {
    const user = userEvent.setup()
    const current = props()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:learning-data'),
      revokeObjectURL: vi.fn(),
    })

    render(<LearnerControlPanel {...current} />)
    await user.click(screen.getByRole('button', { name: /Learning settings/ }))
    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName.toLowerCase() !== 'a') return originalCreateElement(tagName)
      return {
        click,
        set href(_value: string) {},
        set download(_value: string) {},
      } as unknown as HTMLAnchorElement
    })
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(current.onExport).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
  })
})
