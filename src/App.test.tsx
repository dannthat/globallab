// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))
import App from './App'
import { LEARNING_COMPANION_CACHE_KEYS } from './hooks/useLearnYourWay'
import { subjects } from './knowledge'
import {
  createLearnerModelState,
  LEARNER_MODEL_STORAGE_KEY,
} from './personalization/learnerModel'
import type { StudentProfile } from './types'

interface ProxySuccessOptions {
  title?: string
  limitations?: string
  quiz?: {
    question: string
    options: [string, string, string, string]
    correctIndex: number
    explanation: string
    evidence: string
  } | null
}

function proxySuccess(content: string, options: ProxySuccessOptions = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      text: JSON.stringify({
        title: options.title ?? 'A source-grounded bridge',
        content,
        limitations:
          options.limitations ?? 'This help does not replace the original source.',
        quiz: options.quiz ?? null,
      }),
      model: 'gemini-test',
    }),
  }
}

function seedProfile(overrides: Partial<StudentProfile> = {}) {
  const profile: StudentProfile = {
    interest: 'neutral',
    createdAt: '2026-08-24T00:00:00.000Z',
    ...overrides,
  }
  window.localStorage.setItem('globallab_profile', JSON.stringify(profile))
}

async function openFirstTopic(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Biology/ }))
  await user.click(
    await screen.findByRole('button', {
      name: /Cellular Respiration & ATP Synthesis/,
    }),
  )
  await screen.findByRole('heading', {
    level: 1,
    name: subjects[0].topics[0].sections[0].heading,
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

beforeEach(() => {
  window.localStorage.clear()
  // jsdom crashes on getComputedStyle when CSS custom properties contain complex
  // gradient values (var(--gl-paper-lit) etc.). Wrap to return a safe stub on crash.
  const nativeGetComputedStyle = window.getComputedStyle.bind(window)
  const safeStub = {
    getPropertyValue: () => '',
    length: 0,
  } as unknown as CSSStyleDeclaration
  vi.spyOn(window, 'getComputedStyle').mockImplementation((elt, pseudo) => {
    try {
      return nativeGetComputedStyle(elt, pseudo)
    } catch {
      return safeStub
    }
  })
})

describe('Global Lab V4', () => {
  it('onboards once and shows the four-subject library', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Learning that speaks/i }),
    ).toBeTruthy()

    await user.type(screen.getByLabelText('What are you into?'), 'basketball')
    await user.selectOptions(screen.getByLabelText(/Your level/), 'Grade 10')
    await user.click(screen.getByRole('button', { name: /Start studying/ }))

    // After onboarding, home page renders â€” subjects are navigable buttons
    expect(
      (screen.getByRole('button', { name: /^Biology/ }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: /^Physics/ }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: /^Chemistry/ }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: /^Mathematics/ }) as HTMLButtonElement).disabled,
    ).toBe(false)

    const stored = JSON.parse(
      window.localStorage.getItem('globallab_profile') ?? '{}',
    ) as StudentProfile
    expect(stored.interest).toBe('basketball')
    expect(stored.gradeLevel).toBe('Grade 10')

    unmount()
    render(<App />)
    expect(screen.queryByText('Make help fit the moment')).toBeNull()
    // Home page renders â€” onboarding is gone, subjects are navigable
    expect(screen.getByRole('button', { name: /Biology/ })).toBeTruthy()
  })

  it('features the last opened subject on the home reading-room hero', async () => {
    seedProfile({ interest: 'gaming' })
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Biology' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /^Biology/ }).getAttribute('aria-current'),
    ).toBe('page')

    await user.click(screen.getByRole('button', { name: /^Physics/ }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Physics' }),
    ).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Back to library' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Physics' }),
    ).toBeTruthy()
    expect(window.localStorage.getItem('gl_recent_subject')).toBe('physics')

    unmount()
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Physics' }),
    ).toBeTruthy()
  })

  it('deletes learner memory and every persisted companion cache without deleting the profile', async () => {
    seedProfile({ interest: 'basketball' })
    window.localStorage.setItem(
      LEARNER_MODEL_STORAGE_KEY,
      JSON.stringify(createLearnerModelState(new Date('2026-08-26T00:00:00.000Z'))),
    )
    for (const key of LEARNING_COMPANION_CACHE_KEYS) {
      window.localStorage.setItem(key, '[{cached:true}]')
    }
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Learning settings/ }))
    await user.click(screen.getByRole('button', { name: 'Delete learning data' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(window.localStorage.getItem(LEARNER_MODEL_STORAGE_KEY)).toBeNull()
    for (const key of LEARNING_COMPANION_CACHE_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull()
    }
    expect(window.localStorage.getItem('globallab_profile')).not.toBeNull()
  })

  it('lets a neutral student skip profiling and still use simpler and test help', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        proxySuccess('Cellular respiration releases usable energy from the source molecules.', {
          title: 'In plain language',
        }),
      )
      .mockResolvedValueOnce(
        proxySuccess('Check the source idea with one question.', {
          title: 'Check your understanding',
          quiz: {
            question: 'What does cellular respiration produce for cell activities?',
            options: ['ATP', 'DNA', 'Cellulose', 'Chlorophyll'],
            correctIndex: 0,
            explanation: 'The source identifies ATP as the usable energy product.',
            evidence: 'produce adenosine triphosphate (ATP)',
          },
        }),
      )
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(
      JSON.parse(window.localStorage.getItem('globallab_profile') ?? '{}'),
    ).toMatchObject({ interest: 'neutral' })
    await openFirstTopic(user)

    const topic = subjects[0].topics[0]
    const section = topic.sections[0]
    const sectionElement = document.getElementById(section.id) as HTMLElement
    const originalBody = sectionElement.querySelector('.tbp-body')?.textContent

    await user.click(
      within(sectionElement).getByRole('button', { name: /Connect this to|Learn your way/i }),
    )
    expect(
      await within(sectionElement).findByText(
        'Cellular respiration releases usable energy from the source molecules.',
      ),
    ).toBeTruthy()
    expect(
      within(sectionElement).getByRole('button', { name: 'Simpler' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')
    expect(within(sectionElement).getByText('Original unchanged.')).toBeTruthy()
    expect(
      within(sectionElement)
        .getByRole('link', { name: topic.source.name })
        .getAttribute('href'),
    ).toBe(topic.source.url)

    await user.click(within(sectionElement).getByRole('button', { name: 'Test me' }))
    expect(
      await within(sectionElement).findByText(
        'What does cellular respiration produce for cell activities?',
      ),
    ).toBeTruthy()
    await user.click(within(sectionElement).getByRole('radio', { name: 'ATP' }))
    await user.click(
      within(sectionElement).getByRole('button', { name: 'Submit answer' }),
    )
    expect(await within(sectionElement).findByText('Score: 1 of 1')).toBeTruthy()

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls.every(([url]) => url === '/api/personalize')).toBe(true)
    expect(sectionElement.querySelector('.tbp-body')?.textContent).toBe(originalBody)
  })

  it('opens all five textbook topics with diagrams, callouts, navigation, and sources', async () => {
    seedProfile()
    const user = userEvent.setup()
    const { container } = render(<App />)
    const biology = subjects[0]

    await user.click(screen.getByRole('button', { name: /^Biology/ }))

    for (const topic of biology.topics) {
      await user.click(
        await screen.findByRole('button', { name: new RegExp(topic.title) }),
      )

      const readerHeader = container.querySelector('.running-header') as HTMLElement
      expect(within(readerHeader).getByText(topic.title)).toBeTruthy()
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: topic.sections[0].heading,
        }),
      ).toBeTruthy()
      expect(container.querySelectorAll('.tbp-article')).toHaveLength(1)
      expect(container.querySelectorAll('.tbp-body strong').length).toBeGreaterThan(0)
      expect(container.querySelector('.tbp-diagram img')).toBeTruthy()
      expect(container.querySelector('.callout')).toBeTruthy()
      expect(
        screen.getByRole('navigation', {
          name: 'Navigate textbook sections',
        }),
      ).toBeTruthy()
      expect(
        screen.getByText(
          '01 / ' + String(topic.sections.length).padStart(2, '0'),
        ),
      ).toBeTruthy()
      expect(screen.getByText(/According to.*core material/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Connect this to|Learn your way/i })).toBeTruthy()

      const equationSectionIndex = topic.sections.findIndex(
        (section) => section.equation,
      )
      if (equationSectionIndex >= 0) {
        await user.click(
          screen.getByRole('button', {
            name: topic.sections[equationSectionIndex].heading,
          }),
        )
        await waitFor(() => {
          expect(container.querySelector('.tbp-equation .katex')).toBeTruthy()
        })
      }

      await user.click(
        within(readerHeader).getByRole('button', {
          name: 'Back to Biology topics',
        }),
      )
    }
  }, 10_000)

  it('uses a hand-vetted preset analogy without changing the canonical body', async () => {
    seedProfile({ interest: 'basketball', gradeLevel: 'Grade 10' })
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    render(<App />)
    await openFirstTopic(user)

    const topic = subjects[0].topics[0]
    const section = topic.sections[0]
    const sectionElement = document.getElementById(section.id)
    expect(sectionElement).toBeTruthy()
    expect(sectionElement?.querySelector('.tbp-body')?.textContent).toBe(section.body)

    await user.click(
      within(sectionElement as HTMLElement).getByRole('button', {
        name: /Connect this to|Learn your way/i,
      }),
    )

    // Companion panel renders as a right-panel aside
    expect(
      await within(sectionElement as HTMLElement).findByRole('complementary', {
        name: 'Personalized learning companion',
      }),
    ).toBeTruthy()
    expect(
      within(sectionElement as HTMLElement).getByText('Original unchanged.'),
    ).toBeTruthy()
    expect(
      within(sectionElement as HTMLElement)
        .getByRole('link', { name: topic.source.name })
        .getAttribute('href'),
    ).toBe(topic.source.url)
    expect(
      within(sectionElement as HTMLElement).getByText(
        /Where this help stops:/,
      ),
    ).toBeTruthy()
    // New layout uses tbp-reference-section (single-column) instead of tbp-reference-layout
    expect(sectionElement?.querySelector('.tbp-reference-section')).toBeTruthy()
    expect(
      sectionElement?.querySelector('.tbp-reference-section .tbp-diagram img'),
    ).toBeTruthy()
    expect(
      sectionElement?.querySelector('.tbp-reference-section .tbp-equation'),
    ).toBeTruthy()
    // Companion is now an aside panel, not inside textbook-page-left
    expect(
      sectionElement?.querySelector('.tbp-companion-panel'),
    ).toBeTruthy()
    // Companion is not embedded in reference-hero (it's a separate aside)
    expect(
      sectionElement?.querySelector(
        '.tbp-reference-section > .tbp-sticky-analogy',
      ),
    ).toBeNull()
    expect(sectionElement?.querySelector('.tbp-callouts .callout')).toBeTruthy()
    expect(sectionElement?.querySelector('.tbp-term-index')).toBeTruthy()
    expect(sectionElement?.querySelector('.tbp-lens-page')).toBeNull()
    expect(sectionElement?.querySelector('.tbp-body')?.textContent).toBe(section.body)
    expect(mockFetch).not.toHaveBeenCalled()

    await user.click(
      within(sectionElement as HTMLElement).getByRole('button', {
        name: 'Dismiss learning companion',
      }),
    )
    expect(
      within(sectionElement as HTMLElement).queryByRole('complementary', {
        name: 'Personalized learning companion',
      }),
    ).toBeNull()
    expect(sectionElement?.querySelector('.tbp-body')?.textContent).toBe(section.body)
  })

  it('renders a live analogy only and clears it when the profile interest changes', async () => {
    seedProfile({ interest: 'Formula 1', gradeLevel: 'University' })
    const browserSecret = 'browser-secret-must-not-leak'
    vi.stubEnv('VITE_GEMINI_API_KEY', browserSecret)
    const mockFetch = vi.fn().mockResolvedValue(
      proxySuccess(
        'A Formula 1 power unit converts stored fuel into controlled output, just as respiration captures glucose energy in ATP.',
        {
          title: 'A Formula 1 energy bridge',
          limitations:
            'A racing engine does not reproduce molecular electron transfer.',
        },
      ),
    )
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    render(<App />)
    await openFirstTopic(user)

    const section = subjects[0].topics[0].sections[0]
    const sectionElement = document.getElementById(section.id) as HTMLElement
    const originalBody = sectionElement.querySelector('.tbp-body')?.textContent

    await user.click(
      within(sectionElement).getByRole('button', { name: /Connect this to|Learn your way/i }),
    )

    expect(
      await within(sectionElement).findByText(/A Formula 1 power unit converts/),
    ).toBeTruthy()
    expect(
      within(sectionElement).getByText(
        /A racing engine does not reproduce molecular electron transfer/,
      ),
    ).toBeTruthy()
    expect(sectionElement.querySelector('.tbp-body')?.textContent).toBe(originalBody)
    expect(
      within(sectionElement)
        .getByRole('link', { name: subjects[0].topics[0].source.name })
        .getAttribute('href'),
    ).toBe(subjects[0].topics[0].source.url)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toBe('/api/personalize')
    const requestBody = String(mockFetch.mock.calls[0][1]?.body)
    expect(requestBody).toContain(
      'Use precise undergraduate-level technical vocabulary when the source supports it.',
    )
    expect(requestBody).not.toContain(browserSecret)
    expect(requestBody).not.toMatch(/api[_ -]?key/i)

    await user.click(
      screen.getByRole('button', { name: /Your lens.*Formula 1/i }),
    )
    await user.clear(screen.getByLabelText('Personal learning lens'))
    await user.type(screen.getByLabelText('Personal learning lens'), 'baking')
    await user.click(screen.getByRole('button', { name: 'Save lens' }))

    await waitFor(() => {
      const currentSection = document.getElementById(section.id) as HTMLElement
      expect(
        within(currentSection).queryByLabelText('Personalized learning companion'),
      ).toBeNull()
    })
    expect(document.querySelector('.running-header-interest')?.textContent).toContain(
      'baking',
    )
    expect(
      document.getElementById(section.id)?.querySelector('.tbp-body')?.textContent,
    ).toBe(originalBody)
  })

  it('keeps the source visible on rate limits and can retry the companion', async () => {
    seedProfile({ interest: 'baking', gradeLevel: 'Grade 11' })
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({}),
      })
      .mockResolvedValueOnce(
        proxySuccess('A recovered baking analogy.', {
          limitations: 'Baking does not reproduce molecular chemistry.',
        }),
      )
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    render(<App />)
    await openFirstTopic(user)

    const section = subjects[0].topics[0].sections[0]
    const sectionElement = document.getElementById(section.id) as HTMLElement
    const originalBody = sectionElement.querySelector('.tbp-body')?.textContent

    await user.click(
      within(sectionElement).getByRole('button', { name: /Connect this to|Learn your way/i }),
    )

    expect(
      await within(sectionElement).findByText('Learn Your Way paused'),
    ).toBeTruthy()
    expect(
      within(sectionElement).getByText(
        'Personalization is busy. Wait a moment and try again.',
      ),
    ).toBeTruthy()
    expect(sectionElement.querySelector('.tbp-body')?.textContent).toBe(originalBody)

    await user.click(
      within(sectionElement).getByRole('button', {
        name: 'Try again',
      }),
    )

    expect(
      await within(sectionElement).findByText('A recovered baking analogy.'),
    ).toBeTruthy()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(sectionElement.querySelector('.tbp-body')?.textContent).toBe(originalBody)
  })
})
