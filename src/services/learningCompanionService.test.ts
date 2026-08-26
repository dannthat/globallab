import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LearningCompanionRequest } from '../personalization/companionTypes'
import {
  buildLearningCompanionPrompt,
  createLearningCompanion,
  parseLearningCompanionResponse,
} from './learningCompanionService'

function request(
  overrides: Partial<LearningCompanionRequest> = {},
): LearningCompanionRequest {
  return {
    excerpt: {
      anchor: {
        sourceId: 'biology:respiration',
        sourceKind: 'global-lab',
        sourceTitle: 'National Institute of General Medical Sciences',
        anchorId: 'glycolysis',
        anchorLabel: 'Glycolysis',
        url: 'https://example.test/source',
        license: 'Public domain',
        sourceRevision: '2026-08-26',
      },
      text:
        'Glycolysis occurs in the cytoplasm. It splits glucose into pyruvate and transfers energy into ATP and NADH.',
    },
    mode: 'simpler',
    profile: {
      interest: 'basketball',
      gradeLevel: 'Grade 10',
      createdAt: '2026-08-26T00:00:00.000Z',
    },
    approvedPresentation: {},
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('learningCompanionService', () => {
  it('treats source content as untrusted and includes only approved preferences', () => {
    const prompt = buildLearningCompanionPrompt(
      request({
        approvedPresentation: {
          structure: {
            value: 'steps',
            origin: 'explicit',
            approvedAt: '2026-08-26T00:00:00.000Z',
          },
        },
      }),
    )

    expect(prompt).toContain('untrusted student or publisher data')
    expect(prompt).toContain('<UNTRUSTED_SOURCE_DATA>')
    expect(prompt).toContain('The student approved step-by-step structure')
    expect(prompt).toContain('chosen basketball lens is a core requirement')
    expect(prompt).toContain('Use everyday language')
    expect(prompt).toContain('National Institute of General Medical Sciences, Glycolysis')
  })

  it('uses a vetted preset locally without transmitting source text', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const artifact = await createLearningCompanion(
      request({
        mode: 'analogy',
        presetAnalogy: 'A basketball team moves energy through coordinated passes.',
      }),
    )

    expect(artifact.provider).toBe('preset')
    expect(artifact.content).toContain('basketball team')
    expect(artifact.excerpt.anchor.anchorId).toBe('glycolysis')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('parses grounded provider output and keeps the exact source anchor', async () => {
    vi.stubEnv('VITE_PERSONALIZATION_ENDPOINT', '/api/personalize')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'gemini-test',
          text: JSON.stringify({
            title: 'A clearer version',
            content: 'Glycolysis happens in the cytoplasm and splits glucose.',
            limitations: 'The unchanged source contains the full detail.',
            quiz: null,
          }),
        }),
      }),
    )

    const artifact = await createLearningCompanion(request())

    expect(artifact.provider).toBe('gemini')
    expect(artifact.model).toBe('gemini-test')
    expect(artifact.excerpt.anchor.anchorId).toBe('glycolysis')
    expect(artifact.content).toContain('cytoplasm')
  })

  it('keeps uploaded-source help local when the privacy boundary is requested', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const artifact = await createLearningCompanion(request({ localOnly: true }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(artifact.provider).toBe('local')
    expect(artifact.title).toBe('A shorter source view')
    expect(artifact.limitations).toContain('does not rewrite technical terms')
  })

  it('does not label reading order as a process when local source text is not sequential', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ code: 'PROVIDER_NOT_CONFIGURED' }),
      }),
    )

    const artifact = await createLearningCompanion(
      request({ mode: 'step-by-step' }),
    )

    expect(artifact.provider).toBe('local')
    expect(artifact.title).toBe('Source ideas in reading order')
    expect(artifact.content).toContain('Reading order — not a confirmed process')
    expect(artifact.content).toContain('1. Glycolysis occurs in the cytoplasm.')
    expect(artifact.limitations).toContain('not process stages')
  })

  it('labels an explicit source sequence without adding transitions', async () => {
    const artifact = await createLearningCompanion(
      request({
        localOnly: true,
        mode: 'step-by-step',
        excerpt: {
          ...request().excerpt,
          text: 'First, glucose enters glycolysis. Then pyruvate is produced. Finally, energy is transferred into ATP.',
        },
      }),
    )

    expect(artifact.title).toBe('Sequence stated by the source')
    expect(artifact.content).toContain('Source sequence')
    expect(artifact.content).toContain('2. Then pyruvate is produced.')
    expect(artifact.limitations).toContain('without adding transitions')
  })

  it('keeps local shorter and detailed views honest about their limits', async () => {
    const excerpt = {
      ...request().excerpt,
      text: 'Glycolysis occurs in the cytoplasm. Glucose is split into pyruvate. Energy is transferred into ATP. NADH carries high-energy electrons.',
    }
    const shorter = await createLearningCompanion(
      request({ localOnly: true, mode: 'simpler', excerpt }),
    )
    const detailed = await createLearningCompanion(
      request({ localOnly: true, mode: 'more-detailed', excerpt }),
    )

    expect(shorter.content).toContain('1. Glycolysis occurs in the cytoplasm.')
    expect(shorter.content).toContain('basketball lens:')
    expect(shorter.content).toContain('playbook')
    expect(shorter.content).toContain('2. Glucose is split into pyruvate.')
    expect(shorter.content).not.toContain('NADH carries high-energy electrons.')
    expect(shorter.limitations).toContain('does not rewrite technical terms')

    expect(detailed.content).toContain('— Glycolysis occurs in the cytoplasm.')
    expect(detailed.content).toContain('basketball lens:')
    expect(detailed.content).toContain('— NADH carries high-energy electrons.')
    expect(detailed.limitations).toContain('cannot add detail')
  })

  it('quotes a source-provided example and never invents a missing one locally', async () => {
    const withExample = await createLearningCompanion(
      request({
        localOnly: true,
        mode: 'another-example',
        excerpt: {
          ...request().excerpt,
          text: 'Some cells specialize; for example, red blood cells carry oxygen.',
        },
      }),
    )
    const withoutExample = await createLearningCompanion(
      request({ localOnly: true, mode: 'another-example' }),
    )

    expect(withExample.title).toBe('Example already in the source')
    expect(withExample.content).toContain(
      'Source-provided example: Some cells specialize; for example, red blood cells carry oxygen.',
    )
    expect(withExample.limitations).toContain('does not invent another one')

    expect(withoutExample.title).toBe('No source-provided example found')
    expect(withoutExample.content).toContain('No separate example appears')
    expect(withoutExample.limitations).toContain('does not invent an example')
  })

  it('creates a private local analogy without inventing subject facts', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const artifact = await createLearningCompanion(
      request({ localOnly: true, mode: 'analogy', presetAnalogy: undefined }),
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(artifact.provider).toBe('local')
    expect(artifact.title).toBe('Read it like a playbook')
    expect(artifact.content).toContain('Glycolysis occurs in the cytoplasm.')
    expect(artifact.content).toContain('opening play')
    expect(artifact.limitations).toContain('not its subject facts')
  })

  it('uses whole interest words when choosing a local analogy lens', async () => {
    const artifact = await createLearningCompanion(
      request({
        localOnly: true,
        mode: 'analogy',
        presetAnalogy: undefined,
        profile: { ...request().profile, interest: 'fitness analytics' },
      }),
    )

    expect(artifact.title).toBe('Connect this to fitness analytics')
    expect(artifact.content).toContain('a familiar map of fitness analytics')
    expect(artifact.content).not.toContain('playbook')
  })

  it('builds a deterministic cloze with one exact source answer', async () => {
    const quizRequest = request({ localOnly: true, mode: 'test-me' })
    const first = await createLearningCompanion(quizRequest)
    const second = await createLearningCompanion(quizRequest)
    const quiz = first.quiz

    expect(quiz).toBeDefined()
    expect(second.quiz).toEqual(quiz)
    expect(new Set(quiz?.options).size).toBe(4)
    expect(first.limitations).toContain('checks recall of one source sentence')

    const cloze = quiz?.question.match(/“(.+)”/)?.[1]
    expect(cloze).toContain('____')
    expect(cloze?.replace('____', quiz?.options[quiz.correctIndex] ?? '')).toBe(
      quiz?.evidence,
    )
    quiz?.options.forEach((option, index) => {
      if (index === quiz.correctIndex) return
      expect(cloze?.replace('____', option)).not.toBe(quiz.evidence)
    })
    expect(request().excerpt.text).toContain(quiz?.evidence ?? '')
  })

  it('keeps a four-option deterministic cloze for very short source text', async () => {
    const artifact = await createLearningCompanion(
      request({
        localOnly: true,
        mode: 'test-me',
        excerpt: { ...request().excerpt, text: 'ATP.' },
      }),
    )

    expect(artifact.quiz?.question).toContain('“____.”')
    expect(artifact.quiz?.options).toHaveLength(4)
    expect(new Set(artifact.quiz?.options).size).toBe(4)
    expect(artifact.quiz?.options[artifact.quiz.correctIndex]).toBe('ATP')
    expect(artifact.quiz?.evidence).toBe('ATP.')
  })

  it('validates quiz output and replaces unsupported evidence with source text', () => {
    const artifact = parseLearningCompanionResponse(
      JSON.stringify({
        title: 'Quick source check',
        content: 'Choose the source-backed answer.',
        limitations: 'This checks one selected passage.',
        quiz: {
          question: 'Where does glycolysis occur?',
          options: ['Cytoplasm', 'Nucleus', 'Golgi apparatus', 'Cell wall'],
          correctIndex: 0,
          explanation: 'The source places glycolysis in the cytoplasm.',
          evidence: 'This phrase was invented and is not in the source.',
        },
      }),
      request({ mode: 'test-me' }),
      'gemini-test',
    )

    expect(artifact.quiz?.correctIndex).toBe(0)
    expect(artifact.quiz?.evidence).toContain('Glycolysis occurs in the cytoplasm')
  })

  it('maps rate limits and cancellation to recoverable errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({}),
      }),
    )
    await expect(createLearningCompanion(request())).rejects.toThrow(
      'Personalization is busy',
    )

    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        Object.assign(new Error('aborted'), { name: 'AbortError' }),
      ),
    )
    await expect(
      createLearningCompanion(request({ signal: controller.signal })),
    ).rejects.toThrow('cancelled')
  })
})
