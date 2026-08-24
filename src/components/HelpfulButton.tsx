import { Check, Heart } from 'lucide-react'
import type { StudyMode } from '../types'

interface HelpfulButtonProps {
  mode: StudyMode
  isPreferred: boolean
  onSave: () => void
}

export function HelpfulButton({ mode, isPreferred, onSave }: HelpfulButtonProps) {
  return (
    <div className="helpful-panel animate-reveal">
      <div>
        <p className="text-sm font-semibold text-stone-800">
          {isPreferred ? 'Saved for this topic' : 'Did this way of learning click?'}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {isPreferred
            ? `We’ll open ${mode === 'cram' ? 'Cram' : 'Explorer'} first next time.`
            : 'Save it as your preferred mode for cellular respiration.'}
        </p>
      </div>
      <button
        type="button"
        className={`helpful-button ${isPreferred ? 'helpful-button-saved' : ''}`}
        onClick={onSave}
      >
        {isPreferred ? <Check size={17} aria-hidden="true" /> : <Heart size={17} aria-hidden="true" />}
        {isPreferred ? 'Preference saved' : 'This mode helped me'}
      </button>
    </div>
  )
}
