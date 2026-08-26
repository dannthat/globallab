import { useCallback, useMemo, useRef, useState } from 'react'
import { rewriteSection, type RewriteSectionOptions } from '../services/personaService'
import type {
  KnowledgeSection,
  KnowledgeTopic,
  RewrittenSection,
  SectionRewrites,
  StudentProfile,
} from '../types'
import {
  PERSONALIZATION_MODES,
  type ApprovedPresentationPreferences,
  type PersonalizationMode,
  type SourceExcerpt,
} from '../personalization/types'

export const LEARNING_COMPANION_CACHE_KEYS = [
  'gl_learning_companions_v3',
  'gl_learning_companions_v2',
  'gl_learning_companions_v1',
  'gl_upload_learning_companions_v1',
] as const

const COMPANION_CACHE_KEY = LEARNING_COMPANION_CACHE_KEYS[0]
const MAX_CACHED_COMPANIONS = 80

interface StoredCompanion {
  fullKey: string
  baseKey: string
  rewrite: RewrittenSection
}

interface LearnOptions {
  mode?: PersonalizationMode
  approvedPresentation?: ApprovedPresentationPreferences
  excerpt?: RewriteSectionOptions['excerpt']
  source?: RewriteSectionOptions['source']
}

function normalizeInterestForCache(interest: string) {
  return interest.trim().replace(/\s+/g, ' ').toLowerCase()
}

function textHash(value: string) {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return (hash >>> 0).toString(36)
}

function preferenceSignature(preferences: ApprovedPresentationPreferences) {
  return [
    preferences.detail?.value ?? 'balanced',
    preferences.structure?.value ?? 'narrative',
    preferences.examples?.value ?? 'minimal',
    preferences.practice?.value ?? 'explanation',
  ].join(':')
}

function sourceExcerptSignature(excerpt?: SourceExcerpt) {
  if (!excerpt) return 'curated-section'
  const anchor = excerpt.anchor
  return [
    anchor.sourceKind,
    anchor.sourceId,
    anchor.sourceFingerprint ?? anchor.sourceRevision ?? 'unversioned',
    anchor.anchorId,
    anchor.page ?? '',
    anchor.lineRange
      ? anchor.lineRange.start + '-' + anchor.lineRange.end
      : '',
    textHash(excerpt.text),
  ]
    .map((part) => encodeURIComponent(String(part)))
    .join(':')
}

export function preferredCompanionMode(
  preferences: ApprovedPresentationPreferences,
  interest: string,
): PersonalizationMode {
  const normalizedInterest = normalizeInterestForCache(interest)
  if (normalizedInterest && normalizedInterest !== 'neutral') return 'analogy'
  if (preferences.structure?.value === 'steps') return 'step-by-step'
  if (preferences.detail?.value === 'simpler') return 'simpler'
  if (preferences.detail?.value === 'detailed') return 'more-detailed'
  if (preferences.examples?.value === 'more-examples') return 'another-example'
  return 'simpler'
}

export function getSectionRewriteKey(
  topicId: string,
  sectionId: string,
  interest: string,
) {
  return (
    topicId +
    '::' +
    sectionId +
    '::' +
    encodeURIComponent(normalizeInterestForCache(interest))
  )
}

export function getSectionCompanionCacheKey(
  topicId: string,
  section: Pick<KnowledgeSection, 'id' | 'heading' | 'body'>,
  profile: Pick<StudentProfile, 'interest' | 'gradeLevel'>,
  mode: PersonalizationMode,
  preferences: ApprovedPresentationPreferences,
  excerpt?: SourceExcerpt,
) {
  return [
    getSectionRewriteKey(topicId, section.id, profile.interest),
    encodeURIComponent(profile.gradeLevel ?? 'unspecified'),
    mode,
    preferenceSignature(preferences),
    textHash(section.heading + '\n' + section.body),
    sourceExcerptSignature(excerpt),
  ].join('::')
}

function isStoredCompanion(value: unknown): value is StoredCompanion {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredCompanion>
  const rewrite = candidate.rewrite
  return (
    typeof candidate.fullKey === 'string' &&
    typeof candidate.baseKey === 'string' &&
    Boolean(rewrite) &&
    typeof rewrite?.sectionId === 'string' &&
    typeof rewrite?.content === 'string' &&
    typeof rewrite?.title === 'string' &&
    typeof rewrite?.analogyLimits === 'string' &&
    typeof rewrite?.generatedAt === 'string' &&
    Number.isFinite(Date.parse(rewrite.generatedAt)) &&
    PERSONALIZATION_MODES.includes(rewrite.mode) &&
    ['preset', 'gemini', 'local'].includes(rewrite.provider) &&
    typeof rewrite.source?.sourceId === 'string' &&
    typeof rewrite.source?.anchorId === 'string'
  )
}

function readCache(): StoredCompanion[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(COMPANION_CACHE_KEY) ?? '[]',
    ) as unknown
    return Array.isArray(parsed) ? parsed.filter(isStoredCompanion) : []
  } catch {
    return []
  }
}

function writeCache(entries: StoredCompanion[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      COMPANION_CACHE_KEY,
      JSON.stringify(entries.slice(-MAX_CACHED_COMPANIONS)),
    )
  } catch {
    // The active companion still works when persistent browser storage is blocked.
  }
}

function activeFromCache(entries: StoredCompanion[]): SectionRewrites {
  return [...entries]
    .sort((left, right) =>
      left.rewrite.generatedAt.localeCompare(right.rewrite.generatedAt),
    )
    .reduce<SectionRewrites>((active, entry) => {
      const current = active[entry.baseKey]
      const normalizedInterest = normalizeInterestForCache(entry.rewrite.interest)
      const hasInterestLens =
        Boolean(normalizedInterest) && normalizedInterest !== 'neutral'

      if (
        !current ||
        !hasInterestLens ||
        entry.rewrite.mode === current.mode ||
        (entry.rewrite.mode === 'analogy' && current.mode !== 'analogy')
      ) {
        active[entry.baseKey] = entry.rewrite
      }
      return active
    }, {})
}

export function useLearnYourWay(
  topic: KnowledgeTopic,
  approvedPresentation: ApprovedPresentationPreferences = {},
) {
  const initialCache = useMemo(() => readCache(), [])
  const [rewrites, setRewrites] = useState<SectionRewrites>(() =>
    activeFromCache(initialCache),
  )
  const [cache, setCache] = useState<StoredCompanion[]>(initialCache)
  const [loadingSectionId, setLoadingSectionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorSectionId, setErrorSectionId] = useState<string | null>(null)
  const runningBySection = useRef<
    Record<string, { fullKey: string; controller: AbortController }>
  >({})
  const pendingByKey = useRef<
    Map<string, Promise<RewrittenSection | null>>
  >(new Map())
  const sequenceBySection = useRef<Record<string, number>>({})

  const rewriteKey = useCallback(
    (sectionId: string, interest: string) =>
      getSectionRewriteKey(topic.id, sectionId, interest),
    [topic.id],
  )

  const learn = useCallback(
    (
      section: KnowledgeSection,
      profile: StudentProfile,
      options: LearnOptions = {},
    ) => {
      const preferences = options.approvedPresentation ?? approvedPresentation
      const mode =
        options.mode ?? preferredCompanionMode(preferences, profile.interest)
      const baseKey = rewriteKey(section.id, profile.interest)
      const fullKey = getSectionCompanionCacheKey(
        topic.id,
        section,
        profile,
        mode,
        preferences,
        options.excerpt,
      )
      const cached = cache.find((entry) => entry.fullKey === fullKey)
      if (cached) {
        setRewrites((previous) => ({ ...previous, [baseKey]: cached.rewrite }))
        setError(null)
        setErrorSectionId(null)
        return Promise.resolve(cached.rewrite)
      }

      const existing = pendingByKey.current.get(fullKey)
      if (existing) return existing

      const running = runningBySection.current[section.id]
      if (running && running.fullKey !== fullKey) running.controller.abort()
      const controller = new AbortController()
      runningBySection.current[section.id] = { fullKey, controller }
      const sequence = (sequenceBySection.current[section.id] ?? 0) + 1
      sequenceBySection.current[section.id] = sequence

      setLoadingSectionId(section.id)
      setError(null)
      setErrorSectionId(null)

      const task = (async () => {
        try {
          const result = await rewriteSection(section, profile, {
            mode,
            approvedPresentation: preferences,
            excerpt: options.excerpt,
            source: options.source ?? {
              id: topic.id,
              title: topic.source.name,
              url: topic.source.url,
              license: topic.source.license,
            },
            signal: controller.signal,
          })
          if (sequenceBySection.current[section.id] !== sequence) return null

          setRewrites((previous) => ({ ...previous, [baseKey]: result }))
          setCache((previous) => {
            const next = [
              ...previous.filter((entry) => entry.fullKey !== fullKey),
              { fullKey, baseKey, rewrite: result },
            ].slice(-MAX_CACHED_COMPANIONS)
            writeCache(next)
            return next
          })
          return result
        } catch (cause) {
          if (controller.signal.aborted) return null
          if (sequenceBySection.current[section.id] === sequence) {
            const message =
              cause instanceof Error
                ? cause.message
                : 'Could not create personalized help. Try again.'
            setError(message)
            setErrorSectionId(section.id)
          }
          return null
        } finally {
          pendingByKey.current.delete(fullKey)
          if (runningBySection.current[section.id]?.fullKey === fullKey) {
            delete runningBySection.current[section.id]
          }
          if (sequenceBySection.current[section.id] === sequence) {
            setLoadingSectionId(null)
          }
        }
      })()

      pendingByKey.current.set(fullKey, task)
      return task
    },
    [approvedPresentation, cache, rewriteKey, topic.id, topic.source],
  )

  const clearRewrite = useCallback(
    (sectionId: string, interest: string) => {
      runningBySection.current[sectionId]?.controller.abort()
      delete runningBySection.current[sectionId]
      setRewrites((previous) => {
        const next = { ...previous }
        delete next[rewriteKey(sectionId, interest)]
        return next
      })
      setError(null)
      setErrorSectionId(null)
      setLoadingSectionId(null)
    },
    [rewriteKey],
  )

  const clearAllRewrites = useCallback(() => {
    Object.values(runningBySection.current).forEach(({ controller }) =>
      controller.abort(),
    )
    runningBySection.current = {}
    setRewrites({})
    setError(null)
    setErrorSectionId(null)
    setLoadingSectionId(null)
  }, [])

  const clearPersistentCache = useCallback(() => {
    clearAllRewrites()
    setCache([])
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(COMPANION_CACHE_KEY)
      } catch {
        // The in-memory cache is still cleared.
      }
    }
  }, [clearAllRewrites])

  return {
    rewrites,
    loadingSectionId,
    error,
    errorSectionId,
    learn,
    clearRewrite,
    clearAllRewrites,
    clearPersistentCache,
    getRewrite: (sectionId: string, interest: string) =>
      rewrites[rewriteKey(sectionId, interest)] ?? null,
  }
}
