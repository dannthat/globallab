import katex from 'katex'
import {
  LoaderCircle,
  WandSparkles,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { KnowledgeSection, RewrittenSection, StudentProfile } from '../types'
import type {
  LearningOutcome,
  PersonalizationMode,
  PreferenceSuggestion,
  ApprovedPresentationPreferences,
  SourceExcerpt,
} from '../personalization/types'
import type {
  TutorAttemptTelemetry,
  TutorContext,
  TutorPhase,
  TutorSimulationSnapshot,
  TutorTurn,
  TutorUnderstandingCheck,
  TutorMachineState,
} from '../personalization/tutorTypes'
import { SIMULATION_STATE_EVENT } from '../personalization/simulationProtocol'
import { CalloutBox } from './CalloutBox'
import { InteractiveDiagramBlock } from './InteractiveDiagramBlock'
import {
  renderHighlightedText,
  TextHighlightToolbar,
  usePersistentTextHighlights,
} from './KitabiSection'
import { TutorConversation } from './TutorConversation'
import { useTutorSession } from '../hooks/useTutorSession'
import { SectionErrorBoundary } from './SectionErrorBoundary'
import { getSimulationRegistration, hasInteractiveSimulation } from './simulations'

interface TextbookSectionProps {
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
  error?: string | null
  onLearnYourWay: (excerpt?: string) => void
  onRefine: (mode: PersonalizationMode) => void
  onOutcome: (mode: PersonalizationMode, outcome: LearningOutcome) => void
  onQuizResult: (mode: PersonalizationMode, score: number, total: number) => void
  approvedPresentation?: ApprovedPresentationPreferences
  onTutorAttempt?: (attempt: TutorAttemptTelemetry) => void
  onTutorHint?: (phase: TutorPhase, revealed: boolean) => void
  onTutorIntent?: (mode: PersonalizationMode) => void
  onTeachKojiCheck?: (check: TutorUnderstandingCheck, turn: TutorTurn) => void
  onPredictionCycleComplete?: (
    cycle: TutorMachineState['predictionCycle'],
  ) => void
  crossSourceCandidates?: SourceExcerpt[]
  isCrossSourceAllowed?: (secondary: SourceExcerpt) => boolean
  onCrossSourcePermissionChange?: (
    secondary: SourceExcerpt,
    allowed: boolean,
  ) => void
  onClearRewrite: () => void
  preferenceSuggestion?: PreferenceSuggestion | null
  onApplySuggestion: (suggestionId: string) => void
  onDeferSuggestion: (suggestionId: string) => void
  onNeverSuggest: (suggestionId: string) => void
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

export function TextbookSection({
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
  error = null,
  onLearnYourWay,
  onOutcome,
  onClearRewrite,
  approvedPresentation = {},
  onTutorAttempt,
  onTutorHint,
  onTutorIntent,
  onTeachKojiCheck,
  onPredictionCycleComplete,
  crossSourceCandidates = [],
  isCrossSourceAllowed,
  onCrossSourcePermissionChange,
}: TextbookSectionProps) {
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
  const hasInteractiveVisual = Boolean(
    topicId && hasInteractiveSimulation(topicId, section.id),
  )
  const simulationRegistration = topicId
    ? getSimulationRegistration(topicId, section.id)
    : null
  const [liveSimulation, setLiveSimulation] =
    useState<TutorSimulationSnapshot | null>(null)
  const [activeCrossSource, setActiveCrossSource] =
    useState<SourceExcerpt | null>(null)
  const crossSourceAllowed = Boolean(
    activeCrossSource && isCrossSourceAllowed?.(activeCrossSource),
  )
  useEffect(() => {
    if (!simulationRegistration || typeof window === 'undefined') return
    const listener = (event: Event) => {
      const snapshot = (event as CustomEvent<TutorSimulationSnapshot>).detail
      if (snapshot?.simulationId === simulationRegistration.simulationId) {
        setLiveSimulation(snapshot)
      }
    }
    window.addEventListener(SIMULATION_STATE_EVENT, listener)
    return () => window.removeEventListener(SIMULATION_STATE_EVENT, listener)
  }, [simulationRegistration])
  const tutorSimulation = useMemo<TutorSimulationSnapshot | undefined>(() => {
    if (!simulationRegistration || !topicId) return undefined
    if (liveSimulation?.simulationId === simulationRegistration.simulationId) {
      return liveSimulation
    }
    return {
      simulationId: simulationRegistration.simulationId,
      topicId,
      sectionId: section.id,
      label: simulationRegistration.label,
      controls: simulationRegistration.initialControls,
      outputs: simulationRegistration.initialOutputs,
      updatedAt: new Date(0).toISOString(),
    }
  }, [liveSimulation, section.id, simulationRegistration, topicId])
  const visualKind = hasInteractiveVisual
    ? 'Interactive lab'
    : section.diagram
      ? 'Scientific figure'
      : equationHtml
        ? 'Equation plate'
        : 'Concept index'
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
    onAskCompanion: (selectedText: string) => onLearnYourWay(selectedText),
  })

  const tutorContext = useMemo<TutorContext | null>(() => {
    if (!rewrite || !profile) return null
    return {
      sessionId: [
        rewrite.source.sourceId,
        rewrite.source.sourceRevision ?? rewrite.source.sourceFingerprint ?? 'current',
        rewrite.source.anchorId,
        rewrite.scope ?? 'section',
        rewrite.generatedAt,
      ].join('::'),
      entryPoint: rewrite.scope === 'selection' ? 'selection' : 'section',
      objective:
        rewrite.scope === 'selection'
          ? `Understand the selected text from ${section.heading}`
          : `Understand ${section.heading}`,
      excerpt:
        rewrite.excerpt ?? {
          anchor: rewrite.source,
          text: section.body,
        },
      scope: rewrite.scope ?? 'section',
      topicTitle,
      student: {
        interest: profile.interest,
        gradeLevel: profile.gradeLevel,
        preferredLanguage: profile.preferredLanguage,
        learningGoals: profile.learningGoals,
        startingSupport: profile.startingSupport,
        stuckSupport: profile.stuckSupport,
        approvedPresentation,
      },
      cloudAllowed: true,
      simulation: tutorSimulation,
      secondaryExcerpts:
        activeCrossSource && crossSourceAllowed ? [activeCrossSource] : undefined,
      crossSourcePermissionId:
        activeCrossSource && crossSourceAllowed
          ? `approved:${activeCrossSource.anchor.anchorId}`
          : undefined,
    }
  }, [
    approvedPresentation,
    activeCrossSource,
    crossSourceAllowed,
    profile,
    rewrite,
    section.body,
    section.heading,
    topicTitle,
    tutorSimulation,
  ])
  const tutorSession = useTutorSession({
    context: tutorContext,
    seed: rewrite
      ? {
          id: `${rewrite.sectionId}::${rewrite.generatedAt}`,
          title: rewrite.title,
          content: rewrite.content,
          limitations: rewrite.analogyLimits,
          provider: rewrite.provider,
          quiz: rewrite.quiz ?? undefined,
        }
      : null,
    onAttempt: onTutorAttempt,
    onHint: onTutorHint,
    onIntent: (intent) => {
      const mode: Partial<Record<typeof intent, PersonalizationMode>> = {
        hint: 'simpler',
        'explain-differently': 'simpler',
        'show-visually': 'another-example',
        'another-example': 'another-example',
        'step-by-step': 'step-by-step',
        'test-me': 'test-me',
      }
      const refinement = mode[intent]
      if (refinement) onTutorIntent?.(refinement)
    },
    onTeachKojiCheck,
    onPredictionCycleComplete,
  })

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

  // Parallax watermark on mouse move
  const surfaceRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    const handleMouseMove = (e: MouseEvent) => {
      const watermark = surface.querySelector<HTMLElement>('[data-watermark]')
      if (!watermark) return
      const rect = surface.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      watermark.style.transform = `translate(${x * -12}px, ${y * -8}px)`
    }
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (!reducedMotion) {
      surface.addEventListener('mousemove', handleMouseMove)
    }
    return () => surface.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const learnYourWayBookmark = canPersonalize && !rewrite ? (
    <SectionErrorBoundary
      error={error}
      neutralAnalogy={
        section.presetAnalogies?.neutral ??
        'Use the original explanation above as the neutral reference.'
      }
      onRetry={onLearnYourWay}
    >
      <button
        type="button"
        className="tbp-bookmark-strip gl-bookmark-pulse"
        disabled={isLoading}
        onClick={() => onLearnYourWay()}
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
        <span>
          {isLoading
            ? 'Creating…'
            : profile?.interest &&
                profile.interest.trim().toLowerCase() !== 'neutral'
              ? `Connect this to ${profile.interest}`
              : 'Learn your way'}
        </span>
      </button>
    </SectionErrorBoundary>
  ) : null

  return (
    <article
      className="tbp-article gl-section-arrive tbp-article--new"
      id={section.id}
      aria-busy={isLoading}
    >
      {/* ── Reading surface ── */}
      <section
        className="tbp-reading-surface"
        ref={surfaceRef}
        aria-labelledby={`${section.id}-heading`}
      >
        <div className="tbp-reading-inner">
          {/* Watermark section number — parallax target */}
          <span
            className="tbp-watermark"
            aria-hidden="true"
            data-watermark="true"
          >
            {sectionNumber}
          </span>

          {/* Running head */}
          <div className="tbp-running-head">
            <span>{subjectTitle}</span>
            <span>
              Lesson {sectionNumber} / {String(totalSections).padStart(2, '0')}
            </span>
          </div>

          {/* Section heading */}
          <header className="tbp-section-head">
            <p className="tbp-section-kicker">{topicTitle}</p>
            <h1
              className="tbp-section-heading"
              id={`${section.id}-heading`}
            >
              {section.heading}
            </h1>
            {topicSubtitle && (
              <p className="tbp-section-deck">{topicSubtitle}</p>
            )}
          </header>

          {/* Body text */}
          <div
            className={
              'tbp-body' + (orderedConcepts ? ' tbp-body--ordered' : '')
            }
            onMouseUp={handleMouseUp}
          >
            {orderedConcepts ? (
              <>
                {orderedConcepts.introduction && (
                  <p
                    className="tbp-body-lead"
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
                <ol className="tbp-concept-list">
                  {orderedConcepts.items.map((item, index) => (
                    <li key={item.label} className="tbp-concept-item">
                      <span className="tbp-concept-num">{index + 1}</span>
                      <div>
                        <span className="tbp-concept-label">{item.label}</span>
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
                  key={index}
                  className={index === 0 ? 'tbp-body-lead' : undefined}
                  data-gl-highlight-segment={'paragraph-' + index}
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

          {/* Keep personalization visible directly after the sacred source text. */}
          {learnYourWayBookmark}

          {/* Visual field: diagram / equation / concept index */}
          <div className="tbp-reference-section">
            <header className="tbp-plate-heading">
              <p className="tbp-plate-number">Plate {figureNumber}</p>
              <p className="tbp-plate-kind">{visualKind}</p>
            </header>

            {(section.diagram || hasInteractiveVisual) && (
              <div className="tbp-diagram">
                <InteractiveDiagramBlock
                  topicId={topicId ?? ''}
                  sectionId={section.id}
                  diagram={section.diagram}
                  figureNumber={figureNumber}
                />
              </div>
            )}

            {!section.diagram && !hasInteractiveVisual && (
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

            {equation}

            {section.callouts && section.callouts.length > 0 && (
              <section
                className="tbp-supporting-notes"
                aria-label="Supporting notes"
              >
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

      </section>

      {/* ── Companion panel — slides in from right ── */}
      {rewrite && (
        <aside
          className="tbp-companion-panel tbp-companion-panel--open gl-companion-open"
          aria-label="Personalized learning companion"
        >
          <TutorConversation
            session={tutorSession}
            sourceAnchor={rewrite.source}
            interest={rewrite.interest}
            startingSupport={profile?.startingSupport}
            stuckSupport={profile?.stuckSupport}
            cloudAllowed={true}
            onOutcome={(helpful) =>
              onOutcome(
                rewrite.mode,
                helpful ? 'successful' : 'needs-review',
              )
            }
            onDismiss={onClearRewrite}
            crossSourceCandidates={crossSourceCandidates}
            activeCrossSource={activeCrossSource}
            crossSourceAllowed={crossSourceAllowed}
            onCrossSourceChange={setActiveCrossSource}
            onCrossSourceAllowedChange={(allowed) => {
              if (activeCrossSource) {
                onCrossSourcePermissionChange?.(activeCrossSource, allowed)
              }
            }}
            hasSimulation={Boolean(tutorSimulation)}
          />
        </aside>
      )}
    </article>
  )
}
