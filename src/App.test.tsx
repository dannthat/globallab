// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { topics } from './data/topics'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

beforeEach(() => {
  window.localStorage.clear()
})

describe('Global Lab V2', () => {
  it('shows all five topics and renders every Cram pathway', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    expect(screen.getByRole('navigation', { name: 'Biology topics' }).querySelectorAll('.topic-card')).toHaveLength(5)

    for (const topic of topics) {
      await user.click(screen.getByRole('button', { name: new RegExp(topic.title) }))
      await user.click(
        within(screen.getByRole('group', { name: 'Choose a study mode' })).getByRole('button', {
          name: /Cram/,
        }),
      )

      expect(screen.getByRole('heading', { level: 1, name: topic.title })).toBeTruthy()
      expect(container.querySelectorAll('.stage-row')).toHaveLength(topic.cram.stages.length)
      expect(screen.getByText(topic.cram.definition)).toBeTruthy()
    }
  })

  it('resets Explorer state and restores the remembered mode for each topic', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    await user.click(screen.getByRole('button', { name: /Cell Membrane & Active Transport/ }))
    await user.click(screen.getByRole('button', { name: /Gaming/ }))
    await user.click(screen.getByRole('button', { name: /Next question/ }))
    expect(container.querySelectorAll('.explorer-step')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /DNA Transcription & Translation/ }))
    expect(container.querySelectorAll('.explorer-step')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Neutral/ }).getAttribute('aria-pressed')).toBe('true')

    await user.click(
      within(screen.getByRole('group', { name: 'Choose a study mode' })).getByRole('button', {
        name: /Cram/,
      }),
    )
    await user.click(screen.getByRole('button', { name: /This mode helped me/ }))

    const dnaTopicCard = screen.getByRole('button', { name: /DNA Transcription & Translation/ })
    expect(dnaTopicCard.textContent).toContain('Cram')

    await user.click(screen.getByRole('button', { name: /Action Potential & Synaptic Transmission/ }))
    await user.click(screen.getByRole('button', { name: /DNA Transcription & Translation/ }))
    expect(
      within(screen.getByRole('group', { name: 'Choose a study mode' }))
        .getByRole('button', { name: /Cram/ })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('renders a live structured custom-persona response', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key')

    const liveSteps = [1, 2, 3].map((number) => ({
      question: `Live question ${number}`,
      groundedAnswer: `Live grounded answer ${number}`,
      analogy: `Live Formula 1 analogy ${number}.`,
    }))
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ steps: liveSteps }) }] } }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Your interest/ }))
    await user.type(screen.getByLabelText('What are you into?'), 'Formula 1')
    await user.click(screen.getByRole('button', { name: /Create my lens/ }))

    expect(await screen.findByText('Live Formula 1 analogy 1.')).toBeTruthy()
    expect(screen.queryByText(/\[Mock/)).toBeNull()
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-3.1-flash-lite')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })
})
