import { useState, useEffect } from 'react'
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { getFile } from '../services/fileStore'

export type SourcePreviewKind =
  | 'pdf'
  | 'image'
  | 'text'
  | 'markdown'
  | 'code'
  | 'data'
  | 'media'
  | 'conversion-required'
  | 'unsupported'

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

export function usePdfDocument({ bookId, previewKind }: { bookId: string, previewKind: SourcePreviewKind }) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string | null>(null)
  const [storedSource, setStoredSource] = useState<Blob | string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [renderError, setRenderError] = useState<string | null>(null)

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

      try {
        const stored = await getFile(bookId)
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
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (loadingTask) void loadingTask.destroy()
    }
  }, [bookId, previewKind])

  return { pdfDoc, sourceUrl, rawText, storedSource, isLoading, renderError }
}
