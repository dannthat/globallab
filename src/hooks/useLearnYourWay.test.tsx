// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLearnYourWay } from './useLearnYourWay'
import { cellularRespiration } from '../knowledge/biology/cellular-respiration'
import type { StudentProfile } from '../types'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('useLearnYourWay', () => {
  it('returns the cached analogy when the same section is requested again', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ analogy: 'A cached baking analogy.' }) }],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const topic = cellularRespiration
    const section = topic.sections[0]
    const profile: StudentProfile = {
      interest: 'baking',
      createdAt: '2026-08-24T00:00:00.000Z',
    }
    const { result } = renderHook(() => useLearnYourWay(topic))

    await act(async () => {
      await result.current.learn(section, profile)
    })
    await act(async () => {
      await result.current.learn(section, profile)
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result.current.getRewrite(section.id, profile.interest)?.analogy).toBe(
      'A cached baking analogy.',
    )
  })

  it('keeps separate cached analogies for separate interests', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ analogy: 'A baking analogy.' }) }],
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ analogy: 'A Formula 1 analogy.' }) }],
              },
            },
          ],
        }),
      })
    vi.stubGlobal('fetch', mockFetch)

    const topic = cellularRespiration
    const section = topic.sections[0]
    const bakingProfile: StudentProfile = {
      interest: 'baking',
      createdAt: '2026-08-24T00:00:00.000Z',
    }
    const racingProfile: StudentProfile = {
      interest: 'Formula 1',
      createdAt: '2026-08-24T00:00:00.000Z',
    }
    const { result } = renderHook(() => useLearnYourWay(topic))

    await act(async () => {
      await result.current.learn(section, bakingProfile)
    })
    await act(async () => {
      await result.current.learn(section, racingProfile)
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.current.getRewrite(section.id, bakingProfile.interest)?.analogy).toBe(
      'A baking analogy.',
    )
    expect(result.current.getRewrite(section.id, racingProfile.interest)?.analogy).toBe(
      'A Formula 1 analogy.',
    )
  })
})
