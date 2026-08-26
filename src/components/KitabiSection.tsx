import katex from 'katex'
import { LoaderCircle, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
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
            >
              {orderedConcepts ? (
                <>
                  {orderedConcepts.introduction && (
                    <p className="section-structured-intro">
                      {highlightTerms(
                        orderedConcepts.introduction,
                        section.keyTerms,
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
                          <p>{highlightTerms(item.body, section.keyTerms)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                section.body.split(/\n{2,}/).map((paragraph, index) => (
                  <p className={index > 0 ? 'mt-4' : undefined} key={index}>
                    {highlightTerms(paragraph, section.keyTerms)}
                  </p>
                ))
              )}
            </div>
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
