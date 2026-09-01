import { useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { StudentProfile, UserBook } from '../types'
import type { LearningCompanionArtifact } from '../personalization/companionTypes'
import type {
  ApprovedPresentationPreferences,
  PersonalizationMode,
} from '../personalization/types'
import { createLearningCompanion } from '../services/learningCompanionService'
import {
  canUseCloudForUserSelection,
  extractUserSourceContext,
  type UserSourceContext,
} from '../services/sourceContext'
import { recognizeLocalImage } from '../services/localOcr'
import { preferredCompanionMode } from '../hooks/useLearnYourWay'
import { sourceAnchorKey } from '../personalization/learnerModel'
import type { useLearnerModel } from './useLearnerModel'

export const UPLOAD_COMPANION_CACHE_KEY = 'gl_upload_learning_companions_v2'
export const MAX_CACHED_UPLOAD_COMPANIONS = 60
export const CLOUD_TUTOR_CONSENT_KEY = 'gl_upload_cloud_tutor_consent_v1'

export interface StoredUploadCompanion {
  key: string
  artifact: LearningCompanionArtifact
}

export function normalizeInterest(interest: string) {
  return interest.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function textHash(value: string) {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return (hash >>> 0).toString(36)
}

export function preferenceSignature(preferences: ApprovedPresentationPreferences) {
  return [
    preferences.detail?.value ?? 'balanced',
    preferences.structure?.value ?? 'narrative',
    preferences.examples?.value ?? 'minimal',
    preferences.practice?.value ?? 'explanation',
  ].join(':')
}

function studentProfileSignature(profile: StudentProfile) {
  return [
    profile.gradeLevel ?? 'unspecified',
    profile.preferredLanguage ?? 'English',
    [...(profile.learningGoals ?? [])].sort().join(','),
    profile.startingSupport ?? 'balanced',
    profile.stuckSupport ?? 'different-explanation',
  ]
    .map((part) => encodeURIComponent(part))
    .join(':')
}

export function uploadCompanionKey(
  context: UserSourceContext,
  profile: StudentProfile,
  mode: PersonalizationMode,
  preferences: ApprovedPresentationPreferences,
  cloudEnabled = false,
) {
  return [
    sourceAnchorKey(context.anchor),
    encodeURIComponent(normalizeInterest(profile.interest)),
    studentProfileSignature(profile),
    mode,
    preferenceSignature(preferences),
    textHash(context.body),
    cloudEnabled ? 'cloud' : 'local',
  ].join('::')
}

export function isStoredUploadCompanion(value: unknown): value is StoredUploadCompanion {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredUploadCompanion>
  return (
    typeof candidate.key === 'string' &&
    Boolean(candidate.artifact) &&
    typeof candidate.artifact?.id === 'string' &&
    typeof candidate.artifact?.content === 'string' &&
    candidate.artifact?.excerpt?.anchor?.sourceKind === 'upload'
  )
}

export function readUploadCompanionCache() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(UPLOAD_COMPANION_CACHE_KEY) ?? '[]',
    ) as unknown
    return Array.isArray(parsed) ? parsed.filter(isStoredUploadCompanion) : []
  } catch {
    return []
  }
}

export function writeUploadCompanionCache(entries: StoredUploadCompanion[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      UPLOAD_COMPANION_CACHE_KEY,
      JSON.stringify(entries.slice(-MAX_CACHED_UPLOAD_COMPANIONS)),
    )
  } catch {
    // The active companion still works when browser storage is unavailable.
  }
}

export interface UseCompanionSessionOptions {
  book: UserBook
  profile: StudentProfile
  learnerModel: ReturnType<typeof useLearnerModel>
  previewKind: string
  focusedPage: number
  storedSource: Blob | string | undefined
  pdfDoc: PDFDocumentProxy | null
}

export interface UseCompanionSessionResult {
  activeArtifact: LearningCompanionArtifact | null
  activeSourceContext: UserSourceContext | null
  companionMode: PersonalizationMode
  isCompanionLoading: boolean
  lensError: string | null
  isLensOpen: boolean
  setIsLensOpen: (open: boolean) => void
  selectedQuizOption: string | null
  setSelectedQuizOption: (option: string | null) => void
  quizSubmitted: boolean
  setQuizSubmitted: (submitted: boolean) => void
  quizRevealed: boolean
  setQuizRevealed: (revealed: boolean) => void
  handwritingPrompt: string
  setHandwritingPrompt: (prompt: string) => void
  isHandwritingPromptOpen: boolean
  setIsHandwritingPromptOpen: (open: boolean) => void
  companionCache: StoredUploadCompanion[]
  localOcrStatus: string | null
  crossSourceCandidates: UserSourceContext[]
  cloudTutorAllowed: boolean
  setCloudTutorAllowed: (allowed: boolean) => void
  companionQuiz: {
    question: string
    options: Array<{ id: string; label: string }>
    selectedOptionId: string | null
    submitted: boolean
    revealed: boolean
    correctOptionId: string
    feedback: string | null
    outcome: { score: number; total: number; ratio: number } | null
  } | null
  runCompanion: (
    requestedMode?: PersonalizationMode,
    force?: boolean,
    selectedText?: string,
    cloudOverride?: boolean,
  ) => Promise<void>
  handleManualPromptSubmit: () => Promise<void>
}

export function useCompanionSession({
  book,
  profile,
  learnerModel,
  previewKind,
  focusedPage,
  storedSource,
  pdfDoc,
}: UseCompanionSessionOptions): UseCompanionSessionResult {
  const { approvedPresentation, recordRefinement } = learnerModel
  const [activeArtifact, setActiveArtifact] = useState<LearningCompanionArtifact | null>(null)
  const [activeSourceContext, setActiveSourceContext] = useState<UserSourceContext | null>(null)
  const [companionMode, setCompanionMode] = useState<PersonalizationMode>(() =>
    preferredCompanionMode(approvedPresentation, profile.interest),
  )
  const [isCompanionLoading, setIsCompanionLoading] = useState(false)
  const [localOcrStatus, setLocalOcrStatus] = useState<string | null>(null)
  const [crossSourceCandidates, setCrossSourceCandidates] = useState<
    UserSourceContext[]
  >([])
  const [cloudTutorAllowed, setCloudTutorAllowedState] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(CLOUD_TUTOR_CONSENT_KEY) === '1'
    } catch {
      return false
    }
  })
  const [lensError, setLensError] = useState<string | null>(null)
  const [isLensOpen, setIsLensOpen] = useState(false)
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizRevealed, setQuizRevealed] = useState(false)
  const [handwritingPrompt, setHandwritingPrompt] = useState('')
  const [isHandwritingPromptOpen, setIsHandwritingPromptOpen] = useState(false)
  const [companionCache, setCompanionCache] = useState<StoredUploadCompanion[]>(
    readUploadCompanionCache,
  )
  const companionControllerRef = useRef<AbortController | null>(null)

  const setCloudTutorAllowed = useCallback((allowed: boolean) => {
    setCloudTutorAllowedState(allowed)
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CLOUD_TUTOR_CONSENT_KEY, allowed ? '1' : '0')
    } catch {
      // Consent remains active for this session when storage is unavailable.
    }
  }, [])

  useEffect(() => {
    companionControllerRef.current?.abort()
    // oxlint-disable-next-line react/set-state-in-effect -- Changing source (book or page) invalidates every derived companion state atomically.
    setActiveArtifact(null)
    setActiveSourceContext(null)
    setIsCompanionLoading(false)
    setLocalOcrStatus(null)
    setCrossSourceCandidates([])
    setLensError(null)
    setSelectedQuizOption(null)
    setQuizSubmitted(false)
    setQuizRevealed(false)
    // Profile changes (interest / grade level) are intentionally excluded.
    // Changing a preference mid-session leaves the current artifact visible so
    // the student can finish any in-progress quiz. The next runCompanion() call
    // will produce a fresh cache key for the new profile automatically.
  }, [book.id, focusedPage])

  const runCompanion = useCallback(async (
    requestedMode?: PersonalizationMode,
    force = false,
    selectedText?: string,
    cloudOverride?: boolean,
  ) => {
    setIsLensOpen(true)
    setLensError(null)
    if (!storedSource) {
      setLensError('The original source is still opening. Try again in a moment.')
      return
    }

    const mode = requestedMode ?? preferredCompanionMode(
      approvedPresentation,
      profile.interest,
    )
    const cloudConsent = cloudOverride ?? cloudTutorAllowed
    if (requestedMode && activeArtifact) {
      recordRefinement(activeArtifact.excerpt.anchor, mode)
    }

    companionControllerRef.current?.abort()
    const controller = new AbortController()
    companionControllerRef.current = controller
    setCompanionMode(mode)
    setIsCompanionLoading(true)
    try {
      const context = await extractUserSourceContext({
        book,
        stored: storedSource,
        previewKind: previewKind as any,
        pageNumber: focusedPage,
        pdfDocument: pdfDoc,
      })
      if (controller.signal.aborted) return

      let contextForCompanion: UserSourceContext = {
        body: context.body,
        anchor: context.anchor,
        selectionOnly: false,
      }
      const selection = selectedText?.replace(/\s+/g, ' ').trim().slice(0, 4_000) ?? ''
      if (selection) {
        contextForCompanion = {
          body: selection,
          anchor: {
            ...context.anchor,
            anchorId: `${context.anchor.anchorId}::selection:${textHash(selection)}`,
            anchorLabel: `Selected text on ${context.anchor.anchorLabel}`,
          },
          analysisType: 'digital',
          selectionOnly: true,
        }
        setLocalOcrStatus(null)
      } else if (context.inlineData) {
        if (context.inlineData.mimeType !== 'image/jpeg') {
          throw new Error(
            'Audio and video Learn Your Way analysis is not enabled yet. The original media remains unchanged.',
          )
        }
        setLocalOcrStatus(
          'OCR is starting locally. The focused page image stays in this browser.',
        )
        const extractedText = await recognizeLocalImage(context.inlineData, {
          signal: controller.signal,
          onProgress: ({ status, progress }) => {
            setLocalOcrStatus(
              `Local OCR: ${status} (${Math.round(progress * 100)}%). The image stays in this browser.`,
            )
          },
        })
        if (controller.signal.aborted) return
        contextForCompanion = {
          body: extractedText,
          anchor: context.anchor,
          analysisType: 'printed-ocr',
          selectionOnly: false,
        }
        setLocalOcrStatus(
          'OCR and page-wide help ran locally. Select exact text to use cloud Koji.',
        )
      } else {
        contextForCompanion.analysisType = 'digital'
        setLocalOcrStatus(
          'Your uploaded source stays in this browser. This help is generated locally.',
        )
      }
      setActiveSourceContext(contextForCompanion)

      const adjacentPage = focusedPage % 2 === 1 ? focusedPage + 1 : focusedPage - 1
      const canLoadAdjacent =
        adjacentPage >= 1 &&
        (previewKind !== 'pdf' || adjacentPage <= (pdfDoc?.numPages ?? 0))
      if (canLoadAdjacent && !selection) {
        try {
          const adjacent = await extractUserSourceContext({
            book,
            stored: storedSource,
            previewKind: previewKind as any,
            pageNumber: adjacentPage,
            pdfDocument: pdfDoc,
          })
          if (
            !controller.signal.aborted &&
            !adjacent.inlineData &&
            adjacent.body.trim()
          ) {
            setCrossSourceCandidates([adjacent])
          }
        } catch {
          // A comparison source is optional; the focused tutor remains available.
        }
      }

      const cloudEnabledForContext = canUseCloudForUserSelection(
        contextForCompanion,
        cloudConsent,
      )
      const cacheKey = uploadCompanionKey(
        contextForCompanion,
        profile,
        mode,
        approvedPresentation,
        cloudEnabledForContext,
      )
      const cached = !force
        ? companionCache.find((entry) => entry.key === cacheKey)
        : undefined
      if (cached) {
        setActiveArtifact(cached.artifact)
        return
      }

      const artifact = await createLearningCompanion({
        excerpt: {
          anchor: contextForCompanion.anchor,
          text: contextForCompanion.body,
        },
        scope: selection ? 'selection' : 'section',
        mode,
        profile,
        approvedPresentation,
        localOnly: !cloudEnabledForContext,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return

      setActiveArtifact(artifact)
      setCompanionCache((current) => {
        const next = [
          ...current.filter((entry) => entry.key !== cacheKey),
          { key: cacheKey, artifact },
        ].slice(-MAX_CACHED_UPLOAD_COMPANIONS)
        writeUploadCompanionCache(next)
        return next
      })
    } catch (cause) {
      if (controller.signal.aborted) return
      const message =
        cause instanceof Error
          ? cause.message
          : 'Could not create personalized help for this source.'
      setLensError(message)
      if (
        message.includes('OCR') ||
        message.includes('readable text') ||
        message.includes('handwriting') ||
        message.includes('timed out') ||
        previewKind === 'image' ||
        previewKind === 'pdf'
      ) {
        setIsHandwritingPromptOpen(true)
      }
    } finally {
      if (companionControllerRef.current === controller) {
        companionControllerRef.current = null
        setIsCompanionLoading(false)
      }
    }
  }, [
    activeArtifact,
    approvedPresentation,
    book,
    companionCache,
    cloudTutorAllowed,
    focusedPage,
    pdfDoc,
    previewKind,
    profile,
    recordRefinement,
    storedSource,
  ])

  const handleManualPromptSubmit = useCallback(async () => {
    const prompt = handwritingPrompt.trim()
    if (!prompt) return
    setIsCompanionLoading(true)
    setLensError(null)
    try {
      const title = (
        book.title.trim() ||
        book.fileName.trim() ||
        'Uploaded source'
      ).slice(0, 160)
      const contextForCompanion: UserSourceContext = {
        body: prompt,
        selectionOnly: true,
        anchor: {
          sourceId: book.id,
          sourceKind: 'upload',
          sourceTitle: title,
          anchorId: `${book.id}::page:${focusedPage}::manual:${encodeURIComponent(prompt.slice(0, 30))}`,
          anchorLabel: `${title} — page ${focusedPage} (${prompt.slice(0, 24)}…)`,
          page: focusedPage,
        },
      }
      setActiveSourceContext(contextForCompanion)
      setIsHandwritingPromptOpen(false)
      const artifact = await createLearningCompanion({
        excerpt: {
          anchor: contextForCompanion.anchor,
          text: contextForCompanion.body,
        },
        mode: companionMode,
        profile,
        approvedPresentation,
        localOnly: !canUseCloudForUserSelection(
          contextForCompanion,
          cloudTutorAllowed,
        ),
        scope: 'selection',
      })
      setActiveArtifact(artifact)
    } catch (cause) {
      setLensError(
        cause instanceof Error
          ? cause.message
          : 'Could not generate explanation.',
      )
    } finally {
      setIsCompanionLoading(false)
    }
  }, [approvedPresentation, book, cloudTutorAllowed, companionMode, focusedPage, handwritingPrompt, profile])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Each generated artifact owns a fresh quiz attempt.
    setSelectedQuizOption(null)
    setQuizSubmitted(false)
    setQuizRevealed(false)
  }, [activeArtifact?.id])

  const activeQuiz = activeArtifact?.quiz
  const selectedQuizIndex = selectedQuizOption === null
    ? -1
    : Number.parseInt(selectedQuizOption, 10)
  const quizScore = activeQuiz && selectedQuizIndex === activeQuiz.correctIndex ? 1 : 0
  const companionQuiz = activeQuiz
    ? {
        question: activeQuiz.question,
        options: activeQuiz.options.map((label, index) => ({ id: String(index), label })),
        selectedOptionId: selectedQuizOption,
        submitted: quizSubmitted,
        revealed: quizRevealed,
        correctOptionId: String(activeQuiz.correctIndex),
        feedback: quizSubmitted || quizRevealed
          ? `${activeQuiz.explanation} Source evidence: “${activeQuiz.evidence}”`
          : null,
        outcome: quizSubmitted || quizRevealed
          ? { score: quizScore, total: 1, ratio: quizScore }
          : null,
      }
    : null

  return {
    activeArtifact,
    activeSourceContext,
    companionMode,
    isCompanionLoading,
    lensError,
    isLensOpen,
    setIsLensOpen,
    selectedQuizOption,
    setSelectedQuizOption,
    quizSubmitted,
    setQuizSubmitted,
    quizRevealed,
    setQuizRevealed,
    handwritingPrompt,
    setHandwritingPrompt,
    isHandwritingPromptOpen,
    setIsHandwritingPromptOpen,
    companionCache,
    localOcrStatus,
    crossSourceCandidates,
    cloudTutorAllowed,
    setCloudTutorAllowed,
    companionQuiz,
    runCompanion,
    handleManualPromptSubmit,
  }
}
