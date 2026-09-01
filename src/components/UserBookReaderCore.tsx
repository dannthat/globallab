import { useEffect, useState } from 'react'
import type { StudentProfile, UserBook } from '../types'
import { usePdfDocument, type SourcePreviewKind } from '../hooks/usePdfDocument'
import { useOcrSession } from '../hooks/useOcrSession'
import { useCompanionSession } from '../hooks/useCompanionSession'
import type { useLearnerModel } from '../hooks/useLearnerModel'
import { PdfSpreadView } from './PdfSpreadView'
import { CompanionPanel } from './CompanionPanel'
import type { SourceAnchor } from '../personalization/types'

type SourceBook = UserBook & {
  previewKind?: SourcePreviewKind
  previewMessage?: string
  mimeType?: string
  extension?: string
  size?: number
}

function resolvePreviewKind(book: SourceBook): SourcePreviewKind {
  if (book.previewKind) return book.previewKind
  if (book.fileType === 'pdf') return 'pdf'
  if (book.fileType === 'image') return 'image'
  if (book.fileType === 'docx') return 'conversion-required'
  return 'unsupported'
}

export interface UserBookReaderProps {
  book: UserBook
  profile: StudentProfile
  learnerModel: ReturnType<typeof useLearnerModel>
  sourceJump?: SourceAnchor | null
  isDark: boolean
  onToggleDark: () => void
  onBack: () => void
  onRemove: (id: string) => void
}

export function UserBookReader({
  book,
  profile,
  learnerModel,
  sourceJump,
  isDark,
  onToggleDark,
  onBack,
  onRemove,
}: UserBookReaderProps) {
  const initialPage =
    sourceJump?.sourceId === book.id && sourceJump.page
      ? sourceJump.page
      : 1
  const [focusedPage, setFocusedPage] = useState(initialPage)
  const [spreadIndex, setSpreadIndex] = useState(
    Math.floor((initialPage - 1) / 2),
  )

  useEffect(() => {
    if (
      sourceJump?.sourceId !== book.id ||
      !sourceJump.page ||
      sourceJump.page < 1
    ) return
    // oxlint-disable-next-line react/set-state-in-effect -- An explicit evidence jump must synchronise the controlled reader location.
    setFocusedPage(sourceJump.page)
    setSpreadIndex(Math.floor((sourceJump.page - 1) / 2))
  }, [book.id, sourceJump])

  const previewKind = resolvePreviewKind(book as SourceBook)

  const pdfSession = usePdfDocument({ bookId: book.id, previewKind })
  useOcrSession({ previewKind })
  const companionSession = useCompanionSession({
    book,
    profile,
    learnerModel,
    previewKind,
    focusedPage,
    storedSource: pdfSession.storedSource,
    pdfDoc: pdfSession.pdfDoc,
  })

  return (
    <PdfSpreadView
      book={book}
      previewKind={previewKind}
      {...pdfSession}
      focusedPage={focusedPage}
      setFocusedPage={setFocusedPage}
      spreadIndex={spreadIndex}
      setSpreadIndex={setSpreadIndex}
      isDark={isDark}
      onToggleDark={onToggleDark}
      onBack={onBack}
      onRemove={onRemove}
      isLensOpen={companionSession.isLensOpen}
      setIsLensOpen={companionSession.setIsLensOpen}
      isCompanionLoading={companionSession.isCompanionLoading}
      runCompanion={companionSession.runCompanion}
    >
      <CompanionPanel
        {...companionSession}
        book={book}
        profile={profile}
        previewKind={previewKind}
        focusedPage={focusedPage}
        learnerModel={learnerModel}
      />
    </PdfSpreadView>
  )
}
