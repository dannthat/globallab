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
      <div className="onboarding-card animate-reveal">
        <div className="onboarding-wordmark" aria-hidden="true">
          <span className="onboarding-wordmark__gl">G</span>
          <span className="onboarding-wordmark__rest">lobalLab</span>
        </div>

        <p className="onboarding-kicker">STEM · Personalized</p>

        <h1 className="onboarding-headline">
          Learning that speaks{' '}
          <br />
          <em>your language.</em>
        </h1>

        <p className="onboarding-body">
          Add one interest and every explanation adapts — analogies, examples,
          and breakdowns that connect to what you already know.
          Your original source stays untouched.
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="onboarding-field">
            <label className="onboarding-label" htmlFor="interest">
              What are you into?
            </label>
            <input
              id="interest"
              className="onboarding-input"
              type="text"
              value={interest}
              maxLength={60}
              autoFocus
              autoComplete="off"
              placeholder="basketball, K-pop, cooking, F1…"
              onChange={(event) => setInterest(event.target.value)}
            />
          </div>

          <div className="onboarding-field">
            <label className="onboarding-label" htmlFor="grade-level">
              Your level <span className="onboarding-label__optional">(optional)</span>
            </label>
            <select
              id="grade-level"
              className="onboarding-input onboarding-input--select"
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

          <button
            className="onboarding-submit"
            type="submit"
            disabled={!normalizedInterest}
          >
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
      </div>
    </main>
  )
}
