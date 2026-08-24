import katex from 'katex'
import type { ReactNode } from 'react'
import type {
  KnowledgeSection,
  RewrittenSection,
  StudentProfile,
} from '../types'
import { AnalogyCard } from './AnalogyCard'
import { LearnYourWayPanel } from './LearnYourWayPanel'
import { SectionErrorBoundary } from './SectionErrorBoundary'

interface KitabiSectionProps {
  section: KnowledgeSection
  rewrite: RewrittenSection | null
  isLoading: boolean
  profile: StudentProfile | null
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

export function KitabiSection({
  section,
  rewrite,
  isLoading,
  profile,
  error = null,
  onLearnYourWay,
  onClearRewrite,
}: KitabiSectionProps) {
  return (
    <section className="kitabi-section" id={section.id} aria-busy={isLoading}>
      <h2 className="section-heading">{section.heading}</h2>

      {section.equation && (
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
      )}

      <div className="section-body">
        {section.body.split(/\n{2,}/).map((paragraph, index) => (
          <p className={index > 0 ? 'mt-4' : undefined} key={index}>
            {highlightTerms(paragraph, section.keyTerms)}
          </p>
        ))}
      </div>

      <SectionErrorBoundary
        error={error}
        neutralAnalogy={
          section.presetAnalogies?.neutral ??
          'Use the original explanation above as the neutral reference for this concept.'
        }
        onRetry={onLearnYourWay}
      >
        {rewrite && (
          <AnalogyCard
            analogy={rewrite.analogy}
            persona="custom"
            customInterest={rewrite.interest}
          />
        )}

        <LearnYourWayPanel
          rewrite={rewrite}
          profile={profile}
          isLoading={isLoading}
          error={null}
          onLearnYourWay={onLearnYourWay}
          onClearRewrite={onClearRewrite}
        />
      </SectionErrorBoundary>
    </section>
  )
}
