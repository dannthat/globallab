import { LoaderCircle, Sparkles, WandSparkles, X } from 'lucide-react'
import type { RewrittenSection, StudentProfile } from '../types'

interface LearnYourWayPanelProps {
  rewrite: RewrittenSection | null
  profile: StudentProfile | null
  isLoading: boolean
  error: string | null
  onLearnYourWay: () => void
  onClearRewrite: () => void
}

export function LearnYourWayPanel({
  rewrite,
  profile,
  isLoading,
  error,
  onLearnYourWay,
  onClearRewrite,
}: LearnYourWayPanelProps) {
  if (!rewrite && (!profile || profile.interest.toLowerCase() === 'neutral')) {
    return null
  }

  if (!rewrite) {
    return (
      <div className="learn-panel">
        <div className="section-actions justify-end">
          <button
            type="button"
            className="liyw-button"
            disabled={isLoading}
            onClick={onLearnYourWay}
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin" size={14} aria-hidden="true" />
            ) : (
              <WandSparkles size={14} aria-hidden="true" />
            )}
            {isLoading ? 'Rewriting…' : 'Learn it your way'}
          </button>
        </div>
        {error && (
          <p className="rewrite-error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="learn-panel animate-reveal">
      <div className="section-actions">
        <span className="rewrite-badge">
          <Sparkles size={12} aria-hidden="true" />
          Rewritten for {rewrite.interest}
        </span>
        <button type="button" className="back-to-original" onClick={onClearRewrite}>
          <X size={12} aria-hidden="true" />
          Back to original
        </button>
      </div>
      {rewrite.isMock && (
        <span className="mock-badge mt-3">Preview — API key not set</span>
      )}
    </div>
  )
}
