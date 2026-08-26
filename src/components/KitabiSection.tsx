/* oxlint-disable react/only-export-components -- Phase 1 keeps the shared annotation engine with the brief's section component. */
import katex from 'katex'
import { LoaderCircle, WandSparkles } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type {
  KnowledgeSection,
  RewrittenSection,
  StudentProfile,
} from '../types'
import { AnalogyPanel } from './AnalogyPanel'
import { CalloutBox } from './CalloutBox'
import { DiagramBlock } from './DiagramBlock'
import { SectionErrorBoundary } from './SectionErrorBoundary'

interface KitabiSectionProps {
  topicId?: string
  section: KnowledgeSection
  rewrite: RewrittenSection | null
  isLoading: boolean
  profile: StudentProfile | null
  topicTitle: string
  topicSubtitle: string
  subjectTitle: string
  sectionIndex: number
  totalSections: number
  turnDirection: 'forward' | 'backward'
  error?: string | null
  onLearnYourWay: () => void
  onClearRewrite: () => void
}

export type TextHighlightColor = 'yellow' | 'green'

export interface TextHighlightAnchor {
  segmentId: string
  start: number
  end: number
  exact: string
  prefix: string
  suffix: string
}

export interface StoredTextHighlight {
  id: string
  sectionId: string
  text: string
  color: TextHighlightColor
  timestamp: number
  anchors: TextHighlightAnchor[]
}

interface HighlightToolbarState {
  kind: 'selection' | 'existing'
  x: number
  y: number
  text: string
  anchors: TextHighlightAnchor[]
  highlightId?: string
}

interface PersistentHighlightsOptions {
  topicId: string
  sectionId: string
  onAskCompanion: (excerpt: string) => void
}

const MAX_HIGHLIGHTS_PER_TOPIC = 200
const MAX_HIGHLIGHT_TEXT_LENGTH = 4000
const HIGHLIGHT_CONTEXT_LENGTH = 28

function highlightStorageKey(topicId: string) {
  return 'gl_highlights_' + topicId
}

function isTextHighlightColor(value: unknown): value is TextHighlightColor {
  return value === 'yellow' || value === 'green'
}

function isStoredHighlight(value: unknown): value is StoredTextHighlight {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredTextHighlight>

  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    candidate.id.length <= 160 &&
    typeof candidate.sectionId === 'string' &&
    candidate.sectionId.length > 0 &&
    typeof candidate.text === 'string' &&
    candidate.text.trim().length > 3 &&
    candidate.text.length <= MAX_HIGHLIGHT_TEXT_LENGTH &&
    isTextHighlightColor(candidate.color) &&
    typeof candidate.timestamp === 'number' &&
    Number.isFinite(candidate.timestamp) &&
    Array.isArray(candidate.anchors) &&
    candidate.anchors.length > 0 &&
    candidate.anchors.length <= 64 &&
    candidate.anchors.every((anchor) =>
      Boolean(
        anchor &&
          typeof anchor.segmentId === 'string' &&
          Number.isInteger(anchor.start) &&
          Number.isInteger(anchor.end) &&
          anchor.start >= 0 &&
          anchor.end > anchor.start &&
          typeof anchor.exact === 'string' &&
          anchor.exact.length > 0 &&
          typeof anchor.prefix === 'string' &&
          typeof anchor.suffix === 'string',
      ),
    )
  )
}

export function readStoredTextHighlights(topicId: string) {
  if (typeof window === 'undefined') return [] as StoredTextHighlight[]

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(highlightStorageKey(topicId)) ?? '[]',
    )
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredHighlight).slice(-MAX_HIGHLIGHTS_PER_TOPIC)
  } catch {
    return []
  }
}

function writeStoredTextHighlights(
  topicId: string,
  highlights: StoredTextHighlight[],
) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      highlightStorageKey(topicId),
      JSON.stringify(highlights.slice(-MAX_HIGHLIGHTS_PER_TOPIC)),
    )
  } catch {
    // Highlighting remains usable for the current session when storage is blocked.
  }
}

function createHighlightId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return (
    'highlight-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  )
}

function offsetWithinSegment(
  segment: HTMLElement,
  container: Node,
  offset: number,
) {
  const range = document.createRange()
  range.selectNodeContents(segment)
  range.setEnd(container, offset)
  return range.toString().length
}

function captureHighlightAnchors(
  root: HTMLElement,
  range: Range,
): TextHighlightAnchor[] {
  const segments = Array.from(
    root.querySelectorAll<HTMLElement>('[data-gl-highlight-segment]'),
  )

  return segments.flatMap((segment) => {
    try {
      if (!range.intersectsNode(segment)) return []
    } catch {
      return []
    }

    const segmentId = segment.dataset.glHighlightSegment
    const segmentText = segment.textContent ?? ''
    if (!segmentId || !segmentText) return []

    const start = segment.contains(range.startContainer)
      ? offsetWithinSegment(segment, range.startContainer, range.startOffset)
      : 0
    const end = segment.contains(range.endContainer)
      ? offsetWithinSegment(segment, range.endContainer, range.endOffset)
      : segmentText.length
    const safeStart = Math.max(0, Math.min(start, segmentText.length))
    const safeEnd = Math.max(safeStart, Math.min(end, segmentText.length))
    const exact = segmentText.slice(safeStart, safeEnd)
    if (!exact.trim()) return []

    return [
      {
        segmentId,
        start: safeStart,
        end: safeEnd,
        exact,
        prefix: segmentText.slice(
          Math.max(0, safeStart - HIGHLIGHT_CONTEXT_LENGTH),
          safeStart,
        ),
        suffix: segmentText.slice(
          safeEnd,
          safeEnd + HIGHLIGHT_CONTEXT_LENGTH,
        ),
      },
    ]
  })
}

function resolveAnchor(
  anchor: TextHighlightAnchor,
  text: string,
): { start: number; end: number } | null {
  if (
    anchor.start >= 0 &&
    anchor.end <= text.length &&
    text.slice(anchor.start, anchor.end) === anchor.exact
  ) {
    return { start: anchor.start, end: anchor.end }
  }

  const matches: number[] = []
  let cursor = text.indexOf(anchor.exact)
  while (cursor >= 0) {
    const prefixMatches =
      !anchor.prefix ||
      text.slice(Math.max(0, cursor - anchor.prefix.length), cursor) ===
        anchor.prefix
    const end = cursor + anchor.exact.length
    const suffixMatches =
      !anchor.suffix ||
      text.slice(end, end + anchor.suffix.length) === anchor.suffix
    if (prefixMatches && suffixMatches) matches.push(cursor)
    cursor = text.indexOf(anchor.exact, cursor + 1)
  }

  return matches.length === 1
    ? { start: matches[0], end: matches[0] + anchor.exact.length }
    : null
}

function escapePattern(value: string) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function highlightTerms(text: string, keyTerms: string[]): ReactNode[] {
  const terms = [...keyTerms].filter(Boolean).sort((a, b) => b.length - a.length)
  if (terms.length === 0) return [text]

  const pattern = new RegExp('(' + terms.map(escapePattern).join('|') + ')', 'gi')
  const lookup = new Set(terms.map((term) => term.toLowerCase()))

  return text.split(pattern).map((part, index) =>
    lookup.has(part.toLowerCase()) ? (
      <strong key={index}>{part}</strong>
    ) : (
      part
    ),
  )
}

interface TextRange {
  start: number
  end: number
}

interface UserTextRange extends TextRange {
  highlight: StoredTextHighlight
}

export function renderHighlightedText(
  text: string,
  keyTerms: string[],
  highlights: StoredTextHighlight[],
  segmentId: string,
): ReactNode[] {
  const terms = [...keyTerms]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  const termRanges: TextRange[] = []

  if (terms.length > 0) {
    const termPattern = new RegExp(
      terms.map(escapePattern).join('|'),
      'gi',
    )
    let termMatch = termPattern.exec(text)
    while (termMatch) {
      termRanges.push({
        start: termMatch.index,
        end: termMatch.index + termMatch[0].length,
      })
      termMatch = termPattern.exec(text)
    }
  }

  const userRanges: UserTextRange[] = highlights.flatMap((highlight) =>
    highlight.anchors.flatMap((anchor) => {
      if (anchor.segmentId !== segmentId) return []
      const resolved = resolveAnchor(anchor, text)
      return resolved ? [{ ...resolved, highlight }] : []
    }),
  )

  if (termRanges.length === 0 && userRanges.length === 0) return [text]

  const boundaries = new Set<number>([0, text.length])
  for (const range of [...termRanges, ...userRanges]) {
    boundaries.add(range.start)
    boundaries.add(range.end)
  }
  const sortedBoundaries = [...boundaries].sort((a, b) => a - b)

  return sortedBoundaries.slice(0, -1).flatMap((start, index) => {
    const end = sortedBoundaries[index + 1]
    if (end <= start) return []
    const slice = text.slice(start, end)
    const isKeyTerm = termRanges.some(
      (range) => range.start <= start && range.end >= end,
    )
    const activeHighlight = userRanges
      .filter((range) => range.start <= start && range.end >= end)
      .sort(
        (first, second) =>
          second.highlight.timestamp - first.highlight.timestamp,
      )[0]?.highlight

    let content: ReactNode = slice
    if (isKeyTerm) {
      content = <strong>{content}</strong>
    }
    if (activeHighlight) {
      content = (
        <mark
          className={
            'gl-text-highlight gl-text-highlight--' + activeHighlight.color
          }
          data-highlight-id={activeHighlight.id}
        >
          {content}
        </mark>
      )
    }

    return [
      <span className="gl-text-fragment" key={segmentId + '-' + start}>
        {content}
      </span>,
    ]
  })
}

function highlightsOverlap(
  first: TextHighlightAnchor,
  second: TextHighlightAnchor,
) {
  return (
    first.segmentId === second.segmentId &&
    first.start < second.end &&
    second.start < first.end
  )
}

export function usePersistentTextHighlights({
  topicId,
  sectionId,
  onAskCompanion,
}: PersistentHighlightsOptions) {
  const [highlights, setHighlights] = useState<StoredTextHighlight[]>(() =>
    readStoredTextHighlights(topicId).filter(
      (highlight) => highlight.sectionId === sectionId,
    ),
  )
  const [toolbar, setToolbar] = useState<HighlightToolbarState | null>(null)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Topic changes load that topic's private annotations.
    setHighlights(
      readStoredTextHighlights(topicId).filter(
        (highlight) => highlight.sectionId === sectionId,
      ),
    )
    setToolbar(null)
  }, [sectionId, topicId])

  const dismissToolbar = useCallback(() => {
    setToolbar(null)
  }, [])

  useEffect(() => {
    if (!toolbar) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('.gl-text-highlight-toolbar')
      ) {
        return
      }
      dismissToolbar()
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      dismissToolbar()
    }
    const handleScroll = () => dismissToolbar()

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [dismissToolbar, toolbar])

  const handleMouseUp = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const root = event.currentTarget
      const selection = window.getSelection()
      const selectedText = selection?.toString() ?? ''

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        const target =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>('[data-highlight-id]')
            : null
        const highlightId = target?.dataset.highlightId
        const existing = highlights.find(
          (highlight) => highlight.id === highlightId,
        )
        if (!existing || !target) {
          dismissToolbar()
          return
        }

        const bounds = target.getBoundingClientRect()
        setToolbar({
          kind: 'existing',
          x: bounds.left + bounds.width / 2,
          y: Math.max(64, bounds.top - 10),
          text: existing.text,
          anchors: existing.anchors,
          highlightId: existing.id,
        })
        return
      }

      if (
        selectedText.trim().length <= 3 ||
        selectedText.length > MAX_HIGHLIGHT_TEXT_LENGTH
      ) {
        dismissToolbar()
        return
      }

      const range = selection.getRangeAt(0)
      if (
        !root.contains(range.startContainer) ||
        !root.contains(range.endContainer)
      ) {
        dismissToolbar()
        return
      }

      const anchors = captureHighlightAnchors(root, range)
      if (anchors.length === 0) {
        dismissToolbar()
        return
      }

      const bounds =
        typeof range.getBoundingClientRect === 'function'
          ? range.getBoundingClientRect()
          : {
              left: event.clientX,
              top: event.clientY,
              width: 0,
            }
      setToolbar({
        kind: 'selection',
        x: bounds.left + bounds.width / 2,
        y: Math.max(64, bounds.top - 10),
        text: selectedText,
        anchors,
      })
    },
    [dismissToolbar, highlights],
  )

  const clearBrowserSelection = () => {
    window.getSelection()?.removeAllRanges()
  }

  const applyHighlight = useCallback(
    (color: TextHighlightColor) => {
      if (!toolbar || toolbar.kind !== 'selection') return

      const nextHighlight: StoredTextHighlight = {
        id: createHighlightId(),
        sectionId,
        text: toolbar.text,
        color,
        timestamp: Date.now(),
        anchors: toolbar.anchors,
      }
      const stored = readStoredTextHighlights(topicId)
      const withoutOverlaps = stored.filter(
        (highlight) =>
          highlight.sectionId !== sectionId ||
          !highlight.anchors.some((first) =>
            nextHighlight.anchors.some((second) =>
              highlightsOverlap(first, second),
            ),
          ),
      )
      const nextStored = [...withoutOverlaps, nextHighlight].slice(
        -MAX_HIGHLIGHTS_PER_TOPIC,
      )

      writeStoredTextHighlights(topicId, nextStored)
      setHighlights(
        nextStored.filter(
          (highlight) => highlight.sectionId === sectionId,
        ),
      )
      clearBrowserSelection()
      dismissToolbar()
    },
    [dismissToolbar, sectionId, toolbar, topicId],
  )

  const removeHighlight = useCallback(() => {
    if (!toolbar?.highlightId) return
    const nextStored = readStoredTextHighlights(topicId).filter(
      (highlight) => highlight.id !== toolbar.highlightId,
    )
    writeStoredTextHighlights(topicId, nextStored)
    setHighlights(
      nextStored.filter((highlight) => highlight.sectionId === sectionId),
    )
    clearBrowserSelection()
    dismissToolbar()
  }, [dismissToolbar, sectionId, toolbar?.highlightId, topicId])

  const askCompanion = useCallback(() => {
    if (!toolbar) return
    onAskCompanion(toolbar.text)
    clearBrowserSelection()
    dismissToolbar()
  }, [dismissToolbar, onAskCompanion, toolbar])

  return {
    highlights,
    toolbar,
    handleMouseUp,
    applyHighlight,
    removeHighlight,
    askCompanion,
    dismissToolbar,
  }
}

interface TextHighlightToolbarProps {
  state: HighlightToolbarState | null
  onHighlight: (color: TextHighlightColor) => void
  onRemove: () => void
  onAskCompanion: () => void
}

export function TextHighlightToolbar({
  state,
  onHighlight,
  onRemove,
  onAskCompanion,
}: TextHighlightToolbarProps) {
  if (!state || typeof document === 'undefined') return null

  const style = {
    '--highlight-toolbar-x': state.x + 'px',
    '--highlight-toolbar-y': state.y + 'px',
  } as CSSProperties

  return createPortal(
    <div
      className="gl-text-highlight-toolbar"
      role="toolbar"
      aria-label="Text highlight tools"
      style={style}
      onPointerDown={(event) => event.preventDefault()}
    >
      {state.kind === 'selection' ? (
        <>
          <button type="button" onClick={() => onHighlight('yellow')}>
            <span className="gl-highlight-swatch gl-highlight-swatch--yellow" />
            Highlight yellow
          </button>
          <button type="button" onClick={() => onHighlight('green')}>
            <span className="gl-highlight-swatch gl-highlight-swatch--green" />
            Highlight green
          </button>
        </>
      ) : (
        <button type="button" onClick={onRemove}>
          Remove highlight
        </button>
      )}
      <button type="button" onClick={onAskCompanion}>
        <WandSparkles size={13} aria-hidden="true" />
        Ask companion
      </button>
    </div>,
    document.body,
  )
}

function extractOrderedConcepts(body: string) {
  const markerPattern = /\b(First|Second|Third|Fourth|Fifth|Sixth):\s*/gi
  const markers: Array<{
    label: string
    markerStart: number
    contentStart: number
  }> = []
  let match = markerPattern.exec(body)

  while (match) {
    markers.push({
      label: match[0].trim(),
      markerStart: match.index,
      contentStart: markerPattern.lastIndex,
    })
    match = markerPattern.exec(body)
  }

  if (markers.length < 3) return null

  return {
    introduction: body.slice(0, markers[0].markerStart).trim(),
    items: markers.map((marker, index) => ({
      label: marker.label,
      body: body
        .slice(
          marker.contentStart,
          markers[index + 1]?.markerStart ?? body.length,
        )
        .trim(),
    })),
  }
}

export function KitabiSection({
  topicId,
  section,
  rewrite,
  isLoading,
  profile,
  topicTitle,
  topicSubtitle,
  subjectTitle,
  sectionIndex,
  totalSections,
  turnDirection,
  error = null,
  onLearnYourWay,
  onClearRewrite,
}: KitabiSectionProps) {
  const canPersonalize = Boolean(
    profile && profile.interest.trim().toLowerCase() !== 'neutral',
  )
  const readingDensity =
    section.body.length > 1050
      ? ' section-reading-dense'
      : section.body.length > 700
        ? ' section-reading-medium'
        : ''
  const visualBlockCount =
    Number(Boolean(section.diagram)) +
    Number(Boolean(section.equation)) +
    (section.callouts?.length ?? 0)
  const visualDensity =
    visualBlockCount >= 3 ? ' section-visual-dense' : ''
  const orderedConcepts = extractOrderedConcepts(section.body)
  const {
    highlights,
    toolbar,
    handleMouseUp,
    applyHighlight,
    removeHighlight,
    askCompanion,
  } = usePersistentTextHighlights({
    topicId: topicId ?? topicTitle,
    sectionId: section.id,
    onAskCompanion: () => onLearnYourWay(),
  })

  return (
    <section
      className={
        'section-spread kitabi-section page-turn-' +
        turnDirection +
        readingDensity +
        visualDensity
      }
      id={section.id}
      aria-busy={isLoading}
    >
      <div className="spread-left">
        <div className="page-running-head">
          <span className="page-lesson-number">
            Lesson {String(sectionIndex + 1).padStart(2, '0')}
          </span>
          <span>{subjectTitle}</span>
        </div>

        <div
          className={
            'page-topic-block' +
            (sectionIndex > 0 ? ' page-topic-block-continuation' : '')
          }
        >
          <h1 className="page-topic-title">{topicTitle}</h1>
          {sectionIndex === 0 && (
            <p className="page-topic-subtitle">{topicSubtitle}</p>
          )}
        </div>

        <div
          className={
            'lesson-editorial-grid' +
            (canPersonalize ? '' : ' lesson-editorial-grid-solo')
          }
        >
          <article className="lesson-narrative">
            <p className="section-kicker">Core reading</p>
            <h3 className="section-heading">{section.heading}</h3>

            <div
              className={
                'section-body' +
                (orderedConcepts ? ' section-body-structured' : '')
              }
              onMouseUp={handleMouseUp}
            >
              {orderedConcepts ? (
                <>
                  {orderedConcepts.introduction && (
                    <p
                      className="section-structured-intro"
                      data-gl-highlight-segment="ordered-intro"
                    >
                      {renderHighlightedText(
                        orderedConcepts.introduction,
                        section.keyTerms,
                        highlights,
                        'ordered-intro',
                      )}
                    </p>
                  )}
                  <ol className="textbook-concept-grid">
                    {orderedConcepts.items.map((item, index) => (
                      <li className="textbook-concept-card" key={item.label}>
                        <span className="textbook-concept-number">
                          {index + 1}
                        </span>
                        <div>
                          <span className="textbook-concept-label">
                            {item.label}
                          </span>
                          <p data-gl-highlight-segment={'ordered-' + index}>
                            {renderHighlightedText(
                              item.body,
                              section.keyTerms,
                              highlights,
                              'ordered-' + index,
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                section.body.split(/\n{2,}/).map((paragraph, index) => (
                  <p
                    className={index > 0 ? 'mt-4' : undefined}
                    data-gl-highlight-segment={'paragraph-' + index}
                    key={index}
                  >
                    {renderHighlightedText(
                      paragraph,
                      section.keyTerms,
                      highlights,
                      'paragraph-' + index,
                    )}
                  </p>
                ))
              )}
            </div>
            <TextHighlightToolbar
              state={toolbar}
              onHighlight={applyHighlight}
              onRemove={removeHighlight}
              onAskCompanion={askCompanion}
            />
          </article>

          {canPersonalize && (
            <aside
              className="lesson-lens-column"
              aria-label="Personalized learning lens"
            >
              <SectionErrorBoundary
                error={error}
                neutralAnalogy={
                  section.presetAnalogies?.neutral ??
                  'Use the original explanation above as the neutral reference.'
                }
                onRetry={onLearnYourWay}
              >
                {!rewrite && (
                  <div className="lens-invitation">
                    <span className="lens-invitation-icon" aria-hidden="true">
                      <WandSparkles size={16} />
                    </span>
                    <p className="lens-invitation-label">Personalized lens</p>
                    <h4>Connect this to {profile?.interest}</h4>
                    <p>
                      Generate one short analogy without changing the textbook text.
                    </p>
                    <div className="liyw-row">
                      <button
                        type="button"
                        className="liyw-button"
                        disabled={isLoading}
                        onClick={onLearnYourWay}
                      >
                        {isLoading ? (
                          <LoaderCircle
                            className="liyw-spinner"
                            size={14}
                            aria-hidden="true"
                          />
                        ) : (
                          <WandSparkles size={14} aria-hidden="true" />
                        )}
                        {isLoading ? 'Writing your analogy…' : 'Learn it your way'}
                      </button>
                    </div>
                  </div>
                )}

                {rewrite && (
                  <AnalogyPanel rewrite={rewrite} onClear={onClearRewrite} />
                )}
              </SectionErrorBoundary>
            </aside>
          )}
        </div>

        <footer className="book-page-footer">
          <span>Global Lab · {subjectTitle}</span>
          <span className="book-page-number">{sectionIndex * 2 + 2}</span>
        </footer>
      </div>

      <div className="spread-divider" aria-hidden="true" />

      <div className="spread-right">
        <div className="page-running-head page-running-head-right">
          <span>{topicTitle}</span>
          <span>
            Section {sectionIndex + 1} / {totalSections}
          </span>
        </div>

        <div className="visual-dashboard">
          <header className="visual-dashboard-header">
            <p>Visual study board</p>
            <h2>{section.heading}</h2>
            <span>Key relationships, evidence, and reference material.</span>
          </header>

          {section.keyTerms.length > 0 && (
            <section className="visual-keyterms" aria-label="Key concepts">
              <p>Key concepts</p>
              <div>
                {section.keyTerms.slice(0, 6).map((term) => (
                  <span className="visual-keyterm-chip" key={term}>
                    {term}
                  </span>
                ))}
              </div>
            </section>
          )}

          {section.diagram && (
            <div className="visual-diagram-slot">
              <DiagramBlock
                diagram={section.diagram}
                figureNumber={(sectionIndex + 1) + '.1'}
              />
            </div>
          )}

          {section.equation && (
            <section className="equation-card">
              <p className="equation-card-label">Core equation</p>
              <div
                className="equation-block"
                aria-label={'Equation for ' + section.heading}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(section.equation, {
                    throwOnError: false,
                    displayMode: true,
                  }),
                }}
              />
            </section>
          )}

          {section.callouts?.length ? (
            <div
              className={
                'visual-callout-grid' +
                (section.callouts.length === 1
                  ? ' visual-callout-grid-single'
                  : '')
              }
            >
              {section.callouts.map((callout) => (
                <CalloutBox key={callout.heading} callout={callout} />
              ))}
            </div>
          ) : null}

          {!section.diagram &&
            !section.equation &&
            (!section.callouts || section.callouts.length === 0) && (
              <section
                className="visual-summary-fallback"
                aria-label="Section summary"
              >
                <p className="visual-summary-label">Section at a glance</p>
                <ul className="visual-summary-list">
                  {section.keyTerms.slice(0, 6).map((term) => (
                    <li key={term} className="visual-summary-item">
                      <span className="visual-summary-term">{term}</span>
                    </li>
                  ))}
                </ul>
                {orderedConcepts && (
                  <div className="visual-summary-checkpoints">
                    <p className="visual-summary-checkpoints-label">
                      Concept checkpoints
                    </p>
                    <ol>
                      {orderedConcepts.items.map((item, index) => (
                        <li key={item.label}>
                          <span>{index + 1}</span>
                          <p>{highlightTerms(item.body, section.keyTerms)}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {!orderedConcepts && section.body && (
                  <blockquote className="visual-summary-pullquote">
                    {section.body.split(/\n{2,}/)[0]?.slice(0, 200)}
                    {(section.body.split(/\n{2,}/)[0]?.length ?? 0) > 200
                      ? '\u2026'
                      : ''}
                  </blockquote>
                )}
              </section>
            )}
        </div>

        <footer className="book-page-footer book-page-footer-right">
          <span className="book-page-number">{sectionIndex * 2 + 3}</span>
          <span>Read · Explore · Understand</span>
        </footer>
      </div>
    </section>
  )
}
