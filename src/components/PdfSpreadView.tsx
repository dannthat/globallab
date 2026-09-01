import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Moon,
  Sun,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { UserBook } from '../types'
import { PdfSourceLeaf } from './PdfSourceLeaf'

type SourcePreviewKind =
  | 'pdf'
  | 'image'
  | 'text'
  | 'markdown'
  | 'code'
  | 'data'
  | 'media'
  | 'conversion-required'
  | 'unsupported'

type SpreadMarker = number | 'gap'

function buildSpreadMarkers(total: number, current: number): SpreadMarker[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index)

  const visible = new Set([0, total - 1])
  for (let index = current - 2; index <= current + 2; index += 1) {
    if (index >= 0 && index < total) visible.add(index)
  }

  const ordered = [...visible].sort((a, b) => a - b)
  const markers: SpreadMarker[] = []
  ordered.forEach((page, index) => {
    const previous = ordered[index - 1]
    if (previous !== undefined && page - previous > 1) markers.push('gap')
    markers.push(page)
  })
  return markers
}

function focusPage(
  page: number,
  setPage: (page: number) => void,
  setPageInput: (value: string) => void,
  setLensOpen: (open: boolean) => void,
) {
  setPage(page)
  setPageInput(String(page))
  setLensOpen(false)
}

function unavailableMessage(kind: SourcePreviewKind) {
  if (kind === 'conversion-required') {
    return 'This file needs a faithful page conversion before GlobalLab can place it in the textbook.'
  }
  if (kind === 'media') {
    return 'This media source is stored unchanged. An inline media reader is not enabled.'
  }
  return 'This source is stored unchanged, but GlobalLab cannot preview it yet.'
}

function EmptyLeaf({ fileName }: { fileName: string }) {
  return (
    <section
      className="ubr-reader-leaf ubr-reader-leaf--empty"
      aria-label="Companion-ready page"
    >
      <div className="ubr-running-head">
        <span>{fileName}</span>
        <span>End of source</span>
      </div>
      <div className="ubr-blank-leaf-mark">
        <div className="ubr-blank-leaf-cue">
          <WandSparkles size={18} aria-hidden="true" />
          <p>Your companion page</p>
          <strong>Learn this source your way</strong>
          <span>
            Use the control above to add source-grounded help here. The
            original remains unchanged.
          </span>
        </div>
      </div>
    </section>
  )
}

function StateLeaf({ fileName, children }: {
  fileName: string
  children: ReactNode
}) {
  return (
    <section className="ubr-reader-leaf">
      <div className="ubr-running-head">
        <span>{fileName}</span>
        <span>Your source</span>
      </div>
      <div className="ubr-state-center">{children}</div>
    </section>
  )
}

export interface PdfSpreadViewProps {
  book: UserBook
  previewKind: SourcePreviewKind
  pdfDoc: PDFDocumentProxy | null
  sourceUrl: string | null
  rawText: string | null
  storedSource: Blob | string | undefined
  isLoading: boolean
  renderError: string | null
  isDark: boolean
  onToggleDark: () => void
  onBack: () => void
  onRemove: (id: string) => void
  isLensOpen: boolean
  setIsLensOpen: (open: boolean) => void
  focusedPage: number
  setFocusedPage: (page: number) => void
  spreadIndex: number
  setSpreadIndex: (index: number) => void
  isCompanionLoading: boolean
  runCompanion: (
    requestedMode?: never,
    force?: boolean,
    selectedText?: string,
  ) => Promise<void>
  children?: ReactNode
}

export function PdfSpreadView({
  book,
  previewKind,
  pdfDoc,
  sourceUrl,
  rawText,
  isLoading,
  renderError,
  isDark,
  onToggleDark,
  onBack,
  onRemove,
  isLensOpen,
  setIsLensOpen,
  focusedPage,
  setFocusedPage,
  spreadIndex,
  setSpreadIndex,
  isCompanionLoading,
  runCompanion,
  children,
}: PdfSpreadViewProps) {
  const [pageInput, setPageInput] = useState(String(focusedPage))
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward' | 'none'>('none')
  const [sourceSelection, setSourceSelection] = useState<{
    text: string
    page: number
    left: number
    top: number
  } | null>(null)

  const totalPages = previewKind === 'pdf'
    ? pdfDoc?.numPages ?? Math.max(1, book.pageCount)
    : 1
  const spreadCount = Math.max(1, Math.ceil(totalPages / 2))
  const leftPage = spreadIndex * 2 + 1
  const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : null

  const captureSourceSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSourceSelection(null)
        return
      }
      const range = selection.getRangeAt(0)
      const start = range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement
      const leaf = start?.closest<HTMLElement>('.ubr-source-leaf, .ubr-source-spread')
      const text = selection.toString().replace(/\s+/g, ' ').trim().slice(0, 4_000)
      if (!leaf || !text) {
        setSourceSelection(null)
        return
      }
      const rect = range.getBoundingClientRect()
      const page = Number(leaf.dataset.sourcePage) || focusedPage
      setFocusedPage(page)
      setSourceSelection({
        text,
        page,
        left: Math.max(86, Math.min(window.innerWidth - 86, rect.left + rect.width / 2)),
        top: Math.max(68, Math.min(window.innerHeight - 74, rect.bottom + 10)),
      })
    })
  }, [focusedPage, setFocusedPage])

  const openSpread = useCallback((requested: number) => {
    const next = Math.max(0, Math.min(requested, spreadCount - 1))
    setTurnDirection(next > spreadIndex ? 'forward' : next < spreadIndex ? 'backward' : 'none')
    setSpreadIndex(next)
    setFocusedPage(next * 2 + 1)
    setPageInput(String(next * 2 + 1))
    setIsLensOpen(false)
  }, [spreadCount, spreadIndex, setSpreadIndex, setFocusedPage, setIsLensOpen])

  const openPage = useCallback((requested: number) => {
    const next = Math.max(1, Math.min(requested, totalPages))
    setTurnDirection(next > focusedPage ? 'forward' : next < focusedPage ? 'backward' : 'none')
    setSpreadIndex(Math.floor((next - 1) / 2))
    setFocusedPage(next)
    setPageInput(String(next))
    setIsLensOpen(false)
  }, [focusedPage, totalPages, setSpreadIndex, setFocusedPage, setIsLensOpen])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input,textarea,select,button,a') || target?.isContentEditable) return

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        openSpread(spreadIndex + 1)
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        openSpread(spreadIndex - 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSpread, spreadIndex])

  const commitPageJump = useCallback(() => {
    const requested = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(requested)) {
      setPageInput(String(focusedPage))
      return
    }
    openPage(requested)
  }, [focusedPage, openPage, pageInput])

  const spreadMarkers = useMemo(
    () => buildSpreadMarkers(spreadCount, spreadIndex),
    [spreadCount, spreadIndex],
  )

  const originalAction = sourceUrl ? (
    <a className="your-library-upload-btn ubr-source-action" href={sourceUrl} download={book.fileName}>
      Download original
    </a>
  ) : null

  let spreadContent: ReactNode
  if (isLoading) {
    spreadContent = (
      <StateLeaf fileName={book.fileName}>
        <Loader2 size={32} className="ubr-spinner" aria-hidden="true" />
        <p className="ubr-state-text">Opening the original sourceÃ¢â‚¬Â¦</p>
      </StateLeaf>
    )
  } else if (renderError) {
    spreadContent = (
      <StateLeaf fileName={book.fileName}>
        <AlertCircle size={28} aria-hidden="true" />
        <p className="ubr-state-text" role="alert">{renderError}</p>
        <button type="button" className="ubr-action-btn" onClick={onBack}>Back to library</button>
      </StateLeaf>
    )
  } else if (previewKind === 'pdf' && pdfDoc) {
    spreadContent = isLensOpen ? (
      <PdfSourceLeaf
        document={pdfDoc}
        pageNumber={focusedPage}
        side="left"
        fileName={book.fileName}
        isFocused
        onFocus={() => undefined}
      />
    ) : (
      <>
        <PdfSourceLeaf
          document={pdfDoc}
          pageNumber={leftPage}
          side="left"
          fileName={book.fileName}
          isFocused={focusedPage === leftPage}
          onFocus={() => focusPage(leftPage, setFocusedPage, setPageInput, setIsLensOpen)}
        />
        <div className="ubr-source-spine" aria-hidden="true" />
        {rightPage ? (
          <PdfSourceLeaf
            document={pdfDoc}
            pageNumber={rightPage}
            side="right"
            fileName={book.fileName}
            isFocused={focusedPage === rightPage}
            onFocus={() => focusPage(rightPage, setFocusedPage, setPageInput, setIsLensOpen)}
          />
        ) : <EmptyLeaf fileName={book.fileName} />}
      </>
    )
  } else if (previewKind === 'image' && sourceUrl) {
    spreadContent = (
      <section className="ubr-reader-leaf ubr-reader-leaf--focused">
        <div className="ubr-running-head">
          <span>{book.fileName}</span><span>Original image</span>
        </div>
        <div className="ubr-canvas-wrap ubr-source-frame">
          <img src={sourceUrl} alt={book.title} className="ubr-image ubr-source-image" />
        </div>
      </section>
    )
  } else if (['text', 'markdown', 'code', 'data'].includes(previewKind) && rawText !== null) {
    spreadContent = (
      <section className="ubr-reader-leaf ubr-reader-leaf--focused">
        <div className="ubr-running-head">
          <span>{book.fileName}</span><span>Exact source</span>
        </div>
        <pre className="ubr-raw-source"><code>{rawText}</code></pre>
        <div className="ubr-source-note">
          <p className="ubr-source-kicker">Source preserved</p>
          <h2 className="ubr-source-message-title">Shown exactly as text</h2>
          <p className="ubr-state-text">GlobalLab never executes uploaded source code, HTML, SVG, or Markdown.</p>
          {originalAction}
        </div>
      </section>
    )
  } else {
    const message = (book as any).previewMessage ?? unavailableMessage(previewKind)
    spreadContent = (
      <StateLeaf fileName={book.fileName}>
        <p className="ubr-source-kicker">Original safely stored</p>
        <h2 className="ubr-source-message-title">Preview not available</h2>
        <p className="ubr-state-text">{message}</p>
        {originalAction}
      </StateLeaf>
    )
  }

  const sourceLayout = previewKind === 'pdf' && pdfDoc
    ? isLensOpen ? 'companion' : 'book'
    : 'single'

  return (
    <div className="ubr-reader-shell" style={{ '--subject-color': book.color } as CSSProperties}>
      {/* â”€â”€ Reader header â”€â”€ */}
      <header className="ubr-reader-header">
        <div className="ubr-reader-header__left">
          <button
            type="button"
            className="ubr-reader-back"
            onClick={onBack}
            aria-label="Back to your library"
          >
            <ArrowLeft size={15} aria-hidden="true" /><span>Library</span>
          </button>
        </div>
        <div className="ubr-reader-header__title" aria-current="page">
          <span>Your source · {previewKind}</span>
          <strong>{book.title}</strong>
        </div>
        <div className="ubr-reader-header__right">
          <button
            type="button"
            className="ubr-learn-trigger"
            disabled={isLoading || Boolean(renderError) || isCompanionLoading}
            onClick={() => void runCompanion()}
            aria-expanded={isLensOpen}
            aria-controls="ubr-lens-drawer"
          >
            {isCompanionLoading
              ? <Loader2 size={14} className="ubr-spinner" aria-hidden="true" />
              : <WandSparkles size={14} aria-hidden="true" />}
            <span>
              Learn {previewKind === 'pdf' ? 'page ' + focusedPage : 'this source'} your way
            </span>
          </button>
          <button
            type="button"
            className="site-theme-toggle"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="ubr-remove-btn"
            title="Remove source"
            aria-label={`Remove ${book.title}`}
            onClick={() => {
              if (window.confirm(`Remove "${book.title}"?`)) {
                onRemove(book.id)
                onBack()
              }
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Reader body: a stable paper composition in both themes. */}
      <div className={'ubr-reader-body' + (isLensOpen ? ' ubr-reader-body--lens-open' : '')}>
        <main className="ubr-reader-stage" id="main-content" aria-busy={isLoading}>
          <div
            className={'ubr-reader-composition' + (isLensOpen ? ' ubr-reader-composition--lens-open' : '')}
            onMouseUp={captureSourceSelection}
          >
            <article
              key={`${book.id}-${sourceLayout}-${sourceLayout === 'book' ? spreadIndex : focusedPage}`}
              className={[
                'ubr-source-spread',
                `ubr-source-spread--${sourceLayout}`,
                turnDirection !== 'none' ? `ubr-turn-${turnDirection}` : '',
              ].filter(Boolean).join(' ')}
            >
              {spreadContent}
            </article>

            {isLensOpen && children && (
              <aside
                id="ubr-lens-drawer"
                className="ubr-companion-shell gl-companion-open"
                aria-label={`Learn page ${focusedPage} your way`}
              >
                {children}
              </aside>
            )}
          </div>

          {/* Bottom navigation */}
          <nav className="ubr-reader-nav" aria-label="Navigate source pages">
            <button
              type="button"
              className="ubr-nav-arrow"
              disabled={isLoading || spreadIndex === 0}
              onClick={() => openSpread(spreadIndex - 1)}
              aria-label="Previous source spread"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <div className="ubr-nav-progress">
              <BookOpen size={14} aria-hidden="true" />
              <span className="ubr-nav-label">Source</span>
              <div className="ubr-nav-dots">
                {spreadMarkers.map((marker, index) => marker === 'gap' ? (
                  <span key={`gap-${index}`} className="ubr-nav-gap" aria-hidden="true">…</span>
                ) : (
                  <button
                    key={marker}
                    type="button"
                    className={'ubr-nav-dot' + (marker === spreadIndex ? ' ubr-nav-dot--active' : '')}
                    disabled={isLoading}
                    onClick={() => openSpread(marker)}
                    aria-label={`Open spread ${marker + 1}`}
                    aria-current={marker === spreadIndex ? 'page' : undefined}
                  />
                ))}
              </div>
              <form
                className="ubr-page-jump"
                onSubmit={(event) => {
                  event.preventDefault()
                  commitPageJump()
                }}
              >
                <span>Page</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  disabled={isLoading || previewKind !== 'pdf'}
                  onChange={(event) => setPageInput(event.target.value)}
                  onBlur={commitPageJump}
                  onFocus={(event) => event.target.select()}
                  aria-label="Go to source page"
                />
                <span>/ {totalPages}</span>
              </form>
              <span className="ubr-nav-count">{spreadIndex + 1} / {spreadCount}</span>
            </div>
            <button
              type="button"
              className="ubr-nav-arrow"
              disabled={isLoading || spreadIndex === spreadCount - 1}
              onClick={() => openSpread(spreadIndex + 1)}
              aria-label="Next source spread"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </nav>
        </main>

        {sourceSelection && !isLensOpen && <button
          type={'button'}
          className={'ubr-selection-koji'}
          style={{ left: sourceSelection.left, top: sourceSelection.top }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const selectedText = sourceSelection.text
            setSourceSelection(null)
            window.getSelection()?.removeAllRanges()
            void runCompanion(undefined, false, selectedText)
          }}
        >
          <WandSparkles size={15} aria-hidden={true} />
          Learn selection your way
          <span>Page {sourceSelection.page}</span>
        </button>}

      </div>
    </div>
  )
}

