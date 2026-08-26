import { useId } from 'react'
import type { PreferenceSuggestion } from '../personalization/types'

export interface PreferenceSuggestionCardProps {
  suggestion: PreferenceSuggestion
  onApply: (suggestion: PreferenceSuggestion) => void
  onNotNow: (suggestion: PreferenceSuggestion) => void
  onNeverSuggest: (suggestion: PreferenceSuggestion) => void
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function PreferenceSuggestionCard({
  suggestion,
  onApply,
  onNotNow,
  onNeverSuggest,
}: PreferenceSuggestionCardProps) {
  const headingId = useId()
  const isPending = suggestion.status === 'pending'

  return (
    <aside
      className="preference-suggestion-card"
      aria-labelledby={headingId}
      aria-live="polite"
    >
      <p className="preference-suggestion-card__eyebrow">Optional learning preference</p>
      <h2 id={headingId}>Would you like us to remember this?</h2>
      <p>
        <strong>{suggestion.proposedValueLabel}</strong>
      </p>
      <p>{suggestion.reason}</p>
      <p className="preference-suggestion-card__reassurance">
        This is only a suggestion based on repeated choices, not a judgment about how you
        learn. Nothing changes unless you apply it.
      </p>
      <p className="preference-suggestion-card__evidence">
        Based on {countLabel(suggestion.evidenceCount, 'interaction')} across{' '}
        {countLabel(suggestion.distinctAnchorCount, 'source location')} and{' '}
        {countLabel(suggestion.successfulOutcomeCount, 'successful check')}.
      </p>

      <div className="preference-suggestion-card__actions">
        <button
          type="button"
          disabled={!isPending}
          onClick={() => onApply(suggestion)}
        >
          Apply
        </button>
        <button
          type="button"
          disabled={!isPending}
          onClick={() => onNotNow(suggestion)}
        >
          Not now
        </button>
        <button
          type="button"
          disabled={!isPending}
          onClick={() => onNeverSuggest(suggestion)}
        >
          Don’t suggest this
        </button>
      </div>

      {!isPending && (
        <p className="preference-suggestion-card__status" role="status">
          This suggestion has already been answered.
        </p>
      )}
    </aside>
  )
}
