import { useState } from 'react'
import type { StudentProfile, UserBook } from '../types'
import { usePdfDocument, type SourcePreviewKind } from '../hooks/usePdfDocument'
import { useOcrSession } from '../hooks/useOcrSession'
import { useCompanionSession } from '../hooks/useCompanionSession'
import type { useLearnerModel } from '../hooks/useLearnerModel'
import { PdfSpreadView } from './PdfSpreadView'
import { CompanionPanel } from './CompanionPanel'

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
  isDark: boolean
  onToggleDark: () => void
  onBack: () => void
  onRemove: (id: string) => void
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
  const [focusedPage, setFocusedPage] = useState(1)
  const [spreadIndex, setSpreadIndex] = useState(0)

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
