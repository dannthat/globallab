// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { KnowledgeTopic, Subject, UserBook } from '../types'
import { LibraryShelf } from './LibraryShelf'

const topic: KnowledgeTopic = {
  id: 'cells',
  subjectId: 'biology',
  title: 'Cells',
  subtitle: 'Cell structure and function',
  sections: [],
  source: {
    name: 'NIH',
    url: 'https://www.nih.gov/',
    license: 'Public domain',
  },
}

const subjects: Subject[] = [
  {
    id: 'biology',
    title: 'Biology',
    description: 'The science of living systems',
    color: '#0d6e52',
    topics: [topic],
  },
  {
    id: 'physics',
    title: 'Physics',
    description: 'Matter, energy, and motion',
    color: '#1a5fa8',
    topics: [],
    comingSoon: true,
  },
]

const books: UserBook[] = [
  {
    id: 'cell-notes',
    title: 'Cell notes',
    fileName: 'cell-notes.pdf',
    fileType: 'pdf',
    previewKind: 'pdf',
    previewMessage: '',
    fileExtension: 'pdf',
    mimeType: 'application/pdf',
    fileSize: 1_572_864,
    pageCount: 0,
    pageCountKnown: false,
    originalStored: true,
    color: '#875f42',
    spineColor: '#583b28',
    innerColor: '#efe2d4',
    addedAt: '2026-08-26T00:00:00.000Z',
  },
  {
    id: 'lab-handout',
    title: 'Lab handout',
    fileName: 'lab-handout.docx',
    fileType: 'document',
    previewKind: 'conversion-required',
    previewMessage: 'Convert this document to PDF for a faithful preview.',
    fileExtension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 32_768,
    pageCount: 0,
    pageCountKnown: false,
    originalStored: true,
    color: '#5e6f87',
    spineColor: '#3c485b',
    innerColor: '#dce4ee',
    addedAt: '2026-08-26T00:00:00.000Z',
  },
]

function stubReducedMotion(matches: boolean) {
  const mediaQuery = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))
}

function renderShelf(overrides: Partial<Parameters<typeof LibraryShelf>[0]> = {}) {
  return render(
    <LibraryShelf
      subjects={subjects}
      books={books}
      isUploading={false}
      uploadError={null}
      uploadProgress={null}
      onSelect={vi.fn()}
      onUpload={vi.fn()}
      onSelectBook={vi.fn()}
      onRemoveBook={vi.fn()}
      onClearError={vi.fn()}
      {...overrides}
    />,
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('LibraryShelf', () => {
  it('uses native list semantics, a collision-safe namespace, and stable book dimensions', () => {
    stubReducedMotion(false)
    const view = renderShelf()

    const rows = view.container.querySelectorAll('.gl-library-shelf__row')
    expect(rows).toHaveLength(2)
    rows.forEach((row) => {
      expect(row.tagName).toBe('UL')
      Array.from(row.children).forEach((item) => expect(item.tagName).toBe('LI'))
    })

    const biologyButton = screen.getByRole('button', {
      name: 'Biology. 1 topics',
    })
    const firstStyle = biologyButton.getAttribute('style')
    expect(firstStyle).toContain('--library-book-width')
    expect(firstStyle).toContain('--library-book-height')
    expect(firstStyle).toContain('--library-book-lean')
    expect(firstStyle).toContain('--library-book-depth')

    view.rerender(
      <LibraryShelf
        subjects={subjects}
        books={books}
        isUploading={false}
        uploadError={null}
        uploadProgress={null}
        onSelect={vi.fn()}
        onUpload={vi.fn()}
        onSelectBook={vi.fn()}
        onRemoveBook={vi.fn()}
        onClearError={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Biology. 1 topics' }).getAttribute('style'),
    ).toBe(firstStyle)

    const forbiddenClasses = Array.from(view.container.querySelectorAll('[class]'))
      .flatMap((element) => Array.from(element.classList))
      .filter((name) => /^(?:book(?:-|$)|shelf-|library-shelf-|your-library(?:-|$)|ubr-)/.test(name))
    expect(forbiddenClasses).toEqual([])
  })

  it('searches both shelves and filters by ownership and current readability', async () => {
    stubReducedMotion(false)
    const user = userEvent.setup()
    renderShelf()

    await user.click(screen.getByRole('button', { name: 'Mine' }))
    expect(screen.queryByRole('button', { name: 'Biology. 1 topics' })).toBeNull()
    expect(screen.getByRole('button', { name: /Cell notes\. PDF/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Lab handout\. DOCX/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Readable now' }))
    expect(screen.getByRole('button', { name: 'Biology. 1 topics' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Physics\./ })).toBeNull()
    expect(screen.getByRole('button', { name: /Cell notes\. PDF/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Lab handout\. DOCX/ })).toBeNull()

    await user.type(screen.getByRole('searchbox', { name: 'Search your library' }), 'cells')
    expect(screen.getByRole('button', { name: 'Biology. 1 topics' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Cell notes\. PDF/ })).toBeNull()
  })

  it('announces honest local-source and upload state metadata', () => {
    stubReducedMotion(false)
    renderShelf({ isUploading: true, uploadProgress: 'Saving page images' })

    expect(
      screen.getByRole('button', { name: /Cell notes\. PDF · Stored locally/ })
        .getAttribute('aria-label'),
    ).toContain('1.5 MB')
    expect(
      screen.getByRole('button', { name: /Lab handout\. DOCX · Stored locally/ })
        .getAttribute('aria-label'),
    ).toContain('Preview needs conversion')
    expect(screen.getByRole('status').textContent).toBe('Saving page images')
  })

  it('navigates immediately for reduced motion and announces the destination', () => {
    stubReducedMotion(true)
    const onSelect = vi.fn()
    renderShelf({ onSelect })

    fireEvent.click(screen.getByRole('button', { name: 'Biology. 1 topics' }))

    expect(onSelect).toHaveBeenCalledWith(subjects[0])
    expect(screen.getByRole('status').textContent).toBe('Opening Biology')
  })

  it('cancels delayed navigation when the shelf unmounts', () => {
    vi.useFakeTimers()
    stubReducedMotion(false)
    const onSelect = vi.fn()
    const view = renderShelf({ onSelect })

    fireEvent.click(screen.getByRole('button', { name: 'Biology. 1 topics' }))
    expect(onSelect).not.toHaveBeenCalled()

    view.unmount()
    act(() => vi.advanceTimersByTime(1_000))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
