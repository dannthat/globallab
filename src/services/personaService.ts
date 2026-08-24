import type { CustomPersonaResult, Topic } from '../types'

const MOCK_DELAY_MS = 850
const GEMINI_MODEL = 'gemini-3.1-flash-lite'

export function buildPersonaPrompt(interest: string, topicTitle: string): string {
  return `You are a biology tutor explaining ${topicTitle} to a student whose favorite interest is: ${interest}.

Generate a 3-turn Socratic Explorer exchange. Return ONLY valid JSON — no markdown, no code fences, no extra text.

Each turn must follow this structure:
- question: a "Why/How" question about ${topicTitle}
- groundedAnswer: the core scientific explanation — accurate, complete, no slang, no forced theming
- analogy: ONE short analogy using ${interest} as the reference domain. Max 2 sentences. Must illuminate the mechanism, not just name-drop the interest. If you cannot find a genuine analogy, say so honestly rather than forcing a bad one.

Rules:
1. The groundedAnswer must never change from the scientific truth regardless of the interest.
2. The analogy must be genuinely illuminating, not decorative.
3. Do not flood the explanation with ${interest} references. One analogy per turn only.
4. Do not use slang, forced puns, or cringe-worthy themed language.
5. Return ONLY this JSON structure with no surrounding text:

{
  "steps": [
    { "question": "...", "groundedAnswer": "...", "analogy": "..." },
    { "question": "...", "groundedAnswer": "...", "analogy": "..." },
    { "question": "...", "groundedAnswer": "...", "analogy": "..." }
  ]
}`
}

function getMockResult(interest: string, topic: Topic): CustomPersonaResult {
  return {
    interest,
    isMock: true,
    steps: topic.explorer.map((step) => ({
      question: step.question,
      groundedAnswer: step.groundedAnswer,
      analogy: `[Mock — no API key set] Based on your interest in ${interest}: ${step.analogies.neutral}`,
    })),
  }
}

export async function generateCustomPersona(
  interest: string,
  topic: Topic,
): Promise<CustomPersonaResult> {
  const normalizedInterest = interest.trim().replace(/\s+/g, ' ')

  if (!normalizedInterest) {
    throw new Error('Tell us one interest to personalize the analogies.')
  }

  if (normalizedInterest.length > 60) {
    throw new Error('Keep your interest to 60 characters or fewer.')
  }

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()

  if (!apiKey || apiKey.startsWith('PASTE_')) {
    await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS))
    return getMockResult(normalizedInterest, topic)
  }

  const prompt = buildPersonaPrompt(normalizedInterest, topic.title)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Gemini API error:', response.status, errorBody)

    if (response.status === 429) {
      throw new Error('Too many requests — wait a moment and try again.')
    }
    if (response.status === 400) {
      throw new Error('The interest you entered could not be processed. Try a different one.')
    }
    throw new Error('Could not generate a custom analogy right now. Try again in a moment.')
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('The model returned an empty response. Try again.')
  }

  let parsed: { steps: Array<{ question: string; groundedAnswer: string; analogy: string }> }

  try {
    parsed = JSON.parse(rawText) as typeof parsed
  } catch {
    throw new Error('The generated response could not be read. Try again.')
  }

  if (
    !Array.isArray(parsed.steps) ||
    parsed.steps.length !== 3 ||
    parsed.steps.some(
      (step) =>
        typeof step.question !== 'string' ||
        typeof step.groundedAnswer !== 'string' ||
        typeof step.analogy !== 'string',
    )
  ) {
    throw new Error('The response was incomplete. Try again.')
  }

  return {
    interest: normalizedInterest,
    isMock: false,
    steps: parsed.steps,
  }
}
