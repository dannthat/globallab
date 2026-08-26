import { AlertCircle, X } from 'lucide-react'
import type { RewrittenSection } from '../types'

interface AnalogyPanelProps {
  rewrite: RewrittenSection
  onClear: () => void
}

export function AnalogyPanel({ rewrite, onClear }: AnalogyPanelProps) {
  return (
    <aside
      className="analogy-panel analogy-insert"
      aria-label="Personalized analogy"
    >
      <div className="analogy-topline">
        <div className="analogy-tags">
          <span className="analogy-sidebar-label">Your analogy</span>
          <span className="analogy-chip">{rewrite.interest}</span>
        </div>
        <button
          type="button"
          className="analogy-back"
          onClick={onClear}
          aria-label="Hide personalized analogy"
        >
          <X size={13} aria-hidden="true" />
          Hide analogy
        </button>
      </div>

      <p className="analogy-body">{rewrite.analogy}</p>

      {rewrite.analogyLimits && (
        <p className="analogy-limits">
          <AlertCircle
            className="analogy-limits-icon"
            size={12}
            aria-hidden="true"
          />
          <span>
            <strong>Where the comparison stops: </strong>
            {rewrite.analogyLimits}
          </span>
        </p>
      )}

      {rewrite.isMock && <span className="mock-badge">Preview — add API key</span>}
    </aside>
  )
}
