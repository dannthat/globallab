import {
  BrainCircuit,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type {
  KnowledgeSection,
  KnowledgeTopic,
  SectionRewrites,
  StudentProfile,
  Subject,
} from '../types'
import { subjects } from '../knowledge'
import type {
  LearningOutcome,
  PersonalizationMode,
  PreferenceSuggestion,
} from '../personalization/types'
import { getSectionRewriteKey } from '../hooks/useLearnYourWay'
import { RunningHeader } from './RunningHeader'
import { SourcesFooter } from './SourcesFooter'
import { TextbookSection } from './TextbookSection'

const preloadTopicQuizModal = () => import('./TopicQuizModal')

const TopicQuizModal = lazy(async () => {
  const module = await preloadTopicQuizModal()
  return { default: module.TopicQuizModal }
})

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
  onSelectTopic?: (topic: KnowledgeTopic, subject: Subject) => void
  onBack: () => void
}

type PageTurn = {
  fromIndex: number
  toIndex: number
  direction: 'next' | 'previous'
}

type ReaderOverlay = 'contents' | 'topic-switcher' | 'mastery' | null

interface TopicOption {
  topic: KnowledgeTopic
  subject: Subject
  searchText: string
  order: number
}

const PAGE_TURN_MIDPOINT_MS = 240
const PAGE_TURN_FALLBACK_MS = 800

const TOPIC_OPTIONS: TopicOption[] = subjects
  .filter((candidate) => !candidate.comingSoon)
  .flatMap((candidate) =>
    candidate.topics.map((candidateTopic) => ({
      topic: candidateTopic,
      subject: candidate,
      searchText: [
        candidate.title,
        candidateTopic.title,
        candidateTopic.subtitle,
      ]
        .join(' ')
        .toLocaleLowerCase(),
      order: 0,
    })),
  )
  .map((option, order) => ({ ...option, order }))

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

function fuzzyTopicScore(option: TopicOption, rawQuery: string) {
  const query = normalizeSearch(rawQuery)
  if (!query) return option.order

  const directIndex = option.searchText.indexOf(query)
  if (directIndex >= 0) return directIndex

  const tokens = query.split(' ')
  if (
    tokens.every((token) =>
      option.searchText.split(/\s+/).some((word) => word.startsWith(token)),
    )
  ) {
    return 100 + tokens.length
  }

  let textIndex = 0
  let queryIndex = 0
  while (
    textIndex < option.searchText.length &&
    queryIndex < query.length
  ) {
    if (option.searchText[textIndex] === query[queryIndex]) queryIndex += 1
    textIndex += 1
  }

  return queryIndex === query.length ? 500 + textIndex : Number.POSITIVE_INFINITY
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function shouldUseFlatPageTransition() {
  if (prefersReducedMotion()) return true
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 1023px)').matches
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
          <p className="page-turn-preview-copy">{previewText}â€¦</p>
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
  onSelectTopic,
  onBack,
}: KitabiPageProps) {
  const [visibleSectionIndex, setVisibleSectionIndex] = useState(0)
  const [pageTurn, setPageTurn] = useState<PageTurn | null>(null)
  const [activeOverlay, setActiveOverlay] = useState<ReaderOverlay>(null)
  const [quickTopicQuery, setQuickTopicQuery] = useState('')
  const [activeTopicOptionIndex, setActiveTopicOptionIndex] = useState(0)
  const [isReducedMotionFade, setIsReducedMotionFade] = useState(false)
  const activeTurnRef = useRef<PageTurn | null>(null)
  const midpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quickTopicInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void preloadTopicQuizModal()
      .then((module) => module.preloadTopicQuizPool(topic.id, subject.id))
      .catch(() => undefined)
  }, [subject.id, topic.id])

  const activeSection =
    topic.sections[visibleSectionIndex] ?? topic.sections[0]
  const rewrite = activeSection
    ? rewrites[
        getSectionRewriteKey(
          topic.id,
          activeSection.id,
          profile?.interest ?? 'neutral',
        )
      ] ?? null
    : null

  const clearTurnTimers = useCallback(() => {
    if (midpointTimerRef.current !== null) {
      clearTimeout(midpointTimerRef.current)
      midpointTimerRef.current = null
    }

    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    if (reducedFadeTimerRef.current !== null) {
      clearTimeout(reducedFadeTimerRef.current)
      reducedFadeTimerRef.current = null
    }
  }, [])

  const filteredTopicOptions = useMemo(
    () =>
      TOPIC_OPTIONS.map((option) => ({
        option,
        score: fuzzyTopicScore(option, quickTopicQuery),
      }))
        .filter(({ score }) => Number.isFinite(score))
        .sort(
          (first, second) =>
            first.score - second.score ||
            first.option.order - second.option.order,
        )
        .map(({ option }) => option),
    [quickTopicQuery],
  )

  useEffect(() => {
    if (activeOverlay !== 'topic-switcher') return
    quickTopicInputRef.current?.focus()
  }, [activeOverlay])

  const openQuickTopicSwitcher = useCallback(() => {
    setQuickTopicQuery('')
    setActiveTopicOptionIndex(0)
    setActiveOverlay('topic-switcher')
  }, [])

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null)
  }, [])

  const selectTopicOption = useCallback(
    (option: TopicOption) => {
      closeOverlay()
      if (option.topic.id === topic.id && option.subject.id === subject.id) {
        return
      }
      onSelectTopic?.(option.topic, option.subject)
    },
    [closeOverlay, onSelectTopic, subject.id, topic.id],
  )

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

      if (shouldUseFlatPageTransition()) {
        clearTurnTimers()
        activeTurnRef.current = null
        setPageTurn(null)
        setIsReducedMotionFade(true)
        setVisibleSectionIndex(nextIndex)
        reducedFadeTimerRef.current = setTimeout(() => {
          setIsReducedMotionFade(false)
          reducedFadeTimerRef.current = null
        }, 180)
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
      if (
        event.animationName &&
        event.animationName !== 'turnPageForward' &&
        event.animationName !== 'turnPageBackward'
      ) {
        return
      }
      finishPageTurn(pageTurn)
    }

    document.addEventListener('animationend', handler)
    return () => document.removeEventListener('animationend', handler)
  }, [finishPageTurn, pageTurn])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.isComposing) return

      const commandPaletteShortcut =
        (event.code === 'KeyK' ||
          event.key.toLocaleLowerCase() === 'k') &&
        (event.metaKey || event.ctrlKey)
      if (commandPaletteShortcut) {
        event.preventDefault()
        if (activeOverlay === 'topic-switcher') {
          closeOverlay()
        } else {
          openQuickTopicSwitcher()
        }
        return
      }

      if (event.key === 'Escape') {
        if (activeOverlay) {
          event.preventDefault()
          closeOverlay()
          return
        }

        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) {
          selection.removeAllRanges()
          return
        }
      }

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.matches(
          'input,textarea,select,button,a,[role=dialog],[data-reader-hotkeys=off]',
        ) ||
          target.isContentEditable ||
          target.closest('[contenteditable=true]'))
      ) {
        return
      }

      if (event.defaultPrevented) return
      if (
        (event.code === 'KeyT' ||
          event.key.toLocaleLowerCase() === 't') &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        activeOverlay !== 'topic-switcher'
      ) {
        event.preventDefault()
        setActiveOverlay((current) =>
          current === 'contents' ? null : 'contents',
        )
        return
      }
      if (activeOverlay) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return

      const goNext =
        event.key === 'ArrowRight' ||
        event.code === 'KeyK' ||
        event.key.toLocaleLowerCase() === 'k' ||
        event.key === 'PageDown'
      const goPrevious =
        event.key === 'ArrowLeft' ||
        event.code === 'KeyJ' ||
        event.key.toLocaleLowerCase() === 'j' ||
        event.key === 'PageUp'

      if (goNext || goPrevious) {
        event.preventDefault()
        openSection(
          visibleSectionIndex + (goNext ? 1 : -1),
        )
        return
      }

      if (
        event.code === 'KeyD' ||
        event.key.toLocaleLowerCase() === 'd'
      ) {
        event.preventDefault()
        onToggleDark()
        return
      }

      if (event.key === 'Escape') {
        if (preferenceSuggestion) {
          event.preventDefault()
          onDeferSuggestion(preferenceSuggestion.id)
          return
        }
        if (rewrite && activeSection) {
          event.preventDefault()
          onClearRewrite(activeSection.id)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    activeOverlay,
    activeSection,
    closeOverlay,
    onClearRewrite,
    onDeferSuggestion,
    onToggleDark,
    openQuickTopicSwitcher,
    openSection,
    preferenceSuggestion,
    rewrite,
    visibleSectionIndex,
  ])

  const handleBookClick = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (
      target.closest(
        'button, a, input, textarea, select, label, mark[data-highlight-id], .tbp-page-scroll',
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

  const handleQuickTopicKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeOverlay()
      return
    }

    if (
      (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
      filteredTopicOptions.length > 0
    ) {
      event.preventDefault()
      event.stopPropagation()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveTopicOptionIndex(
        (current) =>
          (current + direction + filteredTopicOptions.length) %
          filteredTopicOptions.length,
      )
      return
    }

    if (event.key === 'Enter') {
      const selected =
        filteredTopicOptions[activeTopicOptionIndex] ??
        filteredTopicOptions[0]
      if (!selected) return
      event.preventDefault()
      event.stopPropagation()
      selectTopicOption(selected)
    }
  }

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
      className="kitabi-shell ubr-reader-shell"
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

      <div className="ubr-reader-body tbp-reader-body">
        {/* Left nav strip — vertical section dots */}
        <nav className="tbp-left-strip" aria-label="Section navigation">
          {topic.sections.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              className={'tbp-left-dot' + (idx === visibleSectionIndex ? ' tbp-left-dot--active' : '')}
              onClick={() => openSection(idx)}
              aria-label={`Go to section: ${sec.heading}`}
              title={sec.heading}
              disabled={Boolean(pageTurn)}
            />
          ))}
        </nav>

        <div className="ubr-reader-stage">
          <main
            className={
              'textbook-reader-page' +
              (isReducedMotionFade ? ' reader-spread-crossfade' : '')
            }
            id="main-content"
            aria-busy={Boolean(pageTurn)}
            data-section={activeSection?.id}
            data-turn-direction={pageTurn?.direction}
            data-turn-phase={
              pageTurn
                ? visibleSectionIndex === pageTurn.toIndex
                  ? 'arriving'
                  : 'leaving'
                : undefined
            }
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
                topicId={topic.id}
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
                <div
                  className={
                    'textbook-page-turn-sheet page-leaf ' +
                    (pageTurn.direction === 'next'
                      ? 'page-turning-forward'
                      : 'page-turning-backward')
                  }
                >
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
            className="ubr-reader-nav"
            aria-label="Navigate textbook sections"
          >
            <button
              type="button"
              className="ubr-nav-arrow"
              disabled={visibleSectionIndex === 0 || Boolean(pageTurn)}
              onClick={() => openSection(visibleSectionIndex - 1)}
              aria-label="Previous section"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>

            <div
              className="ubr-nav-progress"
              style={
                {
                  '--reader-progress': `${
                    ((visibleSectionIndex + 1) / topic.sections.length) * 100
                  }%`,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className="ubr-nav-contents"
                aria-label="Open table of contents"
                aria-expanded={activeOverlay === 'contents'}
                aria-keyshortcuts="T"
                onClick={() =>
                  setActiveOverlay((current) =>
                    current === 'contents' ? null : 'contents',
                  )
                }
                title="Contents (T)"
              >
                <BookOpen size={14} aria-hidden="true" />
              </button>
              <span className="ubr-nav-label">Section</span>
              <div className="ubr-nav-dots">
                {topic.sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    className={
                      'ubr-nav-dot' +
                      (index === visibleSectionIndex
                        ? ' ubr-nav-dot--active'
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
              <span className="ubr-nav-count" aria-live="polite">
                {String(visibleSectionIndex + 1).padStart(2, '0')} /{' '}
                {String(topic.sections.length).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              className="ubr-nav-arrow"
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

          <button
            type="button"
            className="topic-mastery-trigger"
            onClick={() => setActiveOverlay('mastery')}
            aria-haspopup="dialog"
            aria-label="Test Your Mastery"
          >
            <span className="topic-mastery-trigger-icon" aria-hidden="true">
              <BrainCircuit size={18} />
            </span>
            <span>
              <small>5-question topic check</small>
              <strong>Test Your Mastery</strong>
            </span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {activeOverlay === 'contents' && (
        <div
          className="reader-overlay reader-overlay--contents"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOverlay()
          }}
        >
          <aside
            className="reader-contents-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-contents-title"
          >
            <header>
              <div>
                <p>{subject.title}</p>
                <h2 id="reader-contents-title">Table of contents</h2>
              </div>
              <button
                type="button"
                onClick={closeOverlay}
                aria-label="Close table of contents"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <nav aria-label={'Sections in ' + topic.title}>
              {topic.sections.map((section, index) => (
                <button
                  type="button"
                  className={
                    'reader-contents-item' +
                    (index === visibleSectionIndex
                      ? ' reader-contents-item--active'
                      : '')
                  }
                  key={section.id}
                  aria-current={
                    index === visibleSectionIndex ? 'page' : undefined
                  }
                  onClick={() => {
                    closeOverlay()
                    openSection(index)
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{section.heading}</strong>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              ))}
            </nav>
            <p className="reader-overlay-hint">
              Press <kbd>T</kbd> to open contents and <kbd>Esc</kbd> to close.
            </p>
          </aside>
        </div>
      )}

      {activeOverlay === 'topic-switcher' && (
        <div
          className="reader-overlay reader-overlay--topics"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOverlay()
          }}
        >
          <section
            className="quick-topic-switcher"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-topic-title"
          >
            <header>
              <Search size={18} aria-hidden="true" />
              <div>
                <p>Quick switcher</p>
                <h2 id="quick-topic-title">Open any Global Lab topic</h2>
              </div>
              <button
                type="button"
                className="quick-topic-close"
                onClick={closeOverlay}
                aria-label="Close topic switcher"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>

            <div className="quick-topic-search">
              <Search size={16} aria-hidden="true" />
              <input
                ref={quickTopicInputRef}
                value={quickTopicQuery}
                role="combobox"
                aria-expanded="true"
                aria-controls="quick-topic-results"
                aria-activedescendant={
                  filteredTopicOptions[activeTopicOptionIndex]
                    ? 'quick-topic-' +
                      filteredTopicOptions[activeTopicOptionIndex].topic.id
                    : undefined
                }
                placeholder="Search biology, physics, chemistry, or mathematics"
                onChange={(event) => {
                  setQuickTopicQuery(event.target.value)
                  setActiveTopicOptionIndex(0)
                }}
                onKeyDown={handleQuickTopicKeyDown}
              />
              <kbd>Esc</kbd>
            </div>

            <div
              className="quick-topic-results"
              id="quick-topic-results"
              role="listbox"
              aria-label="Global Lab topics"
            >
              {filteredTopicOptions.map((option, index) => (
                <button
                  type="button"
                  role="option"
                  id={'quick-topic-' + option.topic.id}
                  aria-selected={index === activeTopicOptionIndex}
                  className={
                    'quick-topic-option' +
                    (index === activeTopicOptionIndex
                      ? ' quick-topic-option--active'
                      : '')
                  }
                  key={option.subject.id + ':' + option.topic.id}
                  onMouseEnter={() => setActiveTopicOptionIndex(index)}
                  onClick={() => selectTopicOption(option)}
                >
                  <span
                    className={
                      'quick-topic-subject quick-topic-subject--' +
                      option.subject.id
                    }
                  >
                    {option.subject.title}
                  </span>
                  <span>
                    <strong>{option.topic.title}</strong>
                    <small>{option.topic.subtitle}</small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              ))}
              {filteredTopicOptions.length === 0 && (
                <p className="quick-topic-empty">
                  No topic matches â€œ{quickTopicQuery}â€.
                </p>
              )}
            </div>

            <footer>
              <span><kbd>â†‘</kbd><kbd>â†“</kbd> Navigate</span>
              <span><kbd>Enter</kbd> Open</span>
              <span>{TOPIC_OPTIONS.length} topics</span>
            </footer>
          </section>
        </div>
      )}

      {activeOverlay === 'mastery' && (
        <Suspense
          fallback={
            <div className="topic-quiz-backdrop" role="presentation">
              <section
                className="topic-quiz-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Test your mastery"
              >
                <div className="topic-quiz-empty" role="status">
                  Opening your mastery checkâ€¦
                </div>
              </section>
            </div>
          }
        >
          <TopicQuizModal
            topicId={topic.id}
            topicTitle={topic.title}
            subjectId={subject.id}
            onClose={closeOverlay}
          />
        </Suspense>
      )}
    </div>
  )
}
