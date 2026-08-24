// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { subjects } from './knowledge'
import type { StudentProfile } from './types'

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
    screen.getByRole('button', { name: /Cellular Respiration & ATP Synthesis/ }),
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

beforeEach(() => {
  window.localStorage.clear()
})

describe('Global Lab V3', () => {
  it('onboards once and shows the four-subject library', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Make every explanation yours' }),
    ).toBeTruthy()

    await user.type(screen.getByLabelText('What are you into?'), 'basketball')
    await user.selectOptions(screen.getByLabelText(/Your level/), 'Grade 10')
    await user.click(screen.getByRole('button', { name: /Start studying/ }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'What are you learning today?' }),
    ).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: /^Biology/ }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: /^Physics/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: /^Chemistry/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: /^Mathematics/ }) as HTMLButtonElement).disabled,
    ).toBe(true)

    const stored = JSON.parse(
      window.localStorage.getItem('globallab_profile') ?? '{}',
    ) as StudentProfile
    expect(stored.interest).toBe('basketball')
    expect(stored.gradeLevel).toBe('Grade 10')

    unmount()
    render(<App />)
    expect(screen.queryByText('Make every explanation yours')).toBeNull()
    expect(screen.getByText('What are you learning today?')).toBeTruthy()
  })

  it('opens all five Kitabi topics with sections, equations, bold terms, and sources', async () => {
    seedProfile()
    const user = userEvent.setup()
    const { container } = render(<App />)
    const biology = subjects[0]

    await user.click(screen.getByRole('button', { name: /^Biology/ }))

    for (const topic of biology.topics) {
      await user.click(screen.getByRole('button', { name: new RegExp(topic.title) }))

      expect(screen.getByRole('heading', { level: 1, name: topic.title })).toBeTruthy()
      expect(container.querySelectorAll('.kitabi-section')).toHaveLength(topic.sections.length)
      expect(container.querySelectorAll('.section-body strong').length).toBeGreaterThan(0)
      expect(screen.getByText(/Scientific facts are unmodified/)).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Learn it your way' })).toBeNull()

      if (topic.sections.some((section) => section.equation)) {
        expect(container.querySelector('.equation-block .katex')).toBeTruthy()
      }

      await user.click(screen.getByRole('button', { name: 'Biology' }))
    }
  })

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
    expect(sectionElement?.querySelector('.section-body')?.textContent).toBe(section.body)

    await user.click(
      within(sectionElement as HTMLElement).getByRole('button', {
        name: 'Learn it your way',
      }),
    )

    expect(
      await within(sectionElement as HTMLElement).findByLabelText('basketball analogy'),
    ).toBeTruthy()
    expect(sectionElement?.querySelector('.section-body')?.textContent).toBe(section.body)
    expect(mockFetch).not.toHaveBeenCalled()

    await user.click(
      within(sectionElement as HTMLElement).getByRole('button', {
        name: 'Back to original',
      }),
    )
    expect(within(sectionElement as HTMLElement).queryByLabelText(/analogy/)).toBeNull()
    expect(sectionElement?.querySelector('.section-body')?.textContent).toBe(section.body)
  })

  it('renders a live analogy only and clears it when the profile interest changes', async () => {
    seedProfile({ interest: 'Formula 1', gradeLevel: 'University' })
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    analogy:
                      'A Formula 1 power unit converts stored fuel into controlled output, just as respiration captures glucose energy in ATP.',
                  }),
                },
              ],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    render(<App />)
    await openFirstTopic(user)

    const section = subjects[0].topics[0].sections[0]
    const sectionElement = document.getElementById(section.id) as HTMLElement
    const originalBody = sectionElement.querySelector('.section-body')?.textContent

    await user.click(
      within(sectionElement).getByRole('button', { name: 'Learn it your way' }),
    )

    expect(
      await within(sectionElement).findByText(/A Formula 1 power unit converts/),
    ).toBeTruthy()
    expect(sectionElement.querySelector('.section-body')?.textContent).toBe(originalBody)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-3.1-flash-lite')
    expect(mockFetch.mock.calls[0][1].body).toContain(
      'Use precise undergraduate-level technical vocabulary.',
    )

    await user.click(screen.getByRole('button', { name: /Your lens.*Formula 1/ }))
    await user.clear(screen.getByLabelText('Update your interest'))
    await user.type(screen.getByLabelText('Update your interest'), 'baking')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      const currentSection = document.getElementById(section.id) as HTMLElement
      expect(within(currentSection).queryByLabelText(/analogy/)).toBeNull()
    })
    expect(screen.getByRole('button', { name: /Your lens.*baking/ })).toBeTruthy()
    expect(
      document.getElementById(section.id)?.querySelector('.section-body')?.textContent,
    ).toBe(originalBody)
  })

  it('falls back to a neutral analogy on rate limits and can retry', async () => {
    seedProfile({ interest: 'baking', gradeLevel: 'Grade 11' })
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key')
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      analogy: 'A recovered baking analogy.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      })
    vi.stubGlobal('fetch', mockFetch)
    const user = userEvent.setup()
    render(<App />)
    await openFirstTopic(user)

    const section = subjects[0].topics[0].sections[0]
    const sectionElement = document.getElementById(section.id) as HTMLElement
    const originalBody = sectionElement.querySelector('.section-body')?.textContent

    await user.click(
      within(sectionElement).getByRole('button', { name: 'Learn it your way' }),
    )

    expect(
      await within(sectionElement).findByText('Personalization paused'),
    ).toBeTruthy()
    expect(within(sectionElement).getByLabelText('Clear analogy')).toBeTruthy()
    expect(within(sectionElement).queryByText('Rewriting…')).toBeNull()
    expect(sectionElement.querySelector('.section-body')?.textContent).toBe(originalBody)

    await user.click(
      within(sectionElement).getByRole('button', {
        name: 'Retry personalized analogy',
      }),
    )

    expect(
      await within(sectionElement).findByText('A recovered baking analogy.'),
    ).toBeTruthy()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(sectionElement.querySelector('.section-body')?.textContent).toBe(originalBody)
  })
})
