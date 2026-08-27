import type { SourceInlineData } from './sourceContext'

export interface ParsedMathSource {
  topic: string
  theoremLatex?: string
  stepsLatex: string[]
  plainSummary: string
  sourceKind: 'vision-latex'
}

export interface ParseMathVisionOptions {
  signal?: AbortSignal
  endpoint?: string
}

export const MATH_VISION_PROMPT = `You are an expert STEM and mathematical document transcription engine.
Examine the attached image of this focused source page or scratchpad.
1. Transcribe the primary theorem, law, equation, or goal into standard LaTeX (e.g., \\overline{A \\cap B} = \\overline{A} \\cup \\overline{B} or F = ma).
2. Transcribe the step-by-step mathematical reasoning, element chasing, or logical progression in order into clean LaTeX strings.
3. Provide a clear 1-2 sentence plain-text summary of the concept.

Output ONLY valid JSON matching this exact schema:
{
  "topic": "Concise topic name (e.g., De Morgan's Law Proof)",
  "theoremLatex": "Primary theorem or formula in LaTeX",
  "stepsLatex": [
    "Step 1 in LaTeX (e.g., x \\in \\overline{A \\cap B} \\implies x \\notin A \\cap B)",
    "Step 2 in LaTeX (e.g., \\implies x \\notin A \\lor x \\notin B)",
    "Step 3 in LaTeX (e.g., \\implies x \\in \\overline{A} \\lor x \\in \\overline{B})",
    "Step 4 in LaTeX (e.g., \\implies x \\in \\overline{A} \\cup \\overline{B})"
  ],
  "plainSummary": "Plain English description of the mathematical claim"
}`

export async function parseMathVision(
  inlineData: SourceInlineData,
  options: ParseMathVisionOptions = {},
): Promise<ParsedMathSource> {
  const endpoint =
    options.endpoint ||
    (import.meta.env.VITE_PERSONALIZATION_ENDPOINT as string | undefined)?.trim() ||
    '/api/personalize'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: MATH_VISION_PROMPT,
      image: {
        mimeType: inlineData.mimeType,
        data: inlineData.data,
      },
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(errorData.error || 'Math Vision parsing could not be completed.')
  }

  const payload = (await response.json()) as { text?: unknown }
  if (typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error('Math Vision returned an empty transcription.')
  }

  try {
    const parsed = JSON.parse(payload.text) as Partial<ParsedMathSource>
    return {
      topic:
        typeof parsed.topic === 'string' && parsed.topic.trim()
          ? parsed.topic.trim()
          : 'Mathematical Proof',
      theoremLatex:
        typeof parsed.theoremLatex === 'string' && parsed.theoremLatex.trim()
          ? parsed.theoremLatex.trim()
          : undefined,
      stepsLatex: Array.isArray(parsed.stepsLatex)
        ? parsed.stepsLatex.filter(
            (step): step is string =>
              typeof step === 'string' && step.trim().length > 0,
          )
        : [],
      plainSummary:
        typeof parsed.plainSummary === 'string' && parsed.plainSummary.trim()
          ? parsed.plainSummary.trim()
          : 'Transcribed mathematical claim from focused source.',
      sourceKind: 'vision-latex',
    }
  } catch {
    throw new Error('The Math Vision service returned unparseable structured data.')
  }
}
