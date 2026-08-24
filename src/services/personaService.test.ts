// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cellularRespiration } from '../data/topics'
import { generateCustomPersona } from './personaService'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('personaService', () => {
  it('uses the mock fallback when the key is absent or placeholder', async () => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_GEMINI_API_KEY', 'PASTE_YOUR_NEW_KEY_HERE')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const resultPromise = generateCustomPersona('Baking', cellularRespiration)
    await vi.advanceTimersByTimeAsync(850)
    const result = await resultPromise

    expect(result.isMock).toBe(true)
    expect(result.steps).toHaveLength(3)
    expect(result.steps[0].analogy).toContain('[Mock — no API key set]')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it.each([
    [429, 'Too many requests — wait a moment and try again.'],
    [400, 'The interest you entered could not be processed. Try a different one.'],
    [500, 'Could not generate a custom analogy right now. Try again in a moment.'],
  ])('maps a %s API response to a friendly error', async (status, expectedMessage) => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status,
        text: async () => 'provider error',
      }),
    )

    await expect(generateCustomPersona('Baking', cellularRespiration)).rejects.toThrow(expectedMessage)
  })

  it.each([
    [{ candidates: [] }, 'The model returned an empty response. Try again.'],
    [
      { candidates: [{ content: { parts: [{ text: 'not json' }] } }] },
      'The generated response could not be read. Try again.',
    ],
    [
      { candidates: [{ content: { parts: [{ text: JSON.stringify({ steps: [] }) }] } }] },
      'The response was incomplete. Try again.',
    ],
  ])('rejects malformed model output with a friendly message', async (payload, expectedMessage) => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    )

    await expect(generateCustomPersona('Baking', cellularRespiration)).rejects.toThrow(expectedMessage)
  })
})
