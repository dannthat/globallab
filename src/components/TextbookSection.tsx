import katex from 'katex'
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Maximize2,
  Minimize2,
  WandSparkles,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { KnowledgeSection, RewrittenSection, StudentProfile } from '../types'
import type {
  LearningOutcome,
  PersonalizationMode,
  PreferenceSuggestion,
} from '../personalization/types'
import { CalloutBox } from './CalloutBox'
import { DiagramBlock } from './DiagramBlock'
import { LearningCompanion } from './LearningCompanion'
import { PreferenceSuggestionCard } from './PreferenceSuggestionCard'
import { SectionErrorBoundary } from './SectionErrorBoundary'

interface TextbookSectionProps {
  section: KnowledgeSection
  rewrite: RewrittenSection | null
  isLoading: boolean
  profile: StudentProfile | null
  topicTitle: string
  topicSubtitle: string
  subjectTitle: string
  sectionIndex: number
  totalSections: number
  error?: string | null
  onLearnYourWay: () => void
  onRefine: (mode: PersonalizationMode) => void
  onOutcome: (mode: PersonalizationMode, outcome: LearningOutcome) => void
  onQuizResult: (mode: PersonalizationMode, score: number, total: number) => void
  onClearRewrite: () => void
  preferenceSuggestion?: PreferenceSuggestion | null
  onApplySuggestion: (suggestionId: string) => void
  onDeferSuggestion: (suggestionId: string) => void
  onNeverSuggest: (suggestionId: string) => void
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
    lookup.has(part.toLowerCase()) ? <strong key={index}>{part}</strong> : part,
  )
}

function extractOrderedConcepts(body: string) {
  const markerPattern = /\b(First|Second|Third|Fourth|Fifth|Sixth):\s*/gi
  const markers: Array<{ label: string; markerStart: number; contentStart: number }> = []
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
        .slice(marker.contentStart, markers[index + 1]?.markerStart ?? body.length)
        .trim(),
    })),
  }
}

interface ScrollablePageContentProps {
  id: string
  label: string
  measureKey: string
  side: 'left' | 'right'
  children: ReactNode
}

function ScrollablePageContent({
  id,
  label,
  measureKey,
  side,
  children,
}: ScrollablePageContentProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({
    hasOverflow: false,
    atEnd: false,
  })

  const measureScroll = useCallback(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    const hasOverflow = content.scrollHeight > viewport.clientHeight + 4
    const nextState = {
      hasOverflow,
      atEnd: hasOverflow && viewport.scrollTop >= maxScroll - 4,
    }

    setScrollState((current) =>
      current.hasOverflow === nextState.hasOverflow &&
      current.atEnd === nextState.atEnd
        ? current
        : nextState,
    )
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    measureScroll()
    const animationFrame =
      typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame(measureScroll)
        : null
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measureScroll)
    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(measureScroll)

    resizeObserver?.observe(viewport)
    resizeObserver?.observe(content)
    mutationObserver?.observe(content, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    })
    window.addEventListener('resize', measureScroll)

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('resize', measureScroll)
    }
  }, [measureScroll])

  useEffect(() => {
    void measureKey
    measureScroll()
  }, [measureKey, measureScroll])

  const moveThroughPage = () => {
    const viewport = viewportRef.current
    if (!viewport) return

    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    const nextTop = scrollState.atEnd
      ? 0
      : Math.min(
          maxScroll,
          viewport.scrollTop + Math.max(180, viewport.clientHeight * 0.72),
        )
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    viewport.scrollTo({
      top: nextTop,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  const handlePageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current
    if (!viewport || !scrollState.hasOverflow) return

    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    const pageStep = Math.max(180, viewport.clientHeight * 0.72)
    let nextTop: number | null = null

    if (event.key === 'PageDown') {
      nextTop = Math.min(maxScroll, viewport.scrollTop + pageStep)
    } else if (event.key === 'PageUp') {
      nextTop = Math.max(0, viewport.scrollTop - pageStep)
    } else if (event.key === 'Home') {
      nextTop = 0
    } else if (event.key === 'End') {
      nextTop = maxScroll
    }

    if (nextTop === null) return
    event.preventDefault()
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    viewport.scrollTo({
      top: nextTop,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <>
      <div
        className={
          `tbp-page-scroll tbp-page-scroll--${side}` +
          (scrollState.hasOverflow ? ' tbp-page-scroll--overflowing' : '') +
          (scrollState.atEnd ? ' tbp-page-scroll--at-end' : '')
        }
        id={id}
        ref={viewportRef}
        role={scrollState.hasOverflow ? 'region' : undefined}
        aria-label={scrollState.hasOverflow ? label : undefined}
        tabIndex={scrollState.hasOverflow ? 0 : -1}
        onScroll={measureScroll}
        onKeyDown={handlePageKeyDown}
      >
        <div className='tbp-page-scroll-flow' ref={contentRef}>
          {children}
        </div>
      </div>

      {scrollState.hasOverflow && (
        <>
          {!scrollState.atEnd && (
            <div className='tbp-page-scroll-fade' aria-hidden='true' />
          )}
          <button
            type='button'
            className={`tbp-page-scroll-control tbp-page-scroll-control--${side}`}
            aria-controls={id}
            aria-label={
              scrollState.atEnd
                ? `Return to the top of ${label}`
                : `Show more of ${label}`
            }
            onClick={moveThroughPage}
          >
            <span>{scrollState.atEnd ? 'Back to top' : 'More below'}</span>
            {scrollState.atEnd ? (
              <ChevronUp size={14} aria-hidden='true' />
            ) : (
              <ChevronDown size={14} aria-hidden='true' />
            )}
          </button>
        </>
      )}
    </>
  )
}

export function TextbookSection({
  section,
  rewrite,
  isLoading,
  profile,
  topicTitle,
  topicSubtitle,
  subjectTitle,
  sectionIndex,
  totalSections,
  error = null,
  onLearnYourWay,
  onRefine,
  onOutcome,
  onQuizResult,
  onClearRewrite,
  preferenceSuggestion = null,
  onApplySuggestion,
  onDeferSuggestion,
  onNeverSuggest,
}: TextbookSectionProps) {
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizRevealed, setQuizRevealed] = useState(false)
  const [companionViewOverride, setCompanionViewOverride] = useState<{
    artifactKey: string
    view: 'note' | 'page'
  } | null>(null)
  const companionArtifactKey = rewrite
    ? [rewrite.generatedAt, rewrite.mode, rewrite.sectionId].join(':')
    : ''
  const defaultCompanionView = rewrite?.mode === 'analogy' ? 'note' : 'page'
  const companionView =
    companionViewOverride?.artifactKey === companionArtifactKey
      ? companionViewOverride.view
      : defaultCompanionView
  const canPersonalize = Boolean(profile)
  const orderedConcepts = extractOrderedConcepts(section.body)
  const sectionNumber = String(sectionIndex + 1).padStart(2, '0')
  const figureNumber = `${sectionIndex + 1}.1`
  const equationHtml = section.equation
    ? katex.renderToString(section.equation, {
        throwOnError: false,
        displayMode: true,
      })
    : null
  const visualKind = section.diagram
    ? 'Scientific figure'
    : equationHtml
      ? 'Equation plate'
      : 'Concept index'

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- A new immutable artifact starts a new quiz attempt.
    setSelectedQuizOption(null)
    setQuizSubmitted(false)
    setQuizRevealed(false)
  }, [rewrite?.generatedAt, rewrite?.mode])

  const quiz = rewrite?.quiz
  const quizOptions = quiz?.options.map((label, index) => ({
    id: String(index),
    label,
  }))
  const selectedQuizIndex =
    selectedQuizOption === null ? -1 : Number.parseInt(selectedQuizOption, 10)
  const quizScore =
    quiz && selectedQuizIndex === quiz.correctIndex ? 1 : 0
  const companionQuiz = quiz
    ? {
        question: quiz.question,
        options: quizOptions ?? [],
        selectedOptionId: selectedQuizOption,
        submitted: quizSubmitted,
        revealed: quizRevealed,
        correctOptionId: String(quiz.correctIndex),
        feedback:
          quizSubmitted || quizRevealed
            ? quiz.explanation + ' Source evidence: “' + quiz.evidence + '”'
            : null,
        outcome:
          quizSubmitted || quizRevealed
            ? { score: quizScore, total: 1, ratio: quizScore }
            : null,
      }
    : null

  const equation = equationHtml ? (
    <section
      className={
        'tbp-equation' + (!section.diagram ? ' tbp-equation--hero' : '')
      }
      aria-labelledby={`${section.id}-equation-label`}
    >
      <p className="tbp-equation-label" id={`${section.id}-equation-label`}>
        Core equation
      </p>
      <div
        className="tbp-equation-math"
        aria-label={`Equation for ${section.heading}`}
        dangerouslySetInnerHTML={{ __html: equationHtml }}
      />
    </section>
  ) : null

  const companionPanel = rewrite ? (
    <aside
      className={
        'tbp-sticky-analogy ' +
        `tbp-sticky-analogy--${companionView}`
      }
      aria-label='Personalized learning companion'
    >
      <div className='tbp-sticky-meta'>
        <div>
          <p className='tbp-sticky-kicker'>Learn your way</p>
          <span>{rewrite.interest || 'source-grounded'} lens</span>
        </div>
        <button
          type='button'
          className='tbp-companion-view-toggle'
          onClick={() =>
            setCompanionViewOverride({
              artifactKey: companionArtifactKey,
              view: companionView === 'page' ? 'note' : 'page',
            })
          }
          aria-label={
            companionView === 'page'
              ? 'Return to the scientific figure'
              : 'Open this help as a full study sheet'
          }
        >
          {companionView === 'page' ? (
            <Minimize2 size={13} aria-hidden='true' />
          ) : (
            <Maximize2 size={13} aria-hidden='true' />
          )}
          {companionView === 'page' ? 'Show figure' : 'Study sheet'}
        </button>
      </div>
      <LearningCompanion
        sourceAnchor={rewrite.source}
        interest={rewrite.interest}
        mode={rewrite.mode}
        title={rewrite.title}
        content={rewrite.content}
        limits={rewrite.analogyLimits}
        isLoading={isLoading}
        error={error}
        quiz={companionQuiz}
        onAction={onRefine}
        onOutcome={(outcome) => onOutcome(rewrite.mode, outcome)}
        onSelectQuizOption={setSelectedQuizOption}
        onSubmitQuiz={(optionId) => {
          const selected = Number.parseInt(optionId, 10)
          const score =
            rewrite.quiz && selected === rewrite.quiz.correctIndex ? 1 : 0
          setSelectedQuizOption(optionId)
          setQuizSubmitted(true)
          setQuizRevealed(false)
          onQuizResult(rewrite.mode, score, 1)
        }}
        onRevealQuiz={() => {
          if (!quizSubmitted && !quizRevealed) {
            onQuizResult(rewrite.mode, 0, 1)
          }
          setQuizRevealed(true)
        }}
        onRetry={() => onRefine(rewrite.mode)}
        onDismiss={onClearRewrite}
      />
      {preferenceSuggestion && (
        <PreferenceSuggestionCard
          suggestion={preferenceSuggestion}
          onApply={(suggestion) => onApplySuggestion(suggestion.id)}
          onNotNow={(suggestion) => onDeferSuggestion(suggestion.id)}
          onNeverSuggest={(suggestion) => onNeverSuggest(suggestion.id)}
        />
      )}
    </aside>
  ) : null

  return (
    <article
      className="tbp-article textbook-spread"
      id={section.id}
      aria-busy={isLoading}
    >
      <section
        className="textbook-page textbook-page-left"
        aria-labelledby={`${section.id}-heading`}
      >
        <ScrollablePageContent
          id={`${section.id}-reading-page`}
          label={`${section.heading} reading page`}
          measureKey={`${section.id}:${companionArtifactKey}:${companionView}:${isLoading}:${preferenceSuggestion?.id ?? ''}`}
          side='left'
        >
        <div className="tbp-running-head">
          <span>{subjectTitle}</span>
          <span>
            Lesson {sectionNumber} / {String(totalSections).padStart(2, '0')}
          </span>
        </div>

        <header className="tbp-section-head tbp-editorial-heading">
          <p className="tbp-section-num" aria-hidden="true">
            {sectionNumber}
          </p>
          <div className="tbp-section-title-block">
            <p className="tbp-section-kicker">{topicTitle}</p>
            <h1 className="tbp-section-heading" id={`${section.id}-heading`}>
              {section.heading}
            </h1>
            <p className="tbp-section-deck">{topicSubtitle}</p>
          </div>
        </header>

        <p className="tbp-core-label">Core explanation</p>

        <div
          className={
            'tbp-body' + (orderedConcepts ? ' tbp-body--ordered' : '')
          }
        >
          {orderedConcepts ? (
            <>
              {orderedConcepts.introduction && (
                <p className="tbp-body-lead">
                  {highlightTerms(orderedConcepts.introduction, section.keyTerms)}
                </p>
              )}
              <ol className="tbp-concept-list">
                {orderedConcepts.items.map((item, index) => (
                  <li key={item.label} className="tbp-concept-item">
                    <span className="tbp-concept-num">{index + 1}</span>
                    <div>
                      <span className="tbp-concept-label">{item.label}</span>
                      <p>{highlightTerms(item.body, section.keyTerms)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            section.body.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} className={index === 0 ? 'tbp-body-lead' : undefined}>
                {highlightTerms(paragraph, section.keyTerms)}
              </p>
            ))
          )}
        </div>

        {canPersonalize && !rewrite && (
          <div className="tbp-learn-zone">
            <SectionErrorBoundary
              error={error}
              neutralAnalogy={
                section.presetAnalogies?.neutral ??
                'Use the original explanation above as the neutral reference.'
              }
              onRetry={onLearnYourWay}
            >
              <div className="tbp-learn-invitation">
                <span className="tbp-learn-icon" aria-hidden="true">
                  <WandSparkles size={15} />
                </span>
                <div className="tbp-learn-copy">
                  <p className="tbp-learn-eyebrow">Learn your way</p>
                  <h2 className="tbp-learn-heading">
                    {profile?.interest.trim().toLowerCase() === 'neutral'
                      ? 'Make this explanation work for you'
                      : `Connect this to ${profile?.interest}`}
                  </h2>
                  <p className="tbp-learn-desc">
                    Get the best starting format, then choose simpler, more
                    detailed, steps, another example, or a quick check. The
                    textbook explanation will not change.
                  </p>
                </div>
                <button
                  type="button"
                  className="tbp-learn-btn"
                  disabled={isLoading}
                  onClick={onLearnYourWay}
                >
                  {isLoading ? (
                    <LoaderCircle
                      className="liyw-spinner"
                      size={13}
                      aria-hidden="true"
                    />
                  ) : (
                    <WandSparkles size={13} aria-hidden="true" />
                  )}
                  {isLoading ? 'Creating…' : 'Learn your way'}
                </button>
              </div>
            </SectionErrorBoundary>
          </div>
        )}

        {rewrite && companionView === 'note' && companionPanel}

        </ScrollablePageContent>

        <footer className="tbp-page-footer">
          <span>Global Lab · {subjectTitle}</span>
          <span className="tbp-page-number">{sectionIndex * 2 + 2}</span>
        </footer>
      </section>

      <div className="textbook-spine" aria-hidden="true" />

      <section
        className={
          'textbook-page textbook-page-right' +
          (rewrite ? ` tbp-companion-${companionView}` : '')
        }
        aria-label={
          rewrite && companionView === 'page'
            ? 'Personalized study sheet for ' + section.heading
            : 'Visual references for ' + section.heading
        }
      >
        <ScrollablePageContent
          id={`${section.id}-reference-page`}
          label={`${section.heading} reference page`}
          measureKey={`${section.id}:${companionArtifactKey}:${companionView}:${isLoading}`}
          side='right'
        >
        <div className="tbp-running-head">
          <span>Figure &amp; reference</span>
          <span>Page {sectionIndex * 2 + 3}</span>
        </div>

        <header className="tbp-plate-heading">
          <p className="tbp-plate-number">Plate {figureNumber}</p>
          <p className="tbp-plate-kind">{visualKind}</p>
        </header>

        <div className="tbp-reference-layout">
          <div className="tbp-reference-primary">
            <div
              className={
                'tbp-reference-hero' +
                (rewrite && companionView === 'page'
                  ? ' tbp-reference-hero--with-analogy'
                  : '') +
                (rewrite && companionView === 'page'
                  ? ' tbp-reference-hero--companion-page'
                  : '')
              }
            >
              <div
                className={
                  'tbp-visual-field ' +
                  (section.diagram
                    ? 'tbp-visual-field--diagram'
                    : equationHtml
                      ? 'tbp-visual-field--equation'
                      : 'tbp-visual-field--index')
                }
              >
                {section.diagram && (
                  <div className="tbp-diagram">
                    <DiagramBlock
                      diagram={section.diagram}
                      figureNumber={figureNumber}
                    />
                  </div>
                )}

                {!section.diagram && (
                  <div className="tbp-reference-plate">
                    <span className="tbp-reference-monogram" aria-hidden="true">
                      {sectionNumber}
                    </span>
                    <div>
                      <p className="tbp-reference-label">Concept index</p>
                      <ol className="tbp-reference-list">
                        {section.keyTerms.slice(0, 6).map((term, index) => (
                          <li key={term}>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            {term}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {rewrite && companionView === 'page' && companionPanel}
            </div>

            {equation}
          </div>

          <div
            className={
              'tbp-reference-notes-grid' +
              (rewrite && companionView === 'page'
                ? ' tbp-reference-notes-grid--companion-hidden'
                : '')
            }
          >

        {section.callouts && section.callouts.length > 0 && (
          <section className="tbp-supporting-notes" aria-label="Supporting notes">
            <p className="tbp-supporting-notes-label">Margin notes</p>
            <div
              className={
                'tbp-callouts' +
                (section.callouts.length >= 2 ? ' tbp-callouts--two' : '')
              }
            >
              {section.callouts.map((callout) => (
                <CalloutBox key={callout.heading} callout={callout} />
              ))}
            </div>
          </section>
        )}

        {section.keyTerms.length > 0 &&
          (Boolean(section.diagram) || Boolean(equationHtml)) && (
            <aside className="tbp-term-index" aria-label="Key terms">
              <p className="tbp-term-index-label">Key terms</p>
              <ul className="tbp-term-index-list">
                {section.keyTerms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </aside>
          )}
          </div>
        </div>

        </ScrollablePageContent>

        <footer className="tbp-page-footer">
          <span>{topicTitle}</span>
          <span className="tbp-page-number">{sectionIndex * 2 + 3}</span>
        </footer>
      </section>
    </article>
  )
}
