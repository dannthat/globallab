import { ChevronDown, Dna, Moon, Sun, WandSparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { KnowledgeTopic, StudentProfile, Subject } from '../types'

interface RunningHeaderProps {
  subject: Subject
  topic: KnowledgeTopic
  profile?: StudentProfile | null
  subjectColor: string
  isDark: boolean
  onToggleDark: () => void
  onSaveInterest: (interest: string) => void
  onBack: () => void
}

export function RunningHeader({
  subject,
  topic,
  profile,
  subjectColor,
  isDark,
  onToggleDark,
  onSaveInterest,
  onBack,
}: RunningHeaderProps) {
  const [isEditingLens, setIsEditingLens] = useState(false)
  const [draftInterest, setDraftInterest] = useState(profile?.interest ?? '')

  const saveInterest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = draftInterest.trim().replace(/\s+/g, ' ')
    if (!normalized) return
    onSaveInterest(normalized)
    setIsEditingLens(false)
  }

  return (
    <header className="running-header">
      <div className="reader-utility-group">
        <button
          type="button"
          className="running-header-back subject-selector"
          aria-label={`Back to ${subject.title} topics`}
          onClick={onBack}
        >
          <span
            className="subject-selector-icon"
            style={{ color: subjectColor }}
            aria-hidden="true"
          >
            <Dna size={15} />
          </span>
          <span>{subject.title}</span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>
      </div>

      <div className="running-header-title" aria-current="page">
        <span>Global Lab · Digital textbook</span>
        <strong>{topic.title}</strong>
      </div>

      <div className="running-header-actions">
        {profile?.interest && (
          <div className="running-lens-control running-lens-control--utility">
            <button
              type="button"
              className="running-header-interest"
              aria-expanded={isEditingLens}
              aria-controls="running-lens-popover"
              aria-haspopup="dialog"
              onClick={() => {
                setDraftInterest(profile.interest)
                setIsEditingLens((current) => !current)
              }}
            >
              <WandSparkles size={14} aria-hidden="true" />
              <span className="running-lens-label">Your lens</span>
              <strong>{profile.interest}</strong>
              <ChevronDown size={13} aria-hidden="true" />
            </button>

            {isEditingLens && (
              <form
                className="running-lens-popover"
                id="running-lens-popover"
                role="dialog"
                aria-label="Change personal learning lens"
                onSubmit={saveInterest}
                onKeyDown={(event) => {
                  if (event.key !== 'Escape') return
                  event.preventDefault()
                  event.stopPropagation()
                  setIsEditingLens(false)
                }}
              >
                <label htmlFor="running-interest">Personal learning lens</label>
                <p>Choose an interest you already know well.</p>
                <input
                  id="running-interest"
                  value={draftInterest}
                  maxLength={60}
                  autoFocus
                  onChange={(event) => setDraftInterest(event.target.value)}
                />
                <div className="running-lens-actions">
                  <button type="button" onClick={() => setIsEditingLens(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!draftInterest.trim()}>
                    Save lens
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <button
          type="button"
          className="dark-toggle"
          onClick={onToggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  )
}
