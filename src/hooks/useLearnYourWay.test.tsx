// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getSectionCompanionCacheKey,
  getSectionRewriteKey,
  preferredCompanionMode,
  useLearnYourWay,
} from './useLearnYourWay'
import { cellularRespiration } from '../knowledge/biology/cellular-respiration'
import type { StudentProfile } from '../types'
import type { SourceExcerpt } from '../personalization/types'

function proxySuccess(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      text: JSON.stringify({
        title: 'A source-grounded bridge',
        content,
        limitations: 'The analogy does not replace the original source.',
        quiz: null,
      }),
      model: 'gemini-test',
    }),
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('useLearnYourWay', () => {
  it('keeps a non-neutral interest as the core lens despite approved format preferences', () => {
    const approvedAt = '2026-08-26T00:00:00.000Z'
    expect(
      preferredCompanionMode(
        {
          detail: { value: 'simpler', origin: 'explicit', approvedAt },
          structure: { value: 'steps', origin: 'explicit', approvedAt },
          examples: { value: 'more-examples', origin: 'explicit', approvedAt },
        },
        'gaming',
      ),
    ).toBe('analogy')

    expect(
      preferredCompanionMode(
        { structure: { value: 'steps', origin: 'explicit', approvedAt } },
        'neutral',
      ),
    ).toBe('step-by-step')
  })

  it('returns the cached companion when the same request is made again', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(proxySuccess('A cached baking analogy.'))
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
    await waitFor(() => {
      expect(result.current.getRewrite(section.id, profile.interest)?.content).toBe(
        'A cached baking analogy.',
      )
    })
    await act(async () => {
      await result.current.learn(section, profile)
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result.current.getRewrite(section.id, profile.interest)?.analogy).toBe(
      'A cached baking analogy.',
    )
  })

  it('keeps separate cached companions for separate interests', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(proxySuccess('A baking analogy.'))
      .mockResolvedValueOnce(proxySuccess('A Formula 1 analogy.'))
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

  it('normalizes interest in the active rewrite key and varies the full cache key by inputs', () => {
    const topic = cellularRespiration
    const section = topic.sections[0]
    const profile = { interest: '  Formula   1 ', gradeLevel: 'Grade 11' }
    const baseKey = getSectionRewriteKey(topic.id, section.id, profile.interest)
    const equivalentKey = getSectionRewriteKey(topic.id, section.id, 'formula 1')

    expect(baseKey).toBe(equivalentKey)

    const analogyKey = getSectionCompanionCacheKey(
      topic.id,
      section,
      profile,
      'analogy',
      {},
    )
    const simplerKey = getSectionCompanionCacheKey(
      topic.id,
      section,
      profile,
      'simpler',
      {},
    )
    const approvedStepsKey = getSectionCompanionCacheKey(
      topic.id,
      section,
      profile,
      'analogy',
      {
        structure: {
          value: 'steps',
          origin: 'explicit',
          approvedAt: '2026-08-26T00:00:00.000Z',
        },
      },
    )
    const revisedSourceKey = getSectionCompanionCacheKey(
      topic.id,
      { ...section, body: `${section.body}\nA source revision.` },
      profile,
      'analogy',
      {},
    )

    expect(new Set([analogyKey, simplerKey, approvedStepsKey, revisedSourceKey]).size).toBe(4)
  })

  it('invalidates an upload companion cache entry when its fingerprint or page changes', () => {
    const topic = cellularRespiration
    const section = topic.sections[0]
    const profile = { interest: 'basketball', gradeLevel: 'Grade 10' }
    const excerpt: SourceExcerpt = {
      anchor: {
        sourceId: 'upload-1',
        sourceKind: 'upload',
        sourceTitle: 'Student slides',
        anchorId: 'upload-1::page:1',
        anchorLabel: 'Student slides — page 1',
        page: 1,
        sourceFingerprint: 'sha256:first',
      },
      text: 'The unchanged selected text from page one.',
    }
    const keyFor = (source: SourceExcerpt) =>
      getSectionCompanionCacheKey(
        topic.id,
        section,
        profile,
        'analogy',
        {},
        source,
      )

    const originalKey = keyFor(excerpt)
    const newFingerprintKey = keyFor({
      ...excerpt,
      anchor: { ...excerpt.anchor, sourceFingerprint: 'sha256:second' },
    })
    const newPageKey = keyFor({
      ...excerpt,
      anchor: {
        ...excerpt.anchor,
        anchorId: 'upload-1::page:2',
        anchorLabel: 'Student slides — page 2',
        page: 2,
      },
    })

    expect(new Set([originalKey, newFingerprintKey, newPageKey]).size).toBe(3)
  })
})
