// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TopicQuizPool, TopicQuizQuestion } from '../types'
import {
  getTopicMasteryStorageKey,
  loadTopicQuizPool,
  readTopicMasteryRecord,
  sampleTopicQuizQuestions,
  TopicQuizModal,
  validTopicQuizQuestions,
} from './TopicQuizModal'

function question(index: number): TopicQuizQuestion {
  return {
    id: `question-${index}`,
    sectionId: index <= 4 ? 'overview' : 'application',
    question: `Scientific question ${index}?`,
    options: [
      `Correct option ${index}`,
      `Distractor B${index}`,
      `Distractor C${index}`,
      `Distractor D${index}`,
    ],
    correctIndex: 0,
    explanation: `Explanation for question ${index}.`,
    sourceEvidence: `Evidence for question ${index}.`,
    misconceptionTargeted: `Misconception ${index}.`,
  }
}

function pool(size = 6): TopicQuizPool {
  return {
    topicId: 'cellular-respiration',
    subjectId: 'biology',
    questions: Array.from({ length: size }, (_, index) => question(index + 1)),
  }
}

function memoryStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  }
}

afterEach(cleanup)

describe('TopicQuizModal question sampling', () => {
  it('loads 40 questions across every instructional section of a topic', async () => {
    const loaded = await loadTopicQuizPool('action-potential', 'biology')
    const counts = new Map<string, number>()

    for (const item of loaded.questions) {
      counts.set(item.sectionId, (counts.get(item.sectionId) ?? 0) + 1)
    }

    expect(loaded.questions).toHaveLength(40)
    expect([...counts.entries()].sort(([left], [right]) => left.localeCompare(right))).toEqual([
      ['depolarization', 7],
      ['exam-traps', 6],
      ['overview', 7],
      ['repolarization', 7],
      ['resting-potential', 7],
      ['synaptic-transmission', 6],
    ])
  })

  it('uses unseen questions before any completed question', () => {
    const quizPool = pool(7)
    const result = sampleTopicQuizQuestions(
      quizPool,
      ['question-1', 'question-2'],
      5,
      () => 0,
    )

    expect(result).toHaveLength(5)
    expect(result.map((item) => item.id).sort()).toEqual([
      'question-3',
      'question-4',
      'question-5',
      'question-6',
      'question-7',
    ])
  })

  it('serves eight five-question sessions before repeating a 40-question pool', () => {
    const quizPool = pool(40)
    const completed: string[] = []

    for (let sessionIndex = 0; sessionIndex < 8; sessionIndex += 1) {
      const session = sampleTopicQuizQuestions(
        quizPool,
        completed,
        5,
        () => 0,
      )

      expect(session).toHaveLength(5)
      for (const item of session) {
        expect(completed).not.toContain(item.id)
        completed.push(item.id)
      }
    }

    expect(new Set(completed)).toHaveLength(40)
    expect(
      sampleTopicQuizQuestions(quizPool, completed, 5, () => 0),
    ).toHaveLength(5)
  })

  it('deduplicates IDs and safely ignores malformed questions in a short pool', () => {
    const first = question(1)
    const malformedPool = {
      ...pool(0),
      questions: [
        first,
        { ...question(2), id: first.id },
        { ...question(3), options: ['only one option'] },
      ],
    } as unknown as TopicQuizPool

    expect(validTopicQuizQuestions(malformedPool)).toEqual([first])
    expect(sampleTopicQuizQuestions(malformedPool, [], 5, () => 0)).toEqual([
      first,
    ])
  })
})

describe('TopicQuizModal session', () => {
  it('ignores malformed or mismatched mastery storage without blocking a session', () => {
    const quizPool = pool()
    const storageKey = getTopicMasteryStorageKey(quizPool.topicId)
    const malformedStorage = memoryStorage({
      [storageKey]: '{not-json',
    })

    expect(readTopicMasteryRecord(malformedStorage, quizPool.topicId)).toBeNull()

    const firstRender = render(
      <TopicQuizModal
        pool={quizPool}
        topicTitle='Cellular Respiration'
        storage={malformedStorage}
        random={() => 0}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Question 1 of 5')).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    firstRender.unmount()

    const mismatchedStorage = memoryStorage({
      [storageKey]: JSON.stringify({
        topicId: 'another-topic',
        bestScore: 5,
        totalQuestions: 5,
        attemptsCount: 3,
        lastAttemptAt: '2026-08-26T09:00:00.000Z',
        completedQuestionIds: quizPool.questions.map((item) => item.id),
      }),
    })

    expect(readTopicMasteryRecord(mismatchedStorage, quizPool.topicId)).toBeNull()

    render(
      <TopicQuizModal
        pool={quizPool}
        topicTitle='Cellular Respiration'
        storage={mismatchedStorage}
        random={() => 0}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Question 1 of 5')).toBeTruthy()
  })

  it('supports keyboard answers, gives immediate evidence, summarizes, and persists mastery', async () => {
    const user = userEvent.setup()
    const quizPool = pool()
    const storage = memoryStorage()

    render(
      <TopicQuizModal
        pool={quizPool}
        topicTitle='Cellular Respiration'
        storage={storage}
        random={() => 0}
        now={() => new Date('2026-08-26T10:00:00.000Z')}
        onClose={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Test your mastery' }),
    ).toBeTruthy()

    for (let index = 0; index < 5; index += 1) {
      expect(screen.getByText(`Question ${index + 1} of 5`)).toBeTruthy()
      await user.keyboard(index % 2 === 0 ? '1' : 'a')
      expect((screen.getAllByRole('radio')[0] as HTMLInputElement).checked).toBe(
        true,
      )
      if (index === 0) {
        await user.keyboard('{Enter}')
      } else {
        await user.click(screen.getByRole('button', { name: 'Submit answer' }))
      }
      expect(screen.getByRole('heading', { name: 'Correct' })).toBeTruthy()
      expect(screen.getByText(/Explanation for question/)).toBeTruthy()
      expect(screen.getByText(/Evidence for question/)).toBeTruthy()
      if (index === 0) {
        await user.keyboard('{Enter}')
      } else {
        await user.click(
          screen.getByRole('button', {
            name: index === 4 ? 'View results' : 'Next question',
          }),
        )
      }
      if (index < 4) {
        expect(document.activeElement).toBe(
          screen.getByRole('group').querySelector('legend'),
        )
      }
    }

    expect(screen.getByText('5 / 5')).toBeTruthy()
    const summaryHeading = screen.getByRole('heading', {
      name: '100% Conceptual Mastery',
    })
    expect(summaryHeading).toBeTruthy()
    expect(document.activeElement).toBe(summaryHeading)
    expect(screen.getAllByText(/Question [1-5]/).length).toBeGreaterThanOrEqual(5)
    expect(screen.getAllByText('Correct answer:')).toHaveLength(5)

    const saved = JSON.parse(
      storage.getItem(getTopicMasteryStorageKey(quizPool.topicId)) ?? '{}',
    ) as {
      topicId: string
      bestScore: number
      totalQuestions: number
      attemptsCount: number
      lastAttemptAt: string
      completedQuestionIds: string[]
    }
    expect(saved).toMatchObject({
      topicId: quizPool.topicId,
      bestScore: 5,
      totalQuestions: 5,
      attemptsCount: 1,
      lastAttemptAt: '2026-08-26T10:00:00.000Z',
    })
    expect(saved.completedQuestionIds).toHaveLength(5)

    const remainingQuestion = quizPool.questions.find(
      (item) => !saved.completedQuestionIds.includes(item.id),
    )
    expect(remainingQuestion).toBeTruthy()
    await user.click(
      screen.getByRole('button', { name: 'Practice another 5 questions' }),
    )
    expect(screen.getByText(remainingQuestion?.question ?? '')).toBeTruthy()
    expect(document.activeElement).toBe(
      screen.getByRole('group').querySelector('legend'),
    )
  })

  it('closes with Escape and shows a safe empty state for an invalid pool', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const emptyPool = {
      topicId: 'empty-topic',
      subjectId: 'physics',
      questions: [],
    } satisfies TopicQuizPool

    render(
      <TopicQuizModal
        pool={emptyPool}
        topicTitle='Empty topic'
        storage={memoryStorage()}
        onClose={onClose}
      />,
    )

    expect(screen.getByText('This quiz is not ready yet')).toBeTruthy()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close mastery quiz' }),
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
