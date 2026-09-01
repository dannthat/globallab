import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Info,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react'
import type { TutorSessionController } from '../hooks/useTutorSession'
import type { TutorActivity, TutorActivityResponse, TutorIntent } from '../personalization/tutorTypes'
import type { SourceAnchor, SourceExcerpt } from '../personalization/types'

export interface TutorConversationProps {
  session: TutorSessionController
  sourceAnchor: SourceAnchor
  interest: string
  cloudAllowed: boolean
  onCloudAllowedChange?: (allowed: boolean) => void
  onOutcome?: (helpful: boolean) => void
  crossSourceCandidates?: SourceExcerpt[]
  activeCrossSource?: SourceExcerpt | null
  crossSourceAllowed?: boolean
  onCrossSourceChange?: (excerpt: SourceExcerpt | null) => void
  onCrossSourceAllowedChange?: (allowed: boolean) => void
  hasSimulation?: boolean
  startingSupport?: 'quick' | 'balanced' | 'guided'
  stuckSupport?: 'hint' | 'different-explanation' | 'walk-through'
  onDismiss: () => void
}

function sourceLocation(anchor: SourceAnchor) {
  if (anchor.page) return `page ${anchor.page}`
  if (anchor.lineRange) return `lines ${anchor.lineRange.start}-${anchor.lineRange.end}`
  return anchor.anchorLabel
}

function initialActivityResponse(activity: TutorActivity): TutorActivityResponse {
  if (activity.kind === 'ordering') return activity.items.map(({ id }) => id)
  if (activity.kind === 'matching') return {}
  if (activity.kind === 'hotspot') return []
  return ''
}

function ActivityCard({ activity, session }: { activity: TutorActivity; session: TutorSessionController }) {
  const [response, setResponse] = useState<TutorActivityResponse>(() => initialActivityResponse(activity))
  const grade = session.activityGrade
  const answered = Boolean(grade)
  const canSubmit = typeof response === 'string'
    ? Boolean(response.trim())
    : Array.isArray(response)
      ? response.length > 0
      : Object.keys(response).length > 0

  const move = (index: number, delta: -1 | 1) => {
    if (!Array.isArray(response)) return
    const target = index + delta
    if (target < 0 || target >= response.length) return
    const next = [...response]
    ;[next[index], next[target]] = [next[target], next[index]]
    setResponse(next)
  }

  return <section className={'koji-activity koji-v3__activity'} aria-labelledby={`${activity.id}-prompt`}>
    <div className={'koji-activity__head'}><span>Try it</span><strong>{activity.kind.replaceAll('-', ' ')}</strong></div>
    <p id={`${activity.id}-prompt`} className={'koji-activity__prompt'}>{activity.prompt}</p>
    {(activity.kind === 'multiple-choice' || activity.kind === 'simulation-prediction') && <div className={'koji-activity__choices'} role={'radiogroup'}>
      {activity.options.map((option) => <label key={option.id}>
        <input
          type={'radio'}
          name={activity.id}
          checked={response === option.id}
          disabled={answered || session.isLoading}
          onChange={() => setResponse(option.id)}
        />
        <span>{option.label}</span>
      </label>)}
    </div>}

    {activity.kind === 'short-answer' && <label className={'koji-activity__short-answer'}>
      <span>Your answer</span>
      <textarea
        rows={3}
        value={typeof response === 'string' ? response : ''}
        disabled={answered || session.isLoading}
        onChange={(event) => setResponse(event.target.value)}
        placeholder={'Explain it in your own words'}
      />
    </label>}

    {activity.kind === 'ordering' && Array.isArray(response) && <ol className={'koji-activity__ordering'}>
      {response.map((id, index) => {
        const item = activity.items.find((candidate) => candidate.id === id)
        return <li key={id}>
          <span>{index + 1}. {item?.label ?? id}</span>
          <span>
            <button type={'button'} disabled={answered || index === 0} onClick={() => move(index, -1)} aria-label={'Move up'}><ArrowUp size={14} /></button>
            <button type={'button'} disabled={answered || index === response.length - 1} onClick={() => move(index, 1)} aria-label={'Move down'}><ArrowDown size={14} /></button>
          </span>
        </li>
      })}
    </ol>}

    {activity.kind === 'matching' && !Array.isArray(response) && typeof response !== 'string' && <div className={'koji-activity__matching'}>
      {activity.left.map((left) => <label key={left.id}>
        <span>{left.label}</span>
        <select
          value={response[left.id] ?? ''}
          disabled={answered}
          onChange={(event) => setResponse({ ...response, [left.id]: event.target.value })}
        >
          <option value={''}>Choose a match</option>
          {activity.right.map((right) => <option key={right.id} value={right.id}>{right.label}</option>)}
        </select>
      </label>)}
    </div>}

    {activity.kind === 'hotspot' && Array.isArray(response) && <div className={'koji-activity__hotspots'}>
      {activity.hotspots.map((spot) => <button
        key={spot.id}
        type={'button'}
        aria-pressed={response.includes(spot.id)}
        disabled={answered}
        onClick={() => setResponse(response.includes(spot.id) ? response.filter((id) => id !== spot.id) : [...response, spot.id])}
      >{spot.label}</button>)}
    </div>}
    <button
      type={'button'}
      className={'koji-v3__check-answer'}
      disabled={!canSubmit || answered || session.isLoading}
      onClick={() => void session.submitActivity(response)}
    >
      Check my answer
    </button>
    {grade && <div className={`koji-activity__feedback koji-activity__feedback--${grade.correct ? 'correct' : 'review'}`} role={'status'}>
      {grade.correct ? <CheckCircle2 size={17} /> : <Lightbulb size={17} />}
      <div><strong>{grade.correct ? 'You got it' : 'One part to revisit'}</strong><p>{grade.feedback}</p></div>
    </div>}
  </section>
}

export function TutorConversation({
  session,
  sourceAnchor,
  interest,
  cloudAllowed,
  onCloudAllowedChange,
  onOutcome,
  startingSupport = 'balanced',
  stuckSupport = 'different-explanation',
  onDismiss,
}: TutorConversationProps) {
  const [question, setQuestion] = useState('')
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [isStuck, setIsStuck] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const normalizedInterest = interest.trim().replace(/\s+/g, ' ') || 'neutral'
  const startingLabel = startingSupport === 'quick'
    ? 'Quick start'
    : startingSupport === 'guided'
      ? 'Guided start'
      : 'Balanced start'
  const stuckIntent: TutorIntent = stuckSupport === 'hint'
    ? 'hint'
    : stuckSupport === 'walk-through'
      ? 'step-by-step'
      : 'explain-differently'
  const composerHint = isStuck
    ? stuckSupport === 'hint'
      ? 'Koji will start with a hint'
      : stuckSupport === 'walk-through'
        ? 'Koji will walk through it one question at a time'
        : 'Koji will try a genuinely different explanation'
    : 'Original source unchanged'

  useEffect(() => {
    if (isStuck) composerRef.current?.focus()
  }, [isStuck])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scroller = scrollRef.current
      if (scroller) scroller.scrollTop = scroller.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [
    isStuck,
    session.activeActivity?.id,
    session.activityGrade,
    session.error,
    session.isLoading,
    session.messages.length,
  ])

  const markHelpful = (helpful: boolean) => {
    if (feedback === helpful) return
    setFeedback(helpful)
    onOutcome?.(helpful)
  }

  return <aside className={'koji-tutor koji-v3'} aria-label={'Koji learning companion'}>
    <header className={'koji-tutor__header koji-v3__header'}>
      <div className={'koji-tutor__identity'}>
        <span className={'koji-tutor__mark'} aria-hidden={true}><Sparkles size={18} /></span>
        <div><p>Learning companion</p><h2>Koji</h2></div>
      </div>
      <button type={'button'} className={'koji-icon-button'} onClick={onDismiss} aria-label={'Close Koji'}><X size={17} /></button>
    </header>

    <div className={'koji-v3__context'}>
      <div>
        <BookOpen size={14} aria-hidden={true} />
        <span>{sourceAnchor.anchorLabel}</span>
        <small>{sourceLocation(sourceAnchor)}</small>
      </div>
      <div className={'koji-tutor__lens'}>
        <WandSparkles size={13} aria-hidden={true} />
        <strong>{normalizedInterest}</strong>
        <span>{startingLabel}</span>
      </div>
      <div className={'koji-tutor__integrity'}>
        <ShieldCheck size={14} aria-hidden={true} />
        <span>Original source unchanged</span>
      </div>
    </div>

    {sourceAnchor.sourceKind === 'upload' && onCloudAllowedChange && <div className={'koji-v3__privacy'}>
      <span>{cloudAllowed ? 'Only this selection is enabled for cloud Koji' : 'This selection stays local'}</span>
      <button type={'button'} aria-pressed={cloudAllowed} onClick={() => onCloudAllowedChange(!cloudAllowed)}>
        {cloudAllowed ? 'Use local only' : 'Use AI for this selection'}
      </button>
    </div>}

    <div className={'koji-v3__chat'}>
      <div className={'koji-v3__scroll'} ref={scrollRef}>
        <div className={'koji-thread koji-v3__thread'} role={'log'} aria-live={'polite'} aria-relevant={'additions'}>
          {session.messages.map((message) => <article key={message.id} className={`koji-message koji-message--${message.role}`}>
            <p className={'koji-message__role'}>{message.role === 'tutor' ? 'Koji' : 'You'}</p>
            {message.text.split(/\n{2,}/).map((paragraph, index) => <p key={`${message.id}-${index}`}>{paragraph}</p>)}
          </article>)}
          {session.isLoading && <div className={'koji-thinking'} role={'status'}>
            <LoaderCircle className={'liyw-spinner'} size={16} aria-hidden={true} />
            <span>Koji is finding a better route...</span>
          </div>}
        </div>
        {session.lastTurn?.citations.length ? <details className={'koji-v3__evidence'}>
          <summary>See source evidence</summary>
          <ul>{session.lastTurn.citations.map((citation) => <li key={citation.anchorId + citation.quote}>
            <strong>{citation.label}</strong><q>{citation.quote}</q>
          </li>)}</ul>
        </details> : null}

        {session.error && <div className={'koji-error'} role={'alert'}>
          <Info size={16} aria-hidden={true} />
          <p>{session.error}</p>
          <button type={'button'} onClick={session.retry} disabled={session.isLoading}><RefreshCw size={14} /> Try again</button>
        </div>}

        {session.activeActivity && <ActivityCard key={session.activeActivity.id} activity={session.activeActivity} session={session} />}

        {!session.isLoading && <div className={'koji-v3__decision'} role={'group'} aria-label={'Did this explanation help?'}>
          <button
            type={'button'}
            className={'koji-v3__got-it'}
            onClick={() => {
              markHelpful(true)
              onDismiss()
            }}
          >
            <CheckCircle2 size={17} aria-hidden={true} /> Got it
          </button>
          <button
            type={'button'}
            className={isStuck ? 'is-active' : undefined}
            aria-pressed={isStuck}
            onClick={() => {
              markHelpful(false)
              setIsStuck(true)
            }}
          >
            <Lightbulb size={17} aria-hidden={true} /> Still stuck
          </button>
        </div>}

        {isStuck && <div className={'koji-v3__stuck-prompt'}>
          <strong>Show me where the thread broke.</strong>
          <p>Name the word, sentence, or step that stopped making sense. Koji will change strategy instead of repeating itself.</p>
        </div>}
      </div>

      <form
        className={'koji-composer koji-v3__composer'}
        onSubmit={(event) => {
          event.preventDefault()
          const value = question.trim()
          if (!value) return
          setQuestion('')
          void session.send(isStuck ? stuckIntent : 'ask', value)
          setIsStuck(false)
        }}
      >
        <label htmlFor={`koji-question-${sourceAnchor.anchorId}`}>
          {isStuck ? 'What exactly lost you?' : 'Ask Koji about this source'}
        </label>
        <div>
          <textarea
            ref={composerRef}
            id={`koji-question-${sourceAnchor.anchorId}`}
            rows={1}
            value={question}
            disabled={session.isLoading}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={isStuck ? 'Tell Koji exactly where you got lost...' : 'Message Koji about this passage...'}
          />
          <button type={'submit'} disabled={!question.trim() || session.isLoading} aria-label={'Send message to Koji'}>
            <Send size={16} aria-hidden={true} />
          </button>
        </div>
        <p className={'koji-v3__composer-note'}>
          <ShieldCheck size={12} aria-hidden={true} />
          <span>{composerHint}</span>
          <span aria-hidden={true}>·</span>
          {sourceAnchor.url
            ? <a href={sourceAnchor.url} target={'_blank'} rel={'noreferrer'}>{sourceAnchor.sourceTitle}</a>
            : <strong>{sourceAnchor.sourceTitle}</strong>}
        </p>
      </form>
    </div>
  </aside>
}
