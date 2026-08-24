import { useCallback, useState } from 'react'
import { rewriteSection } from '../services/personaService'
import type {
  KnowledgeSection,
  KnowledgeTopic,
  SectionRewrites,
  StudentProfile,
} from '../types'

export function useLearnYourWay(topic: KnowledgeTopic) {
  const [rewrites, setRewrites] = useState<SectionRewrites>({})
  const [loadingSectionId, setLoadingSectionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorSectionId, setErrorSectionId] = useState<string | null>(null)

  const rewriteKey = useCallback(
    (sectionId: string) => topic.id + '::' + sectionId,
    [topic.id],
  )

  const learn = useCallback(
    async (section: KnowledgeSection, profile: StudentProfile) => {
      const key = rewriteKey(section.id)
      if (rewrites[key]) return rewrites[key]

      setLoadingSectionId(section.id)
      setError(null)
      setErrorSectionId(null)

      try {
        const result = await rewriteSection(section, profile)
        setRewrites((previous) => ({ ...previous, [key]: result }))
        return result
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'Could not rewrite this section. Try again.'
        setError(message)
        setErrorSectionId(section.id)
        return null
      } finally {
        setLoadingSectionId(null)
      }
    },
    [rewriteKey, rewrites],
  )

  const clearRewrite = useCallback(
    (sectionId: string) => {
      setRewrites((previous) => {
        const next = { ...previous }
        delete next[rewriteKey(sectionId)]
        return next
      })
      setError(null)
      setErrorSectionId(null)
    },
    [rewriteKey],
  )

  const clearAllRewrites = useCallback(() => {
    setRewrites({})
    setError(null)
    setErrorSectionId(null)
  }, [])

  return {
    rewrites,
    loadingSectionId,
    error,
    errorSectionId,
    learn,
    clearRewrite,
    clearAllRewrites,
    getRewrite: (sectionId: string) => rewrites[rewriteKey(sectionId)] ?? null,
  }
}
