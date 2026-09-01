// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MasteryRecord } from '../personalization/types'
import type { StudentProfile } from '../types'
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

  it('deletes one source with confirmation and revokes a source-connection permission', async () => {
    const user = userEvent.setup()
    const current = props()
    const onDeleteSourceData = vi.fn()
    const onRevokeCrossSourcePermission = vi.fn()
    render(
      <LearnerControlPanel
        {...current}
        sourceData={[
          {
            sourceId: 'book',
            sourceTitle: 'Biology notes',
            sourceKind: 'upload',
            evidenceCount: 7,
          },
        ]}
        crossSourcePermissions={[
          {
            id: 'permission-1',
            primaryAnchorKey: 'global::biology::respiration',
            secondaryAnchorKey: 'upload::book::page-2',
            primaryAnchor: {
              sourceId: 'biology',
              sourceKind: 'global-lab',
              sourceTitle: 'Cell biology',
              anchorId: 'respiration',
              anchorLabel: 'Respiration',
            },
            secondaryAnchor: dueReview.anchor,
            grantedAt: '2026-08-29T08:00:00.000Z',
          },
        ]}
        onDeleteSourceData={onDeleteSourceData}
        onRevokeCrossSourcePermission={onRevokeCrossSourcePermission}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Learning settings/ }))
    await user.click(screen.getByRole('button', { name: 'Delete source data' }))
    expect(onDeleteSourceData).not.toHaveBeenCalled()
    await user.click(
      screen.getByRole('button', {
        name: 'Yes',
      }),
    )
    expect(onDeleteSourceData).toHaveBeenCalledWith('book')

    await user.click(screen.getByRole('button', { name: 'Revoke' }))
    expect(onRevokeCrossSourcePermission).toHaveBeenCalledWith('permission-1')
  })

  it('lets the student edit every universal Koji starting default outside the reader', async () => {
    const user = userEvent.setup()
    const current = props()
    const onUpdateStudentProfile = vi.fn()
    const studentProfile: StudentProfile = {
      interest: 'gaming',
      gradeLevel: 'Grade 11',
      preferredLanguage: 'English',
      learningGoals: ['Understand difficult material'],
      startingSupport: 'balanced',
      stuckSupport: 'different-explanation',
      onboardingVersion: 3,
      createdAt: '2026-08-29T00:00:00.000Z',
    }
    render(
      <LearnerControlPanel
        {...current}
        studentProfile={studentProfile}
        onUpdateStudentProfile={onUpdateStudentProfile}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Learning settings/ }))
    expect(screen.getByText('Koji starting defaults')).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Response language'), 'Arabic')
    expect(onUpdateStudentProfile).toHaveBeenCalledWith({
      interest: 'gaming',
      gradeLevel: 'Grade 11',
      preferredLanguage: 'Arabic',
      learningGoals: ['Understand difficult material'],
      startingSupport: 'balanced',
      stuckSupport: 'different-explanation',
      onboardingVersion: 3,
    })

    await user.click(screen.getByRole('button', { name: 'Prepare for an exam' }))
    expect(onUpdateStudentProfile).toHaveBeenLastCalledWith({
      interest: 'gaming',
      gradeLevel: 'Grade 11',
      preferredLanguage: 'English',
      learningGoals: ['Understand difficult material', 'Prepare for an exam'],
      startingSupport: 'balanced',
      stuckSupport: 'different-explanation',
      onboardingVersion: 3,
    })

    const interest = screen.getByLabelText('Interest lens')
    await user.clear(interest)
    await user.type(interest, 'filmmaking')
    await user.click(screen.getByRole('button', { name: 'Save lens' }))
    expect(onUpdateStudentProfile).toHaveBeenLastCalledWith({
      interest: 'filmmaking',
      gradeLevel: 'Grade 11',
      preferredLanguage: 'English',
      learningGoals: ['Understand difficult material'],
      startingSupport: 'balanced',
      stuckSupport: 'different-explanation',
      onboardingVersion: 3,
    })
  })
})
