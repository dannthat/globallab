import type {
  KnowledgeSection,
  PersonaPreset,
  RewrittenSection,
  StudentProfile,
} from '../types'
import type {
  ApprovedPresentationPreferences,
  PersonalizationMode,
  SourceExcerpt,
} from '../personalization/types'
import {
  buildLearningCompanionPrompt,
  createLearningCompanion,
} from './learningCompanionService'

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

export interface RewriteSectionOptions {
  mode?: PersonalizationMode
  approvedPresentation?: ApprovedPresentationPreferences
  excerpt?: SourceExcerpt
  isUserSelection?: boolean
  source?: {
    id: string
    title: string
    url?: string
    license?: string
    revision?: string
  }
  signal?: AbortSignal
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

function sectionRevision(section: KnowledgeSection) {
  let hash = 2_166_136_261
  const value = `${section.heading}\n${section.body}`
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function sectionExcerpt(
  section: KnowledgeSection,
  options: RewriteSectionOptions,
): SourceExcerpt {
  if (options.excerpt) return options.excerpt
  return {
    anchor: {
      sourceId: options.source?.id ?? `global-lab:${section.id}`,
      sourceKind: 'global-lab',
      sourceTitle: options.source?.title ?? 'Global Lab curated source',
      anchorId: section.id,
      anchorLabel: section.heading,
      url: options.source?.url,
      license: options.source?.license,
      sourceRevision: options.source?.revision ?? sectionRevision(section),
    },
    text: section.body,
  }
}

function presetAnalogy(section: KnowledgeSection, interest: string) {
  if (!section.presetAnalogies) return undefined
  const exact = section.presetAnalogies[interest.toLowerCase()]
  const preset = detectPreset(interest)
  return exact ?? (preset ? section.presetAnalogies[preset] : undefined)
}

function companionRequest(
  section: KnowledgeSection,
  profile: StudentProfile,
  options: RewriteSectionOptions,
) {
  const interest = profile.interest.trim().replace(/\s+/g, ' ') || 'neutral'
  const mode = options.mode ?? 'analogy'
  const isExactSelection = Boolean(
    options.isUserSelection && options.excerpt?.text.trim(),
  )
  return {
    excerpt: sectionExcerpt(section, options),
    scope: isExactSelection ? ('selection' as const) : ('section' as const),
    mode,
    profile: { ...profile, interest },
    approvedPresentation: options.approvedPresentation ?? {},
    // The interest lens is independent from the requested presentation format.
    // Keep a vetted bridge available when a local refinement is requested too.
    // When the student selected a specific passage, skip the preset — the AI
    // must explain exactly what was highlighted, not the whole-section analogy.
    presetAnalogy: isExactSelection
      ? undefined
      : presetAnalogy(section, interest),
    signal: options.signal,
  }
}

export function buildSectionRewritePrompt(
  section: KnowledgeSection,
  profile: StudentProfile,
  options: RewriteSectionOptions = {},
): string {
  return buildLearningCompanionPrompt(companionRequest(section, profile, options))
}

export async function rewriteSection(
  section: KnowledgeSection,
  profile: StudentProfile,
  options: RewriteSectionOptions = {},
): Promise<RewrittenSection> {
  const interest = profile.interest.trim().replace(/\s+/g, ' ')
  if (interest.length > 60) {
    throw new Error('Keep your interest to 60 characters or fewer.')
  }

  const request = companionRequest(section, profile, options)
  const artifact = await createLearningCompanion(request)

  return {
    sectionId: section.id,
    mode: artifact.mode,
    title: artifact.title,
    content: artifact.content,
    analogy: artifact.content,
    analogyLimits: artifact.limitations,
    analogyUsed:
      artifact.mode === 'analogy'
        ? artifact.content
        : `${artifact.title}: ${artifact.content.slice(0, 180)}`,
    quiz: artifact.quiz ?? null,
    source: artifact.excerpt.anchor,
    excerpt: artifact.excerpt,
    scope: artifact.scope,
    interest,
    isMock: artifact.provider === 'local',
    provider: artifact.provider,
    generatedAt: artifact.createdAt,
  }
}
