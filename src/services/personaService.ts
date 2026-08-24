import type {
  KnowledgeSection,
  PersonaPreset,
  RewrittenSection,
  StudentProfile,
} from '../types'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const MOCK_DELAY_MS = 900

const PRESET_KEYWORDS: Record<PersonaPreset, string[]> = {
  gaming: [
    'gaming',
    'game',
    'video game',
    'gamer',
    'esports',
    'minecraft',
    'fortnite',
    'pokemon',
    'roblox',
    'league',
    'valorant',
  ],
  sports: [
    'sport',
    'basketball',
    'football',
    'soccer',
    'tennis',
    'athletics',
    'gym',
    'fitness',
    'running',
    'swimming',
    'cricket',
  ],
  music: [
    'music',
    'guitar',
    'piano',
    'singing',
    'rap',
    'hip hop',
    'k-pop',
    'kpop',
    'jazz',
    'drums',
    'producer',
    'dj',
    'violin',
  ],
  neutral: [],
}

function detectPreset(interest: string): PersonaPreset | null {
  const escapePattern = (value: string) =>
    value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

  for (const [preset, keywords] of Object.entries(PRESET_KEYWORDS) as [
    PersonaPreset,
    string[],
  ][]) {
    if (preset === 'neutral') continue
    if (
      keywords.some((keyword) =>
        new RegExp('\\b' + escapePattern(keyword) + '\\b', 'i').test(interest),
      )
    ) {
      return preset
    }
  }

  return null
}

export function buildSectionRewritePrompt(
  section: KnowledgeSection,
  profile: StudentProfile,
): string {
  const gradeInstruction =
    profile.gradeLevel === 'Grade 9' || profile.gradeLevel === 'Grade 10'
      ? 'Use everyday language. Avoid jargon. Sentences under 20 words.'
      : profile.gradeLevel === 'University'
        ? 'Use precise undergraduate-level technical vocabulary.'
        : 'Use standard secondary-school scientific complexity.'

  return [
    'You are creating one illuminating analogy for a STEM textbook section and this student:',
    '- Interest: ' + profile.interest,
    '- Grade level: ' + (profile.gradeLevel ?? 'not specified'),
    '- Language level: ' + gradeInstruction,
    '',
    'Section heading: ' + section.heading,
    '',
    'Original section text:',
    section.body,
    '',
    'Create the analogy following these STRICT rules:',
    '1. Return one short analogy only, using 2–3 sentences maximum.',
    '2. Keep every scientific fact, term, and mechanism exactly accurate.',
    '3. Draw the analogy from "' + profile.interest + '".',
    '4. Illuminate the section’s central mechanism rather than merely name-dropping the interest.',
    '5. If you cannot find a genuine illuminating analogy for "' +
      profile.interest +
      '", use a neutral analogy instead. Never force a bad one.',
    '6. Do not use slang, forced puns, or cringeworthy themed language.',
    '7. Return ONLY valid JSON with no surrounding text, no markdown, no code fences:',
    '{"analogy":"..."}',
  ].join('\n')
}

export async function rewriteSection(
  section: KnowledgeSection,
  profile: StudentProfile,
): Promise<RewrittenSection> {
  const interest = profile.interest.trim().replace(/\s+/g, ' ')

  if (!interest || interest.toLowerCase() === 'neutral') {
    return {
      sectionId: section.id,
      analogy: section.presetAnalogies?.neutral ?? 'Original explanation (neutral)',
      analogyUsed: 'Original explanation (neutral)',
      interest,
      isMock: false,
    }
  }

  if (interest.length > 60) {
    throw new Error('Keep your interest to 60 characters or fewer.')
  }

  const preset = detectPreset(interest)
  if (preset && section.presetAnalogies) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const analogyText = section.presetAnalogies[preset]
    return {
      sectionId: section.id,
      analogy: analogyText,
      analogyUsed: analogyText,
      interest,
      isMock: false,
    }
  }

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
  if (!apiKey || apiKey.startsWith('PASTE_')) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
    return {
      sectionId: section.id,
      analogy:
        '[Mock — no API key set] ' +
        (section.presetAnalogies?.neutral ??
          'This preview will become a tailored analogy when a Gemini API key is set.'),
      analogyUsed: 'Mock analogy using ' + interest,
      interest,
      isMock: true,
    }
  }

  const prompt = buildSectionRewritePrompt(section, { ...profile, interest })
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' +
      GEMINI_MODEL +
      ':generateContent?key=' +
      encodeURIComponent(apiKey),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many requests — wait a moment and try again.')
    }
    if (response.status === 400) {
      throw new Error('This section could not be rewritten. Try again.')
    }
    throw new Error('Could not reach the personalisation service. Try again in a moment.')
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('Empty response from personalisation service.')
  }

  let parsed: { analogy?: unknown }
  try {
    parsed = JSON.parse(rawText) as typeof parsed
  } catch {
    throw new Error('Response could not be parsed. Try again.')
  }

  if (
    typeof parsed.analogy !== 'string' ||
    !parsed.analogy.trim()
  ) {
    throw new Error('The rewritten response was incomplete. Try again.')
  }

  return {
    sectionId: section.id,
    analogy: parsed.analogy,
    analogyUsed: parsed.analogy,
    interest,
    isMock: false,
  }
}
