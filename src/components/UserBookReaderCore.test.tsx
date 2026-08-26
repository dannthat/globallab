// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LearningCompanionArtifact } from '../personalization/companionTypes'
import type { SourceAnchor } from '../personalization/types'
import type { StudentProfile, UserBook } from '../types'
import { UserBookReader } from './UserBookReaderCore'

const mocks = vi.hoisted(() => ({
  getFile: vi.fn(),
  extractUserSourceContext: vi.fn(),
  recognizeLocalImage: vi.fn(),
  createLearningCompanion: vi.fn(),
}))

vi.mock('../services/fileStore', () => ({ getFile: mocks.getFile }))
vi.mock('../services/sourceContext', () => ({
  extractUserSourceContext: mocks.extractUserSourceContext,
}))
vi.mock('../services/localOcr', () => ({
  recognizeLocalImage: mocks.recognizeLocalImage,
}))
vi.mock('../services/learningCompanionService', () => ({
  createLearningCompanion: mocks.createLearningCompanion,
}))

const profile: StudentProfile = {
  interest: 'basketball',
  gradeLevel: 'Grade 10',
  createdAt: '2026-08-26T00:00:00.000Z',
}

const book: UserBook = {
  id: 'image-book',
  title: 'Cell Diagram',
  fileName: 'cell.png',
  fileType: 'image',
  previewKind: 'image',
  previewMessage: 'Original image.',
  fileExtension: 'png',
  mimeType: 'image/png',
  fileSize: 18,
  pageCount: 1,
  pageCountKnown: true,
  originalStored: true,
  sourceFingerprint: 'sha256:image-book',
  color: '#0D8267',
  spineColor: '#075442',
  innerColor: '#D6EFE9',
  addedAt: '2026-08-26T00:00:00.000Z',
}

const anchor: SourceAnchor = {
  sourceId: book.id,
  sourceKind: 'upload',
  sourceTitle: book.title,
  anchorId: 'image-book::image:1',
  anchorLabel: 'Cell Diagram — image',
  page: 1,
  sourceFingerprint: book.sourceFingerprint,
}

function learnerModelStub() {
  return {
    approvedPresentation: {},
    pendingSuggestions: [],
    recordRefinement: vi.fn(),
    recordHelpful: vi.fn(),
    recordQuiz: vi.fn(),
    acceptSuggestion: vi.fn(),
    notNow: vi.fn(),
    neverSuggest: vi.fn(),
  }
}

beforeEach(() => {
  window.localStorage.clear()
  mocks.getFile.mockReset()
  mocks.extractUserSourceContext.mockReset()
  mocks.recognizeLocalImage.mockReset()
  mocks.createLearningCompanion.mockReset()
  mocks.getFile.mockResolvedValue(new Blob(['original-pixels'], { type: 'image/png' }))
  mocks.extractUserSourceContext.mockResolvedValue({
    body: 'Use the locally prepared focused image.',
    anchor,
    inlineData: { mimeType: 'image/jpeg', data: 'QUJDRA==' },
  })
  mocks.recognizeLocalImage.mockResolvedValue(
    'Cellular respiration releases usable energy from glucose.',
  )
  const artifact: LearningCompanionArtifact = {
    id: 'local-artifact',
    mode: 'analogy',
    title: 'A private local memory cue',
    content: 'Cells release usable energy.',
    limitations: 'The original image remains the reference.',
    excerpt: {
      anchor,
      text: 'Cellular respiration releases usable energy from glucose.',
    },
    provider: 'local',
    createdAt: '2026-08-26T00:00:00.000Z',
  }
  mocks.createLearningCompanion.mockResolvedValue(artifact)

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:local-image'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
})

describe('uploaded-source Learn Your Way wiring', () => {
  it('runs focused image OCR locally and forces local-only companion generation', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <UserBookReader
        book={book}
        profile={profile}
        learnerModel={learnerModelStub() as never}
        isDark={false}
        onToggleDark={vi.fn()}
        onBack={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    const trigger = await screen.findByRole('button', {
      name: /Learn this source your way/i,
    })
    await waitFor(() => expect((trigger as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(trigger)

    await waitFor(() => expect(mocks.createLearningCompanion).toHaveBeenCalledOnce())
    expect(mocks.recognizeLocalImage).toHaveBeenCalledWith(
      { mimeType: 'image/jpeg', data: 'QUJDRA==' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(mocks.createLearningCompanion).toHaveBeenCalledWith(
      expect.objectContaining({
        localOnly: true,
        excerpt: {
          anchor,
          text: 'Cellular respiration releases usable energy from glucose.',
        },
      }),
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await screen.findByText('Cells release usable energy.')).toBeTruthy()
    expect(screen.getByText(/No image or extracted text left this browser/i)).toBeTruthy()
  })
})
