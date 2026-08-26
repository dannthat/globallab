import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type {
  KnowledgeSection,
  KnowledgeTopic,
  SectionRewrites,
  StudentProfile,
  Subject,
} from '../types'
import type {
  LearningOutcome,
  PersonalizationMode,
  PreferenceSuggestion,
} from '../personalization/types'
import { getSectionRewriteKey } from '../hooks/useLearnYourWay'
import { RunningHeader } from './RunningHeader'
import { SourcesFooter } from './SourcesFooter'
import { TextbookSection } from './TextbookSection'

interface KitabiPageProps {
  topic: KnowledgeTopic
  subject: Subject
  subjectColor: string
  profile: StudentProfile | null
  isDark: boolean
  onToggleDark: () => void
  onSaveInterest: (interest: string) => void
  rewrites: SectionRewrites
  loadingSectionId: string | null
  error?: string | null
  errorSectionId?: string | null
  onLearnYourWay: (section: KnowledgeSection) => void
  onRefine: (section: KnowledgeSection, mode: PersonalizationMode) => void
  onOutcome: (
    rewrite: SectionRewrites[string],
    outcome: LearningOutcome,
  ) => void
  onQuizResult: (
    rewrite: SectionRewrites[string],
    score: number,
    total: number,
  ) => void
  onClearRewrite: (sectionId: string) => void
  preferenceSuggestion?: PreferenceSuggestion | null
  onApplySuggestion: (suggestionId: string) => void
  onDeferSuggestion: (suggestionId: string) => void
  onNeverSuggest: (suggestionId: string) => void
  onBack: () => void
}

type PageTurn = {
  fromIndex: number
  toIndex: number
  direction: 'next' | 'previous'
}

const PAGE_TURN_MIDPOINT_MS = 480
const PAGE_TURN_FALLBACK_MS = 1200

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface PageTurnPreviewProps {
  section: KnowledgeSection
  side: 'left' | 'right'
  subjectTitle: string
}

function PageTurnPreview({
  section,
  side,
  subjectTitle,
}: PageTurnPreviewProps) {
  const previewText = section.body.replace(/\s+/g, ' ').trim().slice(0, 460)

  return (
    <div className={`page-turn-preview page-turn-preview-${side}`}>
      <div className="page-turn-preview-head">
        <span>{subjectTitle}</span>
        <span>{side === 'left' ? 'Core reading' : 'Figure & reference'}</span>
      </div>

      {side === 'left' ? (
        <>
          <p className="page-turn-preview-kicker">Next section</p>
          <h3>{section.heading}</h3>
          <p className="page-turn-preview-copy">{previewText}…</p>
        </>
      ) : (
        <>
          <p className="page-turn-preview-kicker">Plate preview</p>
          {section.diagram ? (
            <img src={section.diagram.url} alt="" />
          ) : (
            <div className="page-turn-preview-notes">
              {(section.callouts?.slice(0, 2) ?? []).map((callout) => (
                <div key={callout.heading}>
                  <strong>{callout.heading}</strong>
                  <span>{callout.body.slice(0, 110)}</span>
                </div>
              ))}
              {!section.callouts?.length &&
                section.keyTerms.slice(0, 4).map((term, index) => (
                  <div key={term}>
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    <span>{term}</span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function KitabiPage({
  topic,
  subject,
  subjectColor,
  profile,
  isDark,
  onToggleDark,
  onSaveInterest,
  rewrites,
  loadingSectionId,
  error = null,
  errorSectionId = null,
  onLearnYourWay,
  onRefine,
  onOutcome,
  onQuizResult,
  onClearRewrite,
  preferenceSuggestion = null,
  onApplySuggestion,
  onDeferSuggestion,
  onNeverSuggest,
  onBack,
}: KitabiPageProps) {
  const [visibleSectionIndex, setVisibleSectionIndex] = useState(0)
  const [pageTurn, setPageTurn] = useState<PageTurn | null>(null)
  const activeTurnRef = useRef<PageTurn | null>(null)
  const midpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeSection =
    topic.sections[visibleSectionIndex] ?? topic.sections[0]

  const clearTurnTimers = useCallback(() => {
    if (midpointTimerRef.current !== null) {
      clearTimeout(midpointTimerRef.current)
      midpointTimerRef.current = null
    }

    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const finishPageTurn = useCallback(
    (transition: PageTurn) => {
      if (activeTurnRef.current !== transition) return

      clearTurnTimers()
      setVisibleSectionIndex(transition.toIndex)
      activeTurnRef.current = null
      setPageTurn(null)
    },
    [clearTurnTimers],
  )

  useEffect(() => {
    return () => {
      clearTurnTimers()
      activeTurnRef.current = null
    }
  }, [clearTurnTimers])

  const openSection = useCallback(
    (requestedIndex: number) => {
      const nextIndex = Math.max(
        0,
        Math.min(requestedIndex, topic.sections.length - 1),
      )

      if (
        nextIndex === visibleSectionIndex ||
        pageTurn ||
        activeTurnRef.current
      ) {
        return
      }

      if (prefersReducedMotion()) {
        clearTurnTimers()
        activeTurnRef.current = null
        setPageTurn(null)
        setVisibleSectionIndex(nextIndex)
        return
      }

      const transition: PageTurn = {
        fromIndex: visibleSectionIndex,
        toIndex: nextIndex,
        direction: nextIndex > visibleSectionIndex ? 'next' : 'previous',
      }

      activeTurnRef.current = transition
      setPageTurn(transition)

      midpointTimerRef.current = setTimeout(() => {
        if (activeTurnRef.current !== transition) return

        setVisibleSectionIndex(transition.toIndex)
        midpointTimerRef.current = null
      }, PAGE_TURN_MIDPOINT_MS)

      fallbackTimerRef.current = setTimeout(
        () => finishPageTurn(transition),
        PAGE_TURN_FALLBACK_MS,
      )
    },
    [
      clearTurnTimers,
      finishPageTurn,
      pageTurn,
      topic.sections.length,
      visibleSectionIndex,
    ],
  )

  useEffect(() => {
    if (!pageTurn) return

    const handler = (event: AnimationEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      if (!event.target.classList.contains('textbook-page-turn-sheet')) return
      finishPageTurn(pageTurn)
    }

    document.addEventListener('animationend', handler)
    return () => document.removeEventListener('animationend', handler)
  }, [finishPageTurn, pageTurn])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.matches('input,textarea,select,button') ||
          target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        openSection(visibleSectionIndex + 1)
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        openSection(visibleSectionIndex - 1)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSection, visibleSectionIndex])

  const handleBookClick = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (
      target.closest(
        'button, a, input, textarea, select, label, .tbp-page-scroll',
      )
    ) {
      return
    }

    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const relativeX = (event.clientX - bounds.left) / bounds.width

    // Keep the reading surface inert. Only the outer page edges behave like
    // physical page corners; the dock and arrow keys remain the primary controls.
    if (relativeX <= 0.1) openSection(visibleSectionIndex - 1)
    if (relativeX >= 0.9) openSection(visibleSectionIndex + 1)
  }

  const rewrite = activeSection
    ? rewrites[
        getSectionRewriteKey(
          topic.id,
          activeSection.id,
          profile?.interest ?? 'neutral',
        )
      ] ?? null
    : null

  const turnFromSection = pageTurn
    ? topic.sections[pageTurn.fromIndex]
    : null
  const turnToSection = pageTurn ? topic.sections[pageTurn.toIndex] : null
  const turnFrontSection = pageTurn?.direction === 'next'
    ? turnFromSection
    : turnToSection
  const turnBackSection = pageTurn?.direction === 'next'
    ? turnToSection
    : turnFromSection

  return (
    <div
      className="kitabi-shell"
      style={{ '--subject-color': subjectColor } as CSSProperties}
    >
      <RunningHeader
        subject={subject}
        topic={topic}
        profile={profile}
        subjectColor={subjectColor}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onSaveInterest={onSaveInterest}
        onBack={onBack}
      />

      <div className="textbook-reader-wrap">
        <div className="textbook-reader-stage">
          <main
            className="textbook-reader-page"
            id="main-content"
            aria-busy={Boolean(pageTurn)}
            data-section={activeSection?.id}
            data-turn-direction={pageTurn?.direction}
            onClick={handleBookClick}
          >
            {activeSection && (
              <p
                className={'sr-only'}
                role={'status'}
                aria-live={'polite'}
                aria-atomic={true}
              >
                Section {visibleSectionIndex + 1} of {topic.sections.length}:{' '}
                {activeSection.heading}
              </p>
            )}

            {activeSection && (
              <TextbookSection
                key={activeSection.id}
                section={activeSection}
                rewrite={rewrite}
                isLoading={loadingSectionId === activeSection.id}
                profile={profile}
                topicTitle={topic.title}
                topicSubtitle={topic.subtitle}
                subjectTitle={subject.title}
                sectionIndex={visibleSectionIndex}
                totalSections={topic.sections.length}
                error={errorSectionId === activeSection.id ? error : null}
                onLearnYourWay={() => onLearnYourWay(activeSection)}
                onRefine={(mode) => onRefine(activeSection, mode)}
                onOutcome={(_mode, outcome) => {
                  if (rewrite) onOutcome(rewrite, outcome)
                }}
                onQuizResult={(_mode, score, total) => {
                  if (rewrite) onQuizResult(rewrite, score, total)
                }}
                onClearRewrite={() => onClearRewrite(activeSection.id)}
                preferenceSuggestion={preferenceSuggestion}
                onApplySuggestion={onApplySuggestion}
                onDeferSuggestion={onDeferSuggestion}
                onNeverSuggest={onNeverSuggest}
              />
            )}

            <SourcesFooter source={topic.source} />

            {pageTurn && turnFrontSection && turnBackSection && (
              <div
                className={`textbook-page-turn textbook-page-turn-${pageTurn.direction}`}
                aria-hidden="true"
              >
                <div className="textbook-page-turn-sheet">
                  <div className="textbook-page-turn-face textbook-page-turn-front">
                    <PageTurnPreview
                      section={turnFrontSection}
                      side="right"
                      subjectTitle={subject.title}
                    />
                  </div>
                  <div className="textbook-page-turn-face textbook-page-turn-back">
                    <PageTurnPreview
                      section={turnBackSection}
                      side="left"
                      subjectTitle={subject.title}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>

          <nav
            className="textbook-bottom-nav textbook-bottom-nav--spread"
            aria-label="Navigate textbook sections"
          >
            <button
              type="button"
              className="textbook-nav-arrow"
              disabled={visibleSectionIndex === 0 || Boolean(pageTurn)}
              onClick={() => openSection(visibleSectionIndex - 1)}
              aria-label="Previous section"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>

            <div
              className="textbook-nav-progress"
              style={
                {
                  '--reader-progress': `${
                    ((visibleSectionIndex + 1) / topic.sections.length) * 100
                  }%`,
                } as CSSProperties
              }
            >
              <BookOpen size={14} aria-hidden="true" />
              <span className="textbook-nav-label">Section</span>
              <div className="textbook-nav-dots">
                {topic.sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    className={
                      'textbook-nav-dot' +
                      (index === visibleSectionIndex
                        ? ' textbook-nav-dot-active'
                        : '')
                    }
                    disabled={Boolean(pageTurn)}
                    onClick={() => openSection(index)}
                    aria-label={section.heading}
                    aria-current={
                      index === visibleSectionIndex ? 'page' : undefined
                    }
                    title={section.heading}
                  />
                ))}
              </div>
              <span className="textbook-nav-count" aria-live="polite">
                {String(visibleSectionIndex + 1).padStart(2, '0')} /{' '}
                {String(topic.sections.length).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              className="textbook-nav-arrow"
              disabled={
                visibleSectionIndex === topic.sections.length - 1 ||
                Boolean(pageTurn)
              }
              onClick={() => openSection(visibleSectionIndex + 1)}
              aria-label="Next section"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
