import { ArrowLeft, ArrowRight, BookOpen, Check, FileUp, Sparkles, WandSparkles } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import type { StudentProfile } from '../types'

type OnboardingProfile = Omit<StudentProfile, 'createdAt'>
interface OnboardingFlowProps {
  onComplete: (profile: OnboardingProfile, destination: 'home' | 'library') => void
  onUpload: (profile: OnboardingProfile, file: File) => void
}

const LEVELS = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University', 'Independent learner']
const GOALS = [
  ['Understand difficult material', 'Build a clear mental model'],
  ['Prepare for an exam', 'Focus on what must stick'],
  ['Finish an assignment', 'Get unstuck without losing the reasoning'],
  ['Review what I learned', 'Strengthen recall and weak spots'],
  ['Explore something new', 'Follow curiosity at my own pace'],
] as const
const INTERESTS = ['gaming', 'basketball', 'music', 'coding', 'cooking', 'football']
const STARTING = [
  ['quick', 'Quick and direct', 'Start with the shortest useful explanation.'],
  ['balanced', 'Balanced', 'Explain clearly, then offer the next step.'],
  ['guided', 'Guide me carefully', 'Use small steps and check in as we go.'],
] as const
const STUCK = [
  ['hint', 'Give me a hint', 'Let me keep doing the thinking.'],
  ['different-explanation', 'Try a new explanation', 'Change the angle instead of repeating yourself.'],
  ['walk-through', 'Walk through it with me', 'Ask one useful question at a time.'],
] as const

function Choice({ selected, onClick, children }: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return <button
    type={'button'}
    className={selected ? 'is-selected' : undefined}
    aria-pressed={selected}
    onClick={onClick}
  >
    <span className={'onboarding-v3__check'}>
      {selected && <Check size={15} aria-hidden={true} />}
    </span>
    {children}
  </button>
}

export function OnboardingFlow({ onComplete, onUpload }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [gradeLevel, setGradeLevel] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [learningGoals, setLearningGoals] = useState<string[]>([])
  const [interest, setInterest] = useState('')
  const [customInterest, setCustomInterest] = useState('')
  const [startingSupport, setStartingSupport] =
    useState<NonNullable<StudentProfile['startingSupport']>>('balanced')
  const [stuckSupport, setStuckSupport] =
    useState<NonNullable<StudentProfile['stuckSupport']>>('different-explanation')
  const uploadRef = useRef<HTMLInputElement>(null)
  const profile = useMemo<OnboardingProfile>(() => ({
    interest: (customInterest || interest).trim().replace(/\s+/g, ' ').slice(0, 60) || 'neutral',
    gradeLevel: gradeLevel || undefined,
    preferredLanguage,
    learningGoals,
    startingSupport,
    stuckSupport,
    onboardingVersion: 3,
  }), [
    customInterest,
    gradeLevel,
    interest,
    learningGoals,
    preferredLanguage,
    startingSupport,
    stuckSupport,
  ])
  const canContinue =
    (step === 0 && Boolean(gradeLevel)) ||
    (step === 1 && learningGoals.length > 0) ||
    step === 2 ||
    step === 3
  const toggleGoal = (goal: string) => setLearningGoals((current) =>
    current.includes(goal)
      ? current.filter((item) => item !== goal)
      : current.length >= 2
        ? [current[1], goal]
        : [...current, goal],
  )
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(profile, file)
  }
  const useDefaults = () => {
    setGradeLevel('Independent learner')
    setLearningGoals(['Understand difficult material'])
    setStep(4)
  }

  return <main className={'onboarding-shell onboarding-v3-shell'}>
    <section className={'onboarding-v3'} aria-labelledby={'onboarding-title'}>
      <div className={'onboarding-v3__ambient'} aria-hidden={true} />
      <header className={'onboarding-v3__header'}>
        <div className={'onboarding-wordmark'} aria-label={'GlobalLab'}>
          <span className={'onboarding-wordmark__gl'}>GL</span> GlobalLab
        </div>
        <div
          className={'onboarding-v3__progress'}
          aria-label={`Setup step ${step + 1} of 5`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={index <= step ? 'is-active' : undefined}
              aria-hidden={true}
            />
          ))}
        </div>
      </header>
      <div className={'onboarding-v3__body animate-reveal'} key={step}>
        {step === 0 && <>
          <div className={'onboarding-v3__intro'}>
            <span className={'onboarding-v3__eyebrow'}><Sparkles size={15} /> Meet Koji</span>
            <h1 id={'onboarding-title'}>Let learning meet you where you are.</h1>
            <p>Four quick choices give Koji a useful starting point. You stay in control and it keeps adapting as you learn.</p>
          </div>
          <div className={'onboarding-v3__field'}>
            <div className={'onboarding-v3__label-row'}>
              <h2>Where are you learning right now?</h2>
              <span>Required</span>
            </div>
            <div className={'onboarding-v3__choice-grid onboarding-v3__choice-grid--levels'}>
              {LEVELS.map((level) => <Choice key={level} selected={gradeLevel === level} onClick={() => setGradeLevel(level)}>
                <strong>{level}</strong>
              </Choice>)}
            </div>
          </div>
          <label className={'onboarding-v3__field onboarding-v3__language'}>
            <span>Koji should answer in</span>
            <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)}>
              <option>English</option>
              <option>Arabic</option>
              <option>French</option>
            </select>
          </label>
        </>}

        {step === 1 && <>
          <div className={'onboarding-v3__intro'}>
            <span className={'onboarding-v3__eyebrow'}>Your goal</span>
            <h1 id={'onboarding-title'}>What should Koji help you do?</h1>
            <p>Choose up to two. Koji will emphasize these without locking you into one study style.</p>
          </div>
          <div className={'onboarding-v3__choice-grid onboarding-v3__choice-grid--goals'}>
            {GOALS.map(([goal, detail]) => <Choice key={goal} selected={learningGoals.includes(goal)} onClick={() => toggleGoal(goal)}>
              <span><strong>{goal}</strong><small>{detail}</small></span>
            </Choice>)}
          </div>
        </>}

        {step === 2 && <>
          <div className={'onboarding-v3__intro'}>
            <span className={'onboarding-v3__eyebrow'}><WandSparkles size={15} /> Optional lens</span>
            <h1 id={'onboarding-title'}>What feels familiar to you?</h1>
            <p>Koji can borrow examples from an interest when it genuinely helps. The source material always stays unchanged.</p>
          </div>
          <div className={'onboarding-v3__choice-grid onboarding-v3__choice-grid--interests'}>
            {INTERESTS.map((item) => <Choice key={item} selected={!customInterest && interest === item} onClick={() => { setInterest(item); setCustomInterest('') }}>
              <strong>{item}</strong>
            </Choice>)}
          </div>
          <label className={'onboarding-v3__field'}>
            <span>Or add your own interest</span>
            <input
              value={customInterest}
              maxLength={60}
              placeholder={'e.g. fashion, chess, filmmaking'}
              onChange={(event) => { setCustomInterest(event.target.value); setInterest('') }}
            />
          </label>
          <p className={'onboarding-v3__quiet'}>You can skip this. Koji will use a neutral explanation.</p>
        </>}

        {step === 3 && <>
          <div className={'onboarding-v3__intro'}>
            <span className={'onboarding-v3__eyebrow'}>How Koji starts</span>
            <h1 id={'onboarding-title'}>Choose the pace, not a permanent label.</h1>
            <p>These are starting defaults. Koji learns from Got it and Still stuck, and you can change them later in Settings.</p>
          </div>
          <div className={'onboarding-v3__support-columns'}>
            <div className={'onboarding-v3__field'}>
              <h2>For a new explanation</h2>
              <div className={'onboarding-v3__choice-stack'}>
                {STARTING.map(([value, label, detail]) => <Choice key={value} selected={startingSupport === value} onClick={() => setStartingSupport(value)}>
                  <span><strong>{label}</strong><small>{detail}</small></span>
                </Choice>)}
              </div>
            </div>
            <div className={'onboarding-v3__field'}>
              <h2>When I say Still stuck</h2>
              <div className={'onboarding-v3__choice-stack'}>
                {STUCK.map(([value, label, detail]) => <Choice key={value} selected={stuckSupport === value} onClick={() => setStuckSupport(value)}>
                  <span><strong>{label}</strong><small>{detail}</small></span>
                </Choice>)}
              </div>
            </div>
          </div>
        </>}

        {step === 4 && <div className={'onboarding-v3__finish'}>
          <div className={'onboarding-v3__koji-mark'}><Sparkles size={28} aria-hidden={true} /></div>
          <span className={'onboarding-v3__eyebrow'}>Koji is ready</span>
          <h1 id={'onboarding-title'}>What do you want to learn first?</h1>
          <p>Bring your own notes, slides, images, or PDF, or start with a GlobalLab STEM lesson.</p>
          <div className={'onboarding-v3__destinations'}>
            <button type={'button'} className={'onboarding-v3__destination onboarding-v3__destination--primary'} onClick={() => uploadRef.current?.click()}>
              <FileUp size={22} aria-hidden={true} />
              <span><strong>Upload material</strong><small>Learn directly from your source</small></span>
              <ArrowRight size={18} aria-hidden={true} />
            </button>
            <button type={'button'} className={'onboarding-v3__destination'} onClick={() => onComplete(profile, 'home')}>
              <BookOpen size={22} aria-hidden={true} />
              <span><strong>Explore STEM</strong><small>Open the GlobalLab library</small></span>
              <ArrowRight size={18} aria-hidden={true} />
            </button>
          </div>
          <input ref={uploadRef} type={'file'} hidden onChange={handleUpload} />
          <p className={'onboarding-v3__privacy'}>Your learning profile stays on this device.</p>
        </div>}
      </div>
      {step < 4 && <footer className={'onboarding-v3__footer'}>
        <div>
          {step > 0
            ? <button type={'button'} className={'onboarding-v3__back'} onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</button>
            : <button type={'button'} className={'onboarding-v3__later'} onClick={useDefaults}>Set up later</button>}
        </div>
        <button
          type={'button'}
          className={'onboarding-v3__continue'}
          disabled={!canContinue}
          onClick={() => setStep((current) => Math.min(4, current + 1))}
        >
          Continue <ArrowRight size={17} />
        </button>
      </footer>}
    </section>
  </main>
}
