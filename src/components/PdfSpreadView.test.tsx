// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserBook } from '../types'
import { PdfSpreadView } from './PdfSpreadView'

const book: UserBook = {
  id: 'notes-1',
  title: 'My notes',
  fileName: 'notes.md',
  fileType: 'markdown',
  previewKind: 'markdown',
  previewMessage: 'Exact Markdown source.',
  fileExtension: 'md',
  mimeType: 'text/markdown',
  fileSize: 80,
  pageCount: 1,
  pageCountKnown: true,
  originalStored: true,
  sourceFingerprint: 'sha256:notes-1',
  color: '#e65c24',
  spineColor: '#8c3515',
  innerColor: '#fff4ef',
  addedAt: '2026-08-29T00:00:00.000Z',
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
})

describe('PdfSpreadView exact source selection', () => {
  it('sends only selected text from a Markdown upload to Koji', async () => {
    const runCompanion = vi.fn().mockResolvedValue(undefined)
    const rawText = 'First source sentence. Only this relationship is unclear. Final source sentence.'
    render(
      <PdfSpreadView
        book={book}
        previewKind={'markdown'}
        pdfDoc={null}
        sourceUrl={null}
        rawText={rawText}
        storedSource={rawText}
        isLoading={false}
        renderError={null}
        isDark={false}
        onToggleDark={vi.fn()}
        onBack={vi.fn()}
        onRemove={vi.fn()}
        isLensOpen={false}
        setIsLensOpen={vi.fn()}
        focusedPage={1}
        setFocusedPage={vi.fn()}
        spreadIndex={0}
        setSpreadIndex={vi.fn()}
        isCompanionLoading={false}
        runCompanion={runCompanion}
      />,
    )

    const code = screen.getByText(rawText)
    const textNode = code.firstChild
    expect(textNode).toBeTruthy()
    const range = document.createRange()
    range.setStart(textNode as Text, rawText.indexOf('Only'))
    range.setEnd(textNode as Text, rawText.indexOf('Final') - 1)
    Object.defineProperty(range, 'getBoundingClientRect', {
      value: () => ({ left: 100, right: 280, top: 160, bottom: 180, width: 180, height: 20 }),
    })
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    fireEvent.mouseUp(code.closest('.ubr-reader-composition') as HTMLElement)

    const selectionAction = await screen.findByRole('button', {
      name: /Learn selection your way/i,
    })
    fireEvent.mouseDown(selectionAction)
    fireEvent.click(selectionAction)

    await waitFor(() => expect(runCompanion).toHaveBeenCalledWith(
      undefined,
      false,
      'Only this relationship is unclear.',
    ))
  })
})
