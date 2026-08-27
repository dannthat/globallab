/* oxlint-disable react/only-export-components -- Quiz sampling and storage helpers stay colocated with the isolated Phase 2 modal. */
import {
  CheckCircle2,
  RefreshCw,
  Trophy,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { subjects } from '../knowledge'
import type {
  TopicMasteryRecord,
  TopicQuizPool,
  TopicQuizQuestion,
} from '../types'

export const TOPIC_QUIZ_SESSION_SIZE = 5

type TopicQuizStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface TopicQuizModalProps {
  topicId?: string
  subjectId?: string
  topicTitle: string
  onClose: () => void
  /** Optional injection seam for tests or alternate pre-built repositories. */
  pool?: TopicQuizPool
  storage?: TopicQuizStorage | null
  random?: () => number
  now?: () => Date
}

interface SubmittedAnswer {
  selectedIndex: number
  correct: boolean
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

const QUIZ_POOL_MODULES = import.meta.glob('../knowledge/quizzes/*.json', {
  import: 'default',
}) as Record<string, () => Promise<unknown>>

const quizPoolCache = new Map<string, TopicQuizPool>()
const pendingQuizPools = new Map<string, Promise<TopicQuizPool>>()

function quizPoolCacheKey(topicId: string, subjectId: string) {
  return `${subjectId}::${topicId}`
}

function emptyTopicQuizPool(topicId: string, subjectId: string): TopicQuizPool {
  return { topicId, subjectId, questions: [] }
}

export function getTopicMasteryStorageKey(topicId: string) {
  return `gl_mastery_${topicId}`
}

function browserStorage(): TopicQuizStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidQuestion(value: unknown): value is TopicQuizQuestion {
  if (!value || typeof value !== 'object') return false
  const question = value as Partial<TopicQuizQuestion>
  return (
    isNonEmptyString(question.id) &&
    isNonEmptyString(question.sectionId) &&
    isNonEmptyString(question.question) &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every(isNonEmptyString) &&
    new Set(question.options.map((option) => option.trim().toLocaleLowerCase()))
      .size === 4 &&
    Number.isInteger(question.correctIndex) &&
    Number(question.correctIndex) >= 0 &&
    Number(question.correctIndex) <= 3 &&
    isNonEmptyString(question.explanation) &&
    isNonEmptyString(question.sourceEvidence) &&
    isNonEmptyString(question.misconceptionTargeted)
  )
}

export function validTopicQuizQuestions(pool: TopicQuizPool) {
  const seen = new Set<string>()
  return pool.questions.filter((question) => {
    if (!isValidQuestion(question) || seen.has(question.id)) return false
    seen.add(question.id)
    return true
  })
}

function normalizeTopicQuizPool(
  candidate: unknown,
  topicId: string,
  subjectId: string,
): TopicQuizPool {
  if (!candidate || typeof candidate !== 'object') {
    return emptyTopicQuizPool(topicId, subjectId)
  }
  const pool = candidate as Partial<TopicQuizPool>
  if (
    pool.topicId !== topicId ||
    pool.subjectId !== subjectId ||
    !Array.isArray(pool.questions)
  ) {
    return emptyTopicQuizPool(topicId, subjectId)
  }
  const candidatePool = pool as TopicQuizPool
  const questions = validTopicQuizQuestions(candidatePool)
  const subject = subjects.find((item) => item.id === subjectId)
  const topic = subject?.topics.find((item) => item.id === topicId)
  const sections = new Map(
    topic?.sections.map((section) => [section.id, section.body]) ?? [],
  )
  const sectionCounts = new Map<string, number>()

  for (const question of questions) {
    const sourceBody = sections.get(question.sectionId)
    if (!sourceBody?.includes(question.sourceEvidence)) {
      return emptyTopicQuizPool(topicId, subjectId)
    }
    sectionCounts.set(
      question.sectionId,
      (sectionCounts.get(question.sectionId) ?? 0) + 1,
    )
  }

  const expectedSectionQuotas = topic?.sections.length === 5
    ? [8, 8, 8, 8, 8]
    : topic?.sections.length === 6 && topic.sections.at(-1)?.id === 'exam-traps'
      ? [7, 7, 7, 7, 6, 6]
      : []
  const hasExpectedCoverage =
    topic !== undefined &&
    questions.length === 40 &&
    sectionCounts.size === expectedSectionQuotas.length &&
    expectedSectionQuotas.every(
      (quota, index) =>
        sectionCounts.get(topic.sections[index]?.id ?? '') === quota,
    )

  if (!hasExpectedCoverage) {
    return emptyTopicQuizPool(topicId, subjectId)
  }

  return { topicId, subjectId, questions }
}

export function getCachedTopicQuizPool(topicId: string, subjectId: string) {
  return quizPoolCache.get(quizPoolCacheKey(topicId, subjectId)) ?? null
}

export function loadTopicQuizPool(
  topicId: string,
  subjectId: string,
): Promise<TopicQuizPool> {
  const cacheKey = quizPoolCacheKey(topicId, subjectId)
  const cached = quizPoolCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  const pending = pendingQuizPools.get(cacheKey)
  if (pending) return pending

  const loader = QUIZ_POOL_MODULES[`../knowledge/quizzes/${topicId}.json`]
  if (!loader) {
    const emptyPool = emptyTopicQuizPool(topicId, subjectId)
    quizPoolCache.set(cacheKey, emptyPool)
    return Promise.resolve(emptyPool)
  }

  const request = loader()
    .then((candidate) => normalizeTopicQuizPool(candidate, topicId, subjectId))
    .catch(() => emptyTopicQuizPool(topicId, subjectId))
    .then((pool) => {
      quizPoolCache.set(cacheKey, pool)
      return pool
    })
    .finally(() => pendingQuizPools.delete(cacheKey))

  pendingQuizPools.set(cacheKey, request)
  return request
}

export function preloadTopicQuizPool(topicId: string, subjectId: string) {
  return loadTopicQuizPool(topicId, subjectId)
}

function shuffled<T>(values: readonly T[], random: () => number) {
  const copy = [...values]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const raw = random()
    const normalized = Number.isFinite(raw)
      ? Math.min(Math.max(raw, 0), 0.999_999_999)
      : 0
    const swapIndex = Math.floor(normalized * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

export function sampleTopicQuizQuestions(
  pool: TopicQuizPool,
  completedQuestionIds: readonly string[],
  limit = TOPIC_QUIZ_SESSION_SIZE,
  random: () => number = Math.random,
) {
  const questions = validTopicQuizQuestions(pool)
  const sessionSize = Math.min(
    questions.length,
    Math.max(0, Number.isFinite(limit) ? Math.floor(limit) : 0),
  )
  if (sessionSize === 0) return []

  const questionIds = new Set(questions.map((question) => question.id))
  const completed = new Set(
    completedQuestionIds.filter((questionId) => questionIds.has(questionId)),
  )
  if (completed.size >= questions.length) completed.clear()
  const unseen = shuffled(
    questions.filter((question) => !completed.has(question.id)),
    random,
  )
  if (unseen.length >= sessionSize) return unseen.slice(0, sessionSize)

  const seen = shuffled(
    questions.filter((question) => completed.has(question.id)),
    random,
  )
  return [...unseen, ...seen].slice(0, sessionSize)
}

export function readTopicMasteryRecord(
  storage: TopicQuizStorage | null,
  topicId: string,
): TopicMasteryRecord | null {
  if (!storage) return null
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(getTopicMasteryStorageKey(topicId)) ?? 'null',
    )
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Partial<TopicMasteryRecord>
    if (
      record.topicId !== topicId ||
      !Number.isInteger(record.bestScore) ||
      Number(record.bestScore) < 0 ||
      !Number.isInteger(record.totalQuestions) ||
      Number(record.totalQuestions) <= 0 ||
      Number(record.bestScore) > Number(record.totalQuestions) ||
      !Number.isInteger(record.attemptsCount) ||
      Number(record.attemptsCount) < 0 ||
      !isNonEmptyString(record.lastAttemptAt) ||
      !Number.isFinite(Date.parse(record.lastAttemptAt)) ||
      !Array.isArray(record.completedQuestionIds) ||
      !record.completedQuestionIds.every(isNonEmptyString)
    ) {
      return null
    }
    return {
      topicId,
      bestScore: Math.min(Number(record.bestScore), Number(record.totalQuestions)),
      totalQuestions: Number(record.totalQuestions),
      attemptsCount: Number(record.attemptsCount),
      lastAttemptAt: record.lastAttemptAt,
      completedQuestionIds: [...new Set(record.completedQuestionIds)],
    }
  } catch {
    return null
  }
}

function writeTopicMasteryRecord(
  storage: TopicQuizStorage | null,
  record: TopicMasteryRecord,
) {
  if (!storage) return
  try {
    storage.setItem(
      getTopicMasteryStorageKey(record.topicId),
      JSON.stringify(record),
    )
  } catch {
    // The active quiz remains usable when browser storage is blocked or full.
  }
}

function createMasteryRecord(
  previous: TopicMasteryRecord | null,
  topicId: string,
  session: readonly TopicQuizQuestion[],
  answers: Readonly<Record<string, SubmittedAnswer>>,
  attemptedAt: string,
  poolQuestions: readonly TopicQuizQuestion[],
) {
  const score = session.reduce(
    (total, question) => total + (answers[question.id]?.correct ? 1 : 0),
    0,
  )
  const totalQuestions = session.length
  const previousRatio = previous
    ? previous.bestScore / previous.totalQuestions
    : -1
  const currentRatio = totalQuestions > 0 ? score / totalQuestions : 0
  const replacesBest =
    !previous ||
    currentRatio > previousRatio ||
    (currentRatio === previousRatio && score > previous.bestScore)
  const poolQuestionIds = new Set(poolQuestions.map((question) => question.id))
  const completedQuestionIds = new Set(
    (previous?.completedQuestionIds ?? []).filter((questionId) =>
      poolQuestionIds.has(questionId),
    ),
  )
  if (
    poolQuestionIds.size > 0 &&
    completedQuestionIds.size >= poolQuestionIds.size
  ) {
    completedQuestionIds.clear()
  }
  for (const question of session) completedQuestionIds.add(question.id)

  return {
    topicId,
    bestScore: replacesBest ? score : previous.bestScore,
    totalQuestions: replacesBest ? totalQuestions : previous.totalQuestions,
    attemptsCount: (previous?.attemptsCount ?? 0) + 1,
    lastAttemptAt: attemptedAt,
    completedQuestionIds: [...completedQuestionIds],
  } satisfies TopicMasteryRecord
}

function scoreFor(
  session: readonly TopicQuizQuestion[],
  answers: Readonly<Record<string, SubmittedAnswer>>,
) {
  return session.reduce(
    (total, question) => total + (answers[question.id]?.correct ? 1 : 0),
    0,
  )
}

function TopicQuizSession({
  pool,
  topicTitle,
  onClose,
  storage,
  random,
  now,
}: Required<Pick<TopicQuizModalProps, 'pool' | 'topicTitle' | 'onClose'>> &
  Pick<TopicQuizModalProps, 'storage' | 'random' | 'now'>) {
  const resolvedStorage = storage === undefined ? browserStorage() : storage
  const randomSource = random ?? Math.random
  const nowSource = now ?? (() => new Date())
  const initialMastery = useMemo(
    () => readTopicMasteryRecord(resolvedStorage, pool.topicId),
    [pool.topicId, resolvedStorage],
  )
  const [mastery, setMastery] = useState<TopicMasteryRecord | null>(
    initialMastery,
  )
  const [session, setSession] = useState(() =>
    sampleTopicQuizQuestions(
      pool,
      initialMastery?.completedQuestionIds ?? [],
      TOPIC_QUIZ_SESSION_SIZE,
      randomSource,
    ),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, SubmittedAnswer>>({})
  const [phase, setPhase] = useState<'questions' | 'summary'>('questions')
  const [attemptSaved, setAttemptSaved] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const questionLegendRef = useRef<HTMLLegendElement>(null)
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null)
  const hasPresentedFirstQuestionRef = useRef(false)
  const currentQuestion = session[currentIndex]
  const submittedAnswer = currentQuestion
    ? answers[currentQuestion.id] ?? null
    : null
  const totalScore = scoreFor(session, answers)

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key === 'Tab') {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), summary, [href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
        return
      }

      if (event.key === 'Enter') {
        const target = event.target
        if (
          target instanceof HTMLElement &&
          target.closest('button, summary')
        ) {
          return
        }
        const action = dialogRef.current?.querySelector<HTMLButtonElement>(
          '.topic-quiz-actions .topic-quiz-primary:not(:disabled)',
        )
        if (action) {
          event.preventDefault()
          event.stopPropagation()
          action.click()
        }
        return
      }

      if (phase !== 'questions' || !currentQuestion || submittedAnswer) return
      const key = event.key.toLocaleLowerCase()
      const numericIndex = /^[1-4]$/.test(key) ? Number(key) - 1 : -1
      const letterIndex = OPTION_LETTERS.findIndex(
        (letter) => letter.toLocaleLowerCase() === key,
      )
      const optionIndex = numericIndex >= 0 ? numericIndex : letterIndex
      if (optionIndex >= 0 && optionIndex < currentQuestion.options.length) {
        event.preventDefault()
        event.stopPropagation()
        setSelectedIndex(optionIndex)
        dialogRef.current
          ?.querySelector<HTMLInputElement>(
            `[data-topic-quiz-option="${optionIndex}"]`,
          )
          ?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestion, onClose, phase, submittedAnswer])

  useEffect(() => {
    if (!currentQuestion) return
    if (!hasPresentedFirstQuestionRef.current) {
      hasPresentedFirstQuestionRef.current = true
      return
    }
    if (phase === 'summary') summaryHeadingRef.current?.focus()
    else questionLegendRef.current?.focus()
  }, [currentIndex, currentQuestion, phase, session])

  const saveAttempt = (nextAnswers: Record<string, SubmittedAnswer>) => {
    if (attemptSaved || session.length === 0) return
    const attemptedAt = nowSource().toISOString()
    const latestStoredMastery = readTopicMasteryRecord(
      resolvedStorage,
      pool.topicId,
    )
    const previousMastery =
      latestStoredMastery &&
      latestStoredMastery.attemptsCount >= (mastery?.attemptsCount ?? 0)
        ? latestStoredMastery
        : mastery
    const nextMastery = createMasteryRecord(
      previousMastery,
      pool.topicId,
      session,
      nextAnswers,
      attemptedAt,
      validTopicQuizQuestions(pool),
    )
    writeTopicMasteryRecord(resolvedStorage, nextMastery)
    setMastery(nextMastery)
    setAttemptSaved(true)
  }

  const submitAnswer = () => {
    if (!currentQuestion || selectedIndex === null || submittedAnswer) return
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: {
        selectedIndex,
        correct: selectedIndex === currentQuestion.correctIndex,
      },
    }
    setAnswers(nextAnswers)
    if (currentIndex === session.length - 1) saveAttempt(nextAnswers)
  }

  const continueQuiz = () => {
    if (!submittedAnswer) return
    if (currentIndex === session.length - 1) {
      saveAttempt(answers)
      setPhase('summary')
      return
    }
    setCurrentIndex((index) => index + 1)
    setSelectedIndex(null)
  }

  const practiceAnother = () => {
    const nextSession = sampleTopicQuizQuestions(
      pool,
      mastery?.completedQuestionIds ?? [],
      TOPIC_QUIZ_SESSION_SIZE,
      randomSource,
    )
    setSession(nextSession)
    setCurrentIndex(0)
    setSelectedIndex(null)
    setAnswers({})
    setAttemptSaved(false)
    setPhase('questions')
  }

  const masteryPercent = session.length
    ? Math.round((totalScore / session.length) * 100)
    : 0

  return (
    <div
      className='topic-quiz-backdrop'
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        onClose()
      }}
    >
      <section
        className='topic-quiz-modal'
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='topic-quiz-title'
        aria-describedby='topic-quiz-description'
        data-reader-hotkeys='off'
      >
        <header className='topic-quiz-header'>
          <div>
            <p className='topic-quiz-eyebrow'>Topic mastery</p>
            <h2 id='topic-quiz-title'>Test your mastery</h2>
            <p id='topic-quiz-description'>{topicTitle}</p>
          </div>
          <button
            ref={closeButtonRef}
            type='button'
            className='topic-quiz-close'
            onClick={onClose}
            aria-label='Close mastery quiz'
          >
            <X size={18} aria-hidden='true' />
          </button>
        </header>

        {session.length === 0 ? (
          <div className='topic-quiz-empty' role='status'>
            <h3>This quiz is not ready yet</h3>
            <p>No valid questions are available for this topic.</p>
            <button type='button' onClick={onClose}>Return to the textbook</button>
          </div>
        ) : phase === 'summary' ? (
          <div className='topic-quiz-summary'>
            <div className='topic-quiz-summary-score' role='status'>
              <Trophy size={28} aria-hidden='true' />
              <p><strong>{totalScore} / {session.length}</strong></p>
              <h3 ref={summaryHeadingRef} tabIndex={-1}>
                {masteryPercent}% Conceptual Mastery
              </h3>
            </div>

            <section className='topic-quiz-review' aria-labelledby='topic-quiz-review-title'>
              <h3 id='topic-quiz-review-title'>Review this session</h3>
              {session.map((question, index) => {
                const answer = answers[question.id]
                return (
                  <details className='topic-quiz-review-item' key={question.id}>
                    <summary>
                      <span>Question {index + 1}</span>
                      <strong className={answer?.correct ? 'is-correct' : 'is-incorrect'}>
                        {answer?.correct ? 'Correct' : 'Review'}
                      </strong>
                    </summary>
                    <div>
                      <p className='topic-quiz-review-question'>{question.question}</p>
                      <p><strong>Your answer:</strong>{' '}
                        {answer ? question.options[answer.selectedIndex] : 'No answer'}
                      </p>
                      <p><strong>Correct answer:</strong>{' '}
                        {question.options[question.correctIndex]}
                      </p>
                      <p>{question.explanation}</p>
                      <blockquote>{question.sourceEvidence}</blockquote>
                    </div>
                  </details>
                )
              })}
            </section>

            <div className='topic-quiz-summary-actions'>
              <button type='button' className='topic-quiz-primary' onClick={practiceAnother}>
                <RefreshCw size={16} aria-hidden='true' />
                Practice another {Math.min(TOPIC_QUIZ_SESSION_SIZE, validTopicQuizQuestions(pool).length)} questions
              </button>
              <button type='button' className='topic-quiz-secondary' onClick={onClose}>
                Return to textbook
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className='topic-quiz-question-view'>
            <div
              className='topic-quiz-progress'
              aria-label={`Question ${currentIndex + 1} of ${session.length}`}
              aria-live='polite'
              aria-atomic='true'
            >
              <span>Question {currentIndex + 1} of {session.length}</span>
              <div aria-hidden='true'>
                <span style={{ width: `${((currentIndex + 1) / session.length) * 100}%` }} />
              </div>
            </div>

            <fieldset className='topic-quiz-options'>
              <legend ref={questionLegendRef} tabIndex={-1}>
                {currentQuestion.question}
              </legend>
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = selectedIndex === optionIndex
                const isCorrect =
                  Boolean(submittedAnswer) && optionIndex === currentQuestion.correctIndex
                const isIncorrect =
                  Boolean(submittedAnswer) &&
                  isSelected &&
                  optionIndex !== currentQuestion.correctIndex
                const className = [
                  'topic-quiz-option',
                  isSelected ? 'is-selected' : '',
                  isCorrect ? 'is-correct' : '',
                  isIncorrect ? 'is-incorrect' : '',
                ].filter(Boolean).join(' ')
                return (
                  <label className={className} key={`${optionIndex}:${option}`}>
                    <input
                      type='radio'
                      name={`topic-quiz-${pool.topicId}-${currentQuestion.id}`}
                      checked={isSelected}
                      onChange={() => setSelectedIndex(optionIndex)}
                      disabled={Boolean(submittedAnswer)}
                      data-topic-quiz-option={optionIndex}
                    />
                    <kbd>{OPTION_LETTERS[optionIndex]} / {optionIndex + 1}</kbd>
                    <span>{option}</span>
                    {isCorrect && <CheckCircle2 size={18} aria-hidden='true' />}
                    {isIncorrect && <XCircle size={18} aria-hidden='true' />}
                  </label>
                )
              })}
            </fieldset>

            {submittedAnswer && (
              <section
                className={
                  'topic-quiz-feedback ' +
                  (submittedAnswer.correct ? 'is-correct' : 'is-incorrect')
                }
                aria-live='polite'
                aria-atomic='true'
              >
                <h3>{submittedAnswer.correct ? 'Correct' : 'Not quite'}</h3>
                <p>{currentQuestion.explanation}</p>
                <blockquote>
                  <strong>Source evidence</strong>
                  <span>{currentQuestion.sourceEvidence}</span>
                </blockquote>
                {currentQuestion.misconceptionTargeted.trim() && (
                  <p className='topic-quiz-misconception'>
                    <strong>Exam trap:</strong> {currentQuestion.misconceptionTargeted}
                  </p>
                )}
              </section>
            )}

            <div className='topic-quiz-actions'>
              {!submittedAnswer ? (
                <button
                  type='button'
                  className='topic-quiz-primary'
                  disabled={selectedIndex === null}
                  onClick={submitAnswer}
                >
                  Submit answer
                </button>
              ) : (
                <button type='button' className='topic-quiz-primary' onClick={continueQuiz}>
                  {currentIndex === session.length - 1 ? 'View results' : 'Next question'}
                </button>
              )}
              <p>Use A–D or 1–4 to select an answer.</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function TopicQuizLoading({
  topicTitle,
  onClose,
}: Pick<TopicQuizModalProps, 'topicTitle' | 'onClose'>) {
  return (
    <div
      className='topic-quiz-backdrop'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className='topic-quiz-modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='topic-quiz-loading-title'
        aria-describedby='topic-quiz-loading-description'
      >
        <header className='topic-quiz-header'>
          <div>
            <p className='topic-quiz-eyebrow'>Topic mastery</p>
            <h2 id='topic-quiz-loading-title'>Preparing your topic check</h2>
            <p id='topic-quiz-loading-description'>{topicTitle}</p>
          </div>
          <button
            type='button'
            className='topic-quiz-close'
            onClick={onClose}
            aria-label='Close mastery quiz'
            autoFocus
          >
            <X size={18} aria-hidden='true' />
          </button>
        </header>
        <div className='topic-quiz-empty' role='status' aria-live='polite'>
          Loading your five local questions…
        </div>
      </section>
    </div>
  )
}

export function TopicQuizModal(props: TopicQuizModalProps) {
  const topicId = props.topicId ?? props.pool?.topicId ?? ''
  const subjectId = props.subjectId ?? props.pool?.subjectId ?? ''
  const requestedKey = quizPoolCacheKey(topicId, subjectId)
  const [resolvedPool, setResolvedPool] = useState<{
    key: string
    pool: TopicQuizPool
  } | null>(() => {
    const cached = props.pool ?? getCachedTopicQuizPool(topicId, subjectId)
    return cached ? { key: requestedKey, pool: cached } : null
  })

  useEffect(() => {
    if (props.pool) return
    let cancelled = false
    void loadTopicQuizPool(topicId, subjectId).then((pool) => {
      if (!cancelled) setResolvedPool({ key: requestedKey, pool })
    })
    return () => {
      cancelled = true
    }
  }, [props.pool, requestedKey, subjectId, topicId])

  const pool =
    props.pool ??
    (resolvedPool?.key === requestedKey ? resolvedPool.pool : null)
  if (!pool) {
    return (
      <TopicQuizLoading topicTitle={props.topicTitle} onClose={props.onClose} />
    )
  }
  return <TopicQuizSession key={pool.topicId} {...props} pool={pool} />
}
