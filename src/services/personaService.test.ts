import { afterEach, describe, expect, it, vi } from 'vitest'
import { cellularRespiration } from '../knowledge/biology/cellular-respiration'
import type { StudentProfile } from '../types'
import { buildSectionRewritePrompt, rewriteSection } from './personaService'

const section = cellularRespiration.sections[0]

function profile(
  interest: string,
  gradeLevel?: string,
): StudentProfile {
  return {
    interest,
    gradeLevel,
    createdAt: '2026-08-24T00:00:00.000Z',
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('V3 section analogies', () => {
  it('uses a matching hand-vetted preset without calling the API', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const pending = rewriteSection(section, profile('basketball', 'Grade 10'))
    await vi.runAllTimersAsync()
    const result = await pending

    expect(result.analogy).toBe(section.presetAnalogies?.sports)
    expect(result.isMock).toBe(false)
    expect('rewrittenBody' in result).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('requires whole keyword matches before selecting a preset', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ analogy: 'A custom analogy.' }) }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await rewriteSection(section, profile('boardgaming design'))

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result.analogy).toBe('A custom analogy.')
  })

  it('returns a clearly marked analogy preview when the key is absent', async () => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_GEMINI_API_KEY', 'PASTE_YOUR_GEMINI_API_KEY_HERE')

    const pending = rewriteSection(section, profile('baking'))
    await vi.runAllTimersAsync()
    const result = await pending

    expect(result.analogy).toContain('[Mock — no API key set]')
    expect(result.interest).toBe('baking')
    expect(result.isMock).toBe(true)
  })

  it('adds the correct grade-level language instruction to the prompt', () => {
    expect(buildSectionRewritePrompt(section, profile('baking', 'Grade 9'))).toContain(
      'Use everyday language. Avoid jargon. Sentences under 20 words.',
    )
    expect(buildSectionRewritePrompt(section, profile('baking', 'Grade 11'))).toContain(
      'Use standard secondary-school scientific complexity.',
    )
    expect(buildSectionRewritePrompt(section, profile('baking', 'University'))).toContain(
      'Use precise undergraduate-level technical vocabulary.',
    )
  })

  it('parses a live analogy-only Gemini response', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ analogy: 'A precise baking analogy.' }) }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await rewriteSection(section, profile('baking', 'University'))

    expect(result.analogy).toBe('A precise baking analogy.')
    expect(result.analogyUsed).toBe(result.analogy)
    expect(result.isMock).toBe(false)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-3.1-flash-lite')
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body) as {
      contents: Array<{ parts: Array<{ text: string }> }>
    }
    expect(requestBody.contents[0].parts[0].text).toContain('{"analogy":"..."}')
  })

  it.each([
    [429, 'Too many requests — wait a moment and try again.'],
    [400, 'This section could not be rewritten. Try again.'],
    [500, 'Could not reach the personalisation service. Try again in a moment.'],
  ])('returns a friendly message for HTTP %i', async (status, message) => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status,
      }),
    )

    await expect(rewriteSection(section, profile('baking'))).rejects.toThrow(message)
  })

  it('rejects empty, invalid, and incomplete model output', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [] }),
    })
    await expect(rewriteSection(section, profile('baking'))).rejects.toThrow(
      'Empty response from personalisation service.',
    )

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'not json' }] } }],
      }),
    })
    await expect(rewriteSection(section, profile('baking'))).rejects.toThrow(
      'Response could not be parsed. Try again.',
    )

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ analogy: '' }) }] } }],
      }),
    })
    await expect(rewriteSection(section, profile('baking'))).rejects.toThrow(
      'The rewritten response was incomplete. Try again.',
    )
  })
})
