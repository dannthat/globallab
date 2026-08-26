import { FlaskConical } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface OnboardingFlowProps {
  onComplete: (interest: string, gradeLevel?: string) => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [interest, setInterest] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const normalizedInterest = interest.trim().replace(/\s+/g, ' ')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!normalizedInterest) return
    onComplete(normalizedInterest, gradeLevel || undefined)
  }

  return (
    <main className="onboarding-shell">
      <form className="onboarding-card animate-reveal" onSubmit={handleSubmit}>
        <div className="onboarding-brand">
          <span className="brand-mark" aria-hidden="true">
            <FlaskConical size={22} strokeWidth={2.2} />
          </span>
          <span className="brand-name">Global Lab</span>
        </div>

        <p className="eyebrow mt-8">Optional study profile</p>
        <h1 className="onboarding-title">Make help fit the moment</h1>
        <p className="onboarding-copy">
          Add one interest for optional analogies, or skip and start reading.
          Learn Your Way keeps every original source unchanged and lets you choose
          simpler, more detailed, step-by-step, examples, or a quick check.
        </p>

        <div className="onboarding-fields">
          <label className="field-label" htmlFor="interest">
            What are you into?
          </label>
          <input
            id="interest"
            className="profile-input"
            type="text"
            value={interest}
            maxLength={60}
            autoFocus
            autoComplete="off"
            placeholder="Formula 1, baking, K-pop, basketball…"
            onChange={(event) => setInterest(event.target.value)}
          />

          <label className="field-label mt-1" htmlFor="grade-level">
            Your level <span>(optional)</span>
          </label>
          <select
            id="grade-level"
            className="profile-input"
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
            <option value="University">University</option>
          </select>
        </div>

        <button className="onboarding-submit" type="submit" disabled={!normalizedInterest}>
          Start studying →
        </button>
        <button
          className="onboarding-skip"
          type="button"
          onClick={() => onComplete('neutral')}
        >
          Skip for now
        </button>
      </form>
    </main>
  )
}
