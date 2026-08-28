import type {
  PDFDocumentProxy,
  RenderTask,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PdfSourceLeafProps {
  document: PDFDocumentProxy
  pageNumber: number
  side: 'left' | 'right'
  fileName: string
  isFocused: boolean
  onFocus: () => void
}

function isRenderCancellation(cause: unknown) {
  return cause instanceof Error && (
    cause.name === 'RenderingCancelledException' ||
    cause.message.toLowerCase().includes('rendering cancelled')
  )
}

export function PdfSourceLeaf({
  document,
  pageNumber,
  side,
  fileName,
  isFocused,
  onFocus,
}: PdfSourceLeafProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current
    if (!frame || !canvas) return

    let disposed = false
    let animationFrame = 0

    const render = async () => {
      const width = frame.clientWidth
      const height = frame.clientHeight
      if (disposed || width < 24 || height < 24) return

      renderTaskRef.current?.cancel()
      renderTaskRef.current = null
      setIsRendering(true)
      setError(null)

      try {
        const page = await document.getPage(pageNumber)
        if (disposed) return

        const naturalViewport = page.getViewport({ scale: 1 })
        setPageOrientation(
          naturalViewport.width > naturalViewport.height ? 'landscape' : 'portrait',
        )
        // The uploaded page is always contained inside its physical leaf.
        // Fitting width alone made layout changes behave like an accidental
        // zoom and could push the bottom of the source outside the viewport.
        const fitScale = Math.min(
          width / naturalViewport.width,
          height / naturalViewport.height,
        )
        const viewport = page.getViewport({ scale: Math.max(fitScale, 0.01) })
        const outputScale = Math.min(window.devicePixelRatio || 1, 2)
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) throw new Error('Canvas rendering is unavailable.')

        canvas.width = Math.max(1, Math.floor(viewport.width * outputScale))
        canvas.height = Math.max(1, Math.floor(viewport.height * outputScale))
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        const task = page.render({
          canvas,
          canvasContext: context,
          viewport,
          background: '#ffffff',
          transform: outputScale === 1
            ? undefined
            : [outputScale, 0, 0, outputScale, 0, 0],
        })
        renderTaskRef.current = task
        await task.promise
        if (!disposed) setIsRendering(false)
        page.cleanup()
      } catch (cause) {
        if (!disposed && !isRenderCancellation(cause)) {
          setError(`Page ${pageNumber} could not be rendered.`)
          setIsRendering(false)
        }
      } finally {
        renderTaskRef.current = null
      }
    }

    const scheduleRender = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => void render())
    }

    const observer = new ResizeObserver(scheduleRender)
    observer.observe(frame)
    scheduleRender()

    return () => {
      disposed = true
      observer.disconnect()
      window.cancelAnimationFrame(animationFrame)
      renderTaskRef.current?.cancel()
      renderTaskRef.current = null
    }
  }, [document, pageNumber])

  return (
    <section
      className={
        `textbook-page textbook-page-${side} ubr-source-leaf` +
        (isFocused ? ' ubr-source-leaf--focused' : '')
      }
      aria-label={`Source page ${pageNumber}`}
      onClick={onFocus}
      aria-current={isFocused ? 'page' : undefined}
      data-page-orientation={pageOrientation}
    >
      <div className="tbp-running-head ubr-running-head">
        <span>{fileName}</span>
        <span className="ubr-running-page">Source page {pageNumber}</span>
      </div>

      <div ref={frameRef} className="ubr-canvas-wrap ubr-source-frame">
        <canvas
          ref={canvasRef}
          className="ubr-canvas ubr-source-canvas"
          aria-label={`Rendered PDF page ${pageNumber}`}
        />
        {isRendering && !error && (
          <div className="ubr-leaf-status" aria-live="polite">
            <Loader2 size={22} className="ubr-spinner" aria-hidden="true" />
            <span>Rendering page {pageNumber}…</span>
          </div>
        )}
        {error && <p className="ubr-leaf-error" role="alert">{error}</p>}
      </div>

      <footer className="tbp-page-footer">
        <span>Original PDF · unchanged</span>
        <span className="tbp-page-number">{pageNumber}</span>
      </footer>
    </section>
  )
}
