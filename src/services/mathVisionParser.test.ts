// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseMathVision } from './mathVisionParser'

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mathVisionParser', () => {
  it('parses structured LaTeX proofs and theorems from image data', async () => {
    const mockJson = {
      topic: "De Morgan's Laws",
      theoremLatex: '\\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}',
      stepsLatex: [
        'x \\in \\overline{A \\cap B} \\implies x \\notin A \\cap B',
        '\\implies x \\notin A \\lor x \\notin B',
        '\\implies x \\in \\overline{A} \\cup \\overline{B}',
      ],
      plainSummary: 'Proof that complement of intersection equals union of complements.',
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ text: JSON.stringify(mockJson) }),
      }),
    )

    const result = await parseMathVision({
      mimeType: 'image/jpeg',
      data: 'QUJDRA==',
    })

    expect(result.topic).toBe("De Morgan's Laws")
    expect(result.theoremLatex).toBe('\\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}')
    expect(result.stepsLatex).toHaveLength(3)
    expect(result.sourceKind).toBe('vision-latex')
  })

  it('handles server errors honestly without silent crash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Provider unavailable' }),
      }),
    )

    await expect(
      parseMathVision({
        mimeType: 'image/jpeg',
        data: 'QUJDRA==',
      }),
    ).rejects.toThrow('Provider unavailable')
  })
})
