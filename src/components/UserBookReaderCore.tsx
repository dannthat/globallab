import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Moon,
  Sun,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { getFile } from '../services/fileStore'
import { recognizeLocalImage } from '../services/localOcr'
import { createLearningCompanion } from '../services/learningCompanionService'
import {
  extractUserSourceContext,
  type UserSourceContext,
} from '../services/sourceContext'
import { useLearnerModel } from '../hooks/useLearnerModel'
import { preferredCompanionMode } from '../hooks/useLearnYourWay'
import { sourceAnchorKey } from '../personalization/learnerModel'
import type { LearningCompanionArtifact } from '../personalization/companionTypes'
import type {
  ApprovedPresentationPreferences,
  PersonalizationMode,
} from '../personalization/types'
import type {
  StudentProfile,
  UserBook,
} from '../types'
import { LearningCompanion } from './LearningCompanion'
import { PdfSourceLeaf } from './PdfSourceLeaf'
import { PreferenceSuggestionCard } from './PreferenceSuggestionCard'

type SourcePreviewKind =
  | 'pdf'
  | 'image'
  | 'text'
  | 'markdown'
  | 'code'
  | 'data'
  | 'media'
  | 'conversion-required'
  | 'unsupported'

type SourceBook = UserBook & {
  previewKind?: SourcePreviewKind
  previewMessage?: string
  mimeType?: string
  extension?: string
  size?: number
}

export interface UserBookReaderProps {
  book: UserBook
  profile: StudentProfile
  learnerModel: ReturnType<typeof useLearnerModel>
  isDark: boolean
  onToggleDark: () => void
  onBack: () => void
  onRemove: (id: string) => void
}

type SpreadMarker = number | 'gap'

const UPLOAD_COMPANION_CACHE_KEY = 'gl_upload_learning_companions_v1'
const MAX_CACHED_UPLOAD_COMPANIONS = 60

interface StoredUploadCompanion {
  key: string
  artifact: LearningCompanionArtifact
}

function normalizeInterest(interest: string) {
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

function uploadCompanionKey(
  context: UserSourceContext,
  profile: StudentProfile,
  mode: PersonalizationMode,
  preferences: ApprovedPresentationPreferences,
) {
  return [
    sourceAnchorKey(context.anchor),
    encodeURIComponent(normalizeInterest(profile.interest)),
    encodeURIComponent(profile.gradeLevel ?? 'unspecified'),
    mode,
    preferenceSignature(preferences),
    textHash(context.body),
  ].join('::')
}

function isStoredUploadCompanion(value: unknown): value is StoredUploadCompanion {
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

function readUploadCompanionCache() {
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

function writeUploadCompanionCache(entries: StoredUploadCompanion[]) {
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

function resolvePreviewKind(book: SourceBook): SourcePreviewKind {
  if (book.previewKind) return book.previewKind
  if (book.fileType === 'pdf') return 'pdf'
  if (book.fileType === 'image') return 'image'
  if (book.fileType === 'docx') return 'conversion-required'
  return 'unsupported'
}

function describeLoadError(cause: unknown, kind: SourcePreviewKind) {
  if (cause instanceof Error) {
    if (cause.name === 'PasswordException') {
      return 'This PDF is password protected. Remove the password, then upload it again.'
    }
    if (cause.name === 'InvalidPDFException') {
      return 'This PDF is damaged or is not a valid PDF file.'
    }
    if (cause.message) return cause.message
  }
  return kind === 'pdf'
    ? 'GlobalLab could not open this PDF.'
    : 'GlobalLab could not open this source.'
}

function EmptyLeaf({ side, fileName }: { side: 'left' | 'right'; fileName: string }) {
  return (
    <section
      className={`textbook-page textbook-page-${side} ubr-source-leaf ubr-source-leaf--empty`}
      aria-label="Companion-ready facing page"
    >
      <div className="tbp-running-head ubr-running-head">
        <span>{fileName}</span>
        <span>End of source</span>
      </div>
      <div className="ubr-blank-leaf-mark">
        <div className="ubr-blank-leaf-cue">
          <WandSparkles size={18} aria-hidden="true" />
          <p>Your companion page</p>
          <strong>Learn this source your way</strong>
          <span>
            Use the control above to add source-grounded help here. The
            original remains unchanged.
          </span>
        </div>
      </div>
    </section>
  )
}

function StateLeaf({ side, fileName, children }: {
  side: 'left' | 'right'
  fileName: string
  children: ReactNode
}) {
  return (
    <section className={`textbook-page textbook-page-${side} ubr-source-leaf`}>
      <div className="tbp-running-head ubr-running-head">
        <span>{fileName}</span>
        <span>Your source</span>
      </div>
      <div className="ubr-state-center">{children}</div>
    </section>
  )
}

function buildSpreadMarkers(total: number, current: number): SpreadMarker[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index)

  const visible = new Set([0, total - 1])
  for (let index = current - 2; index <= current + 2; index += 1) {
    if (index >= 0 && index < total) visible.add(index)
  }

  const ordered = [...visible].sort((a, b) => a - b)
  const markers: SpreadMarker[] = []
  ordered.forEach((page, index) => {
    const previous = ordered[index - 1]
    if (previous !== undefined && page - previous > 1) markers.push('gap')
    markers.push(page)
  })
  return markers
}

export function UserBookReader({
  book,
  profile,
  learnerModel,
  isDark,
  onToggleDark,
  onBack,
  onRemove,
}: UserBookReaderProps) {
  const sourceBook = book as SourceBook
  const previewKind = resolvePreviewKind(sourceBook)
  const {
    approvedPresentation,
    pendingSuggestions,
    recordRefinement,
    recordHelpful,
    recordQuiz,
    acceptSuggestion,
    notNow,
    neverSuggest,
  } = learnerModel
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [focusedPage, setFocusedPage] = useState(1)
  const [expandedPage, setExpandedPage] = useState<number | null>(null)
  const [pageInput, setPageInput] = useState('1')
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward' | 'none'>('none')
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string | null>(null)
  const [storedSource, setStoredSource] = useState<Blob | string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [activeArtifact, setActiveArtifact] = useState<LearningCompanionArtifact | null>(null)
  const [activeSourceContext, setActiveSourceContext] = useState<UserSourceContext | null>(null)
  const [companionMode, setCompanionMode] = useState<PersonalizationMode>(() =>
    preferredCompanionMode(approvedPresentation, profile.interest),
  )
  const [isCompanionLoading, setIsCompanionLoading] = useState(false)
  const [localOcrStatus, setLocalOcrStatus] = useState<string | null>(null)
  const [lensError, setLensError] = useState<string | null>(null)
  const [isLensOpen, setIsLensOpen] = useState(false)
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizRevealed, setQuizRevealed] = useState(false)
  const [companionCache, setCompanionCache] = useState<StoredUploadCompanion[]>(
    readUploadCompanionCache,
  )
  const companionControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let disposed = false
    let loadingTask: PDFDocumentLoadingTask | null = null
    let objectUrl: string | null = null

    async function load() {
      setIsLoading(true)
      setRenderError(null)
      setPdfDoc(null)
      setSourceUrl(null)
      setRawText(null)
      setStoredSource(undefined)
      setSpreadIndex(0)
      setFocusedPage(1)
      setExpandedPage(null)
      setPageInput('1')
      setTurnDirection('none')
      setActiveArtifact(null)
      setActiveSourceContext(null)
      setIsCompanionLoading(false)
      setLocalOcrStatus(null)
      setLensError(null)
      setIsLensOpen(false)

      try {
        const stored = await getFile(book.id)
        if (!stored) throw new Error('File not found. Please re-upload this source.')
        if (!disposed) setStoredSource(stored)

        if (stored instanceof Blob) {
          objectUrl = URL.createObjectURL(stored)
          if (!disposed) setSourceUrl(objectUrl)
        }

        if (previewKind === 'pdf') {
          if (!(stored instanceof Blob)) {
            throw new Error('The original PDF is missing. Please re-upload it.')
          }
          if (!objectUrl || disposed) return

          // The matching legacy main/worker pair supplies Uint8Array#toHex on
          // older browsers. This reader mounts no annotation/scripting manager,
          // so embedded PDF JavaScript is never executed. Loading from the Blob
          // URL also avoids making a second whole-file ArrayBuffer copy here.
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString()
          const pdfAssetBase = new URL('pdfjs/', window.document.baseURI).toString()
          loadingTask = pdfjs.getDocument({
            url: objectUrl,
            cMapUrl: `${pdfAssetBase}cmaps/`,
            cMapPacked: true,
            iccUrl: `${pdfAssetBase}iccs/`,
            standardFontDataUrl: `${pdfAssetBase}standard_fonts/`,
            wasmUrl: `${pdfAssetBase}wasm/`,
            enableXfa: false,
            stopAtErrors: false,
          })
          const document = await loadingTask.promise
          if (disposed) {
            await loadingTask.destroy()
            return
          }
          setPdfDoc(document)
        } else if (['text', 'markdown', 'code', 'data'].includes(previewKind)) {
          const text = stored instanceof Blob ? await stored.text() : stored
          if (!disposed) setRawText(text)
        }
      } catch (cause) {
        if (!disposed) setRenderError(describeLoadError(cause, previewKind))
      } finally {
        if (!disposed) setIsLoading(false)
      }
    }

    void load()
    return () => {
      disposed = true
      companionControllerRef.current?.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (loadingTask) void loadingTask.destroy()
    }
  }, [book.id, previewKind])

  useEffect(() => {
    companionControllerRef.current?.abort()
    // oxlint-disable-next-line react/set-state-in-effect -- Changing source context invalidates every derived companion state atomically.
    setActiveArtifact(null)
    setActiveSourceContext(null)
    setIsCompanionLoading(false)
    setLocalOcrStatus(null)
    setLensError(null)
    setSelectedQuizOption(null)
    setQuizSubmitted(false)
    setQuizRevealed(false)
  }, [book.id, focusedPage, profile.gradeLevel, profile.interest])

  const totalPages = previewKind === 'pdf'
    ? pdfDoc?.numPages ?? Math.max(1, book.pageCount)
    : 1
  const spreadCount = Math.max(1, Math.ceil(totalPages / 2))
  const leftPage = spreadIndex * 2 + 1
  const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : null

  const openSpread = useCallback((requested: number) => {
    const next = Math.max(0, Math.min(requested, spreadCount - 1))
    setTurnDirection(next > spreadIndex ? 'forward' : next < spreadIndex ? 'backward' : 'none')
    setSpreadIndex(next)
    setFocusedPage(next * 2 + 1)
    setPageInput(String(next * 2 + 1))
    setExpandedPage(null)
    setIsLensOpen(false)
    setLensError(null)
  }, [spreadCount, spreadIndex])

  const openPage = useCallback((requested: number) => {
    const next = Math.max(1, Math.min(requested, totalPages))
    setTurnDirection(next > focusedPage ? 'forward' : next < focusedPage ? 'backward' : 'none')
    setSpreadIndex(Math.floor((next - 1) / 2))
    setFocusedPage(next)
    setPageInput(String(next))
    setExpandedPage(next)
    setIsLensOpen(false)
    setLensError(null)
  }, [focusedPage, totalPages])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input,textarea,select,button,a') || target?.isContentEditable) return

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        if (expandedPage !== null) openPage(expandedPage + 1)
        else openSpread(spreadIndex + 1)
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        if (expandedPage !== null) openPage(expandedPage - 1)
        else openSpread(spreadIndex - 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [expandedPage, openPage, openSpread, spreadIndex])

  const runCompanion = useCallback(async (
    requestedMode?: PersonalizationMode,
    force = false,
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
        previewKind,
        pageNumber: focusedPage,
        pdfDocument: pdfDoc,
      })
      if (controller.signal.aborted) return

      let contextForCompanion: UserSourceContext = {
        body: context.body,
        anchor: context.anchor,
      }
      if (context.inlineData) {
        if (context.inlineData.mimeType !== 'image/jpeg') {
          throw new Error(
            'Audio and video Learn Your Way analysis is not enabled yet. The original media remains unchanged.',
          )
        }
        setLocalOcrStatus(
          'OCR is starting locally. The image stays in this browser.',
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
        }
        setLocalOcrStatus(
          'OCR and Learn Your Way ran locally. No image or extracted text left this browser.',
        )
      } else {
        setLocalOcrStatus(
          'Your uploaded source stays in this browser. This help is generated locally.',
        )
      }
      setActiveSourceContext(contextForCompanion)

      const cacheKey = uploadCompanionKey(
        contextForCompanion,
        profile,
        mode,
        approvedPresentation,
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
        mode,
        profile,
        approvedPresentation,
        localOnly: true,
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
      setLensError(cause instanceof Error
        ? cause.message
        : 'Could not create personalized help for this source.')
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
    focusedPage,
    pdfDoc,
    previewKind,
    profile,
    recordRefinement,
    storedSource,
  ])

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

  const spreadMarkers = useMemo(
    () => buildSpreadMarkers(spreadCount, spreadIndex),
    [spreadCount, spreadIndex],
  )

  const commitPageJump = useCallback(() => {
    const requested = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(requested)) {
      setPageInput(String(expandedPage ?? focusedPage))
      return
    }
    openPage(requested)
  }, [expandedPage, focusedPage, openPage, pageInput])

  const originalAction = sourceUrl ? (
    <a className="your-library-upload-btn ubr-source-action" href={sourceUrl} download={book.fileName}>
      Download original
    </a>
  ) : null

  let spreadContent: ReactNode
  if (isLoading) {
    spreadContent = (
      <>
        <StateLeaf side="left" fileName={book.fileName}>
          <Loader2 size={32} className="ubr-spinner" aria-hidden="true" />
          <p className="ubr-state-text">Opening the original source…</p>
        </StateLeaf>
        <div className="textbook-spine" aria-hidden="true" />
        <EmptyLeaf side="right" fileName={book.fileName} />
      </>
    )
  } else if (renderError) {
    spreadContent = (
      <>
        <StateLeaf side="left" fileName={book.fileName}>
          <AlertCircle size={28} aria-hidden="true" />
          <p className="ubr-state-text" role="alert">{renderError}</p>
          <button type="button" className="your-library-upload-btn" onClick={onBack}>Back to library</button>
        </StateLeaf>
        <div className="textbook-spine" aria-hidden="true" />
        <EmptyLeaf side="right" fileName={book.fileName} />
      </>
    )
  } else if (previewKind === 'pdf' && pdfDoc) {
    spreadContent = expandedPage !== null ? (
      <PdfSourceLeaf
        document={pdfDoc}
        pageNumber={expandedPage}
        side="left"
        fileName={book.fileName}
        isFocused
        isExpanded
        onFocus={() => focusPage(expandedPage, setFocusedPage, setPageInput, setIsLensOpen, setLensError)}
        onToggleExpand={() => {
          setExpandedPage(null)
          setTurnDirection('none')
        }}
      />
    ) : (
      <>
        <PdfSourceLeaf
          document={pdfDoc}
          pageNumber={leftPage}
          side="left"
          fileName={book.fileName}
          isFocused={focusedPage === leftPage}
          isExpanded={false}
          onFocus={() => focusPage(leftPage, setFocusedPage, setPageInput, setIsLensOpen, setLensError)}
          onToggleExpand={() => openPage(leftPage)}
        />
        <div className="textbook-spine" aria-hidden="true" />
        {rightPage ? (
          <PdfSourceLeaf
            document={pdfDoc}
            pageNumber={rightPage}
            side="right"
            fileName={book.fileName}
            isFocused={focusedPage === rightPage}
            isExpanded={false}
            onFocus={() => focusPage(rightPage, setFocusedPage, setPageInput, setIsLensOpen, setLensError)}
            onToggleExpand={() => openPage(rightPage)}
          />
        ) : <EmptyLeaf side="right" fileName={book.fileName} />}
      </>
    )
  } else if (previewKind === 'image' && sourceUrl) {
    spreadContent = (
      <>
        <section className="textbook-page textbook-page-left ubr-source-leaf ubr-source-leaf--focused">
          <div className="tbp-running-head ubr-running-head">
            <span>{book.fileName}</span><span>Original image</span>
          </div>
          <div className="ubr-canvas-wrap ubr-source-frame">
            <img src={sourceUrl} alt={book.title} className="ubr-image ubr-source-image" />
          </div>
          <footer className="tbp-page-footer">
            <span>Original image · unchanged</span><span className="tbp-page-number">1</span>
          </footer>
        </section>
        <div className="textbook-spine" aria-hidden="true" />
        <EmptyLeaf side="right" fileName={book.fileName} />
      </>
    )
  } else if (['text', 'markdown', 'code', 'data'].includes(previewKind) && rawText !== null) {
    spreadContent = (
      <>
        <section className="textbook-page textbook-page-left ubr-source-leaf ubr-source-leaf--focused">
          <div className="tbp-running-head ubr-running-head">
            <span>{book.fileName}</span><span>Exact source</span>
          </div>
          <pre className="ubr-raw-source"><code>{rawText}</code></pre>
          <footer className="tbp-page-footer">
            <span>{previewKind} · never executed</span><span className="tbp-page-number">1</span>
          </footer>
        </section>
        <div className="textbook-spine" aria-hidden="true" />
        <StateLeaf side="right" fileName={book.fileName}>
          <p className="ubr-source-kicker">Source preserved</p>
          <h2 className="ubr-source-message-title">Shown exactly as text</h2>
          <p className="ubr-state-text">GlobalLab never executes uploaded source code, HTML, SVG, or Markdown.</p>
          {originalAction}
        </StateLeaf>
      </>
    )
  } else {
    const message = sourceBook.previewMessage ?? unavailableMessage(previewKind)
    spreadContent = (
      <>
        <StateLeaf side="left" fileName={book.fileName}>
          <p className="ubr-source-kicker">Original safely stored</p>
          <h2 className="ubr-source-message-title">Preview not available</h2>
          <p className="ubr-state-text">{message}</p>
          {originalAction}
        </StateLeaf>
        <div className="textbook-spine" aria-hidden="true" />
        <EmptyLeaf side="right" fileName={book.fileName} />
      </>
    )
  }

  return (
    <div className="kitabi-shell ubr-shell" style={{ '--subject-color': book.color } as CSSProperties}>
      <header className="running-header ubr-header">
        <div className="reader-utility-group">
          <button type="button" className="running-header-back subject-selector" onClick={onBack} aria-label="Back to your library">
            <ArrowLeft size={15} aria-hidden="true" /><span>Library</span>
          </button>
        </div>
        <div className="running-header-title" aria-current="page">
          <span>Your source · {previewKind}</span><strong>{book.title}</strong>
        </div>
        <div className="running-header-actions">
          <button
            type="button"
            className="running-header-interest ubr-learn-trigger"
            disabled={isLoading || Boolean(renderError) || isCompanionLoading}
            onClick={() => void runCompanion()}
            aria-expanded={isLensOpen}
            aria-controls="ubr-lens-drawer"
          >
            {isCompanionLoading
              ? <Loader2 size={14} className="ubr-spinner" aria-hidden="true" />
              : <WandSparkles size={14} aria-hidden="true" />}
            <span>
              Learn {previewKind === 'pdf' ? 'page ' + focusedPage : 'this source'} your way
            </span>
          </button>
          <button type="button" className="dark-toggle" onClick={onToggleDark} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="dark-toggle rh-icon-btn--danger"
            title="Remove source"
            aria-label={`Remove ${book.title}`}
            onClick={() => {
              if (window.confirm(`Remove "${book.title}"?`)) {
                onRemove(book.id)
                onBack()
              }
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="textbook-reader-wrap ubr-reader-wrap">
        <div className="textbook-reader-stage ubr-reader-stage">
          <main className="textbook-reader-page ubr-reader-page" id="main-content" aria-busy={isLoading}>
            <article
              key={`${book.id}-${expandedPage ?? `spread-${spreadIndex}`}`}
              className={[
                'tbp-article textbook-spread ubr-source-spread',
                expandedPage !== null ? 'ubr-source-spread--single' : '',
                turnDirection !== 'none' ? `ubr-turn-${turnDirection}` : '',
              ].filter(Boolean).join(' ')}
            >
              {spreadContent}
            </article>

            {isLensOpen && (
              <aside
                id='ubr-lens-drawer'
                className={
                  'ubr-lens-drawer ' +
                  (focusedPage % 2 === 0
                    ? 'ubr-lens-drawer--left'
                    : 'ubr-lens-drawer--right')
                }
                aria-label={`Learn page ${focusedPage} your way`}
              >
                <div className="ubr-lens-heading">
                  <span>{previewKind === 'pdf' ? 'Page ' + focusedPage : 'Focused source'}</span>
                  <strong>Lens: {profile.interest}</strong>
                </div>
                {localOcrStatus && (
                  <div className='ubr-lens-loading' role='status' aria-live='polite'>
                    <span>{localOcrStatus}</span>
                  </div>
                )}
                {!activeSourceContext && isCompanionLoading && (
                  <div className="ubr-lens-loading" aria-live="polite">
                    <Loader2 size={20} className="ubr-spinner" aria-hidden="true" />
                    <span>Reading only the focused source context…</span>
                  </div>
                )}
                {!activeSourceContext && lensError && (
                  <div className="ubr-lens-error" role="alert">
                    <AlertCircle size={16} aria-hidden="true" /><p>{lensError}</p>
                    <button type="button" onClick={() => setIsLensOpen(false)}>Dismiss</button>
                  </div>
                )}
                {activeSourceContext && (
                  <>
                    <LearningCompanion
                      sourceAnchor={activeSourceContext.anchor}
                      interest={profile.interest}
                      mode={activeArtifact?.mode ?? companionMode}
                      title={activeArtifact?.title ?? 'Personalized support from this source'}
                      content={activeArtifact?.content ?? null}
                      limits={activeArtifact?.limitations ?? ''}
                      isLoading={isCompanionLoading}
                      error={lensError}
                      quiz={companionQuiz}
                      onAction={(mode) => void runCompanion(mode)}
                      onOutcome={(outcome) => {
                        recordHelpful(
                          activeSourceContext.anchor,
                          activeArtifact?.mode ?? companionMode,
                          outcome === 'successful',
                        )
                      }}
                      onSelectQuizOption={setSelectedQuizOption}
                      onSubmitQuiz={(optionId) => {
                        const selected = Number.parseInt(optionId, 10)
                        const score = activeQuiz && selected === activeQuiz.correctIndex ? 1 : 0
                        setSelectedQuizOption(optionId)
                        setQuizSubmitted(true)
                        setQuizRevealed(false)
                        recordQuiz(
                          activeSourceContext.anchor,
                          score,
                          1,
                          activeArtifact?.mode ?? companionMode,
                        )
                      }}
                      onRevealQuiz={() => {
                        if (!quizSubmitted && !quizRevealed) {
                          recordQuiz(
                            activeSourceContext.anchor,
                            0,
                            1,
                            activeArtifact?.mode ?? companionMode,
                          )
                        }
                        setQuizRevealed(true)
                      }}
                      onRetry={() => void runCompanion(companionMode, true)}
                      onDismiss={() => setIsLensOpen(false)}
                    />
                    {pendingSuggestions[0] && (
                      <PreferenceSuggestionCard
                        suggestion={pendingSuggestions[0]}
                        onApply={(suggestion) => acceptSuggestion(suggestion.id)}
                        onNotNow={(suggestion) => notNow(suggestion.id)}
                        onNeverSuggest={(suggestion) => neverSuggest(suggestion.id)}
                      />
                    )}
                  </>
                )}
              </aside>
            )}
          </main>

          <nav className="textbook-bottom-nav" aria-label="Navigate source pages">
            <button
              type="button"
              className="textbook-nav-arrow"
              disabled={isLoading || (expandedPage !== null ? expandedPage <= 1 : spreadIndex === 0)}
              onClick={() => expandedPage !== null
                ? openPage(expandedPage - 1)
                : openSpread(spreadIndex - 1)}
              aria-label={expandedPage !== null ? 'Previous source page' : 'Previous source spread'}
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <div className="textbook-nav-progress">
              <BookOpen size={14} aria-hidden="true" />
              <span className="textbook-nav-label">Source</span>
              {expandedPage === null && (
                <div className="textbook-nav-dots">
                {spreadMarkers.map((marker, index) => marker === 'gap' ? (
                  <span key={`gap-${index}`} className="ubr-nav-gap" aria-hidden="true">…</span>
                ) : (
                  <button
                    key={marker}
                    type="button"
                    className={'textbook-nav-dot' + (marker === spreadIndex ? ' textbook-nav-dot-active' : '')}
                    disabled={isLoading}
                    onClick={() => openSpread(marker)}
                    aria-label={`Open spread ${marker + 1}`}
                    aria-current={marker === spreadIndex ? 'page' : undefined}
                  />
                ))}
                </div>
              )}
              <form
                className="ubr-page-jump"
                onSubmit={(event) => {
                  event.preventDefault()
                  commitPageJump()
                }}
              >
                <span>Page</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  disabled={isLoading || previewKind !== 'pdf'}
                  onChange={(event) => setPageInput(event.target.value)}
                  onBlur={commitPageJump}
                  onFocus={(event) => event.target.select()}
                  aria-label="Go to source page"
                />
                <span>/ {totalPages}</span>
              </form>
              <span className="textbook-nav-count">
                {expandedPage !== null
                  ? `Focused page ${expandedPage}`
                  : `Spread ${spreadIndex + 1} of ${spreadCount}`}
              </span>
            </div>
            <button
              type="button"
              className="textbook-nav-arrow"
              disabled={isLoading || (expandedPage !== null
                ? expandedPage >= totalPages
                : spreadIndex === spreadCount - 1)}
              onClick={() => expandedPage !== null
                ? openPage(expandedPage + 1)
                : openSpread(spreadIndex + 1)}
              aria-label={expandedPage !== null ? 'Next source page' : 'Next source spread'}
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

function focusPage(
  page: number,
  setPage: (page: number) => void,
  setPageInput: (value: string) => void,
  setLensOpen: (open: boolean) => void,
  setError: (error: string | null) => void,
) {
  setPage(page)
  setPageInput(String(page))
  setLensOpen(false)
  setError(null)
}

function unavailableMessage(kind: SourcePreviewKind) {
  if (kind === 'conversion-required') {
    return 'This file needs a faithful page conversion before GlobalLab can place it in the textbook.'
  }
  if (kind === 'media') {
    return 'This media source is stored unchanged. An inline media reader is not enabled.'
  }
  return 'This source is stored unchanged, but GlobalLab cannot preview it yet.'
}
