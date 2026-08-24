import type { CustomPersonaResult, Topic } from '../types'

const MOCK_DELAY_MS = 850

export function buildPersonaPrompt(interest: string) {
  return `You are a biology tutor explaining cellular respiration to a student whose favorite interest is: ${interest}.

Generate a 3-turn Socratic Explorer exchange following this STRICT structure for each turn:
- Question: [a "Why/How" question about cellular respiration]
- Grounded Answer: [the core scientific explanation — accurate, complete, no slang, no forced theming]
- Analogy: [ONE SHORT analogy using ${interest} as the reference domain. Max 2 sentences. Must illuminate the mechanism, not just name-drop the interest. If you cannot find a genuine analogy, say so honestly rather than forcing a bad one.]

Rules you must follow:
1. The Grounded Answer must never change from the scientific truth regardless of the interest.
2. The Analogy must be genuinely illuminating, not decorative.
3. Do not flood the explanation with ${interest} references. One analogy per turn, in the Analogy field only.
4. Do not use slang, forced puns, or cringy themed language.
5. Return valid JSON with exactly three steps containing question, groundedAnswer, and analogy fields.`
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

  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS))

  return {
    interest: normalizedInterest,
    isMock: true,
    steps: topic.explorer.map((step) => ({
      question: step.question,
      groundedAnswer: step.groundedAnswer,
      analogy: `[Mock — no API key set] Based on your interest in ${normalizedInterest}: ${step.analogies.neutral}`,
    })),
  }
}
