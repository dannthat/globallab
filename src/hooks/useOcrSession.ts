import { useState, useEffect, useCallback } from 'react'
import { prewarmLocalOcr, recognizeLocalImage } from '../services/localOcr'
import type { SourceInlineData } from '../services/sourceContext'

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

export function useOcrSession({ previewKind }: { previewKind: SourcePreviewKind }) {
  const [localOcrStatus, setLocalOcrStatus] = useState<string | null>(null)

  useEffect(() => {
    if (previewKind === 'pdf' || previewKind === 'image') {
      void prewarmLocalOcr()
    }
  }, [previewKind])

  const recognizePage = useCallback(async (inlineData: SourceInlineData, signal?: AbortSignal) => {
    return recognizeLocalImage(inlineData, {
      signal,
      onProgress: ({ status, progress }) => {
        setLocalOcrStatus(
          `Local OCR: ${status} (${Math.round(progress * 100)}%). The image stays in this browser.`
        )
      },
    })
  }, [])

  return { localOcrStatus, setLocalOcrStatus, recognizePage }
}
