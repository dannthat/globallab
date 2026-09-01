import type {
  TextLayer,
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
    cause.name === 'AbortException' ||
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
  const renderedPageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const textTaskRef = useRef<TextLayer | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const frame = frameRef.current
    const renderedPage = renderedPageRef.current
    const canvas = canvasRef.current
    const textContainer = textLayerRef.current
    if (!frame || !renderedPage || !canvas || !textContainer) return

    let disposed = false
    let animationFrame = 0

    const render = async () => {
      const width = frame.clientWidth
      const height = frame.clientHeight
      if (disposed || width < 24 || height < 24) return

      renderTaskRef.current?.cancel()
      textTaskRef.current?.cancel()
      renderTaskRef.current = null
      textTaskRef.current = null
      textContainer.replaceChildren()
      setIsRendering(true)
      setError(null)

      try {
        const page = await document.getPage(pageNumber)
        if (disposed) return

        const naturalViewport = page.getViewport({ scale: 1 })
        setPageOrientation(naturalViewport.width > naturalViewport.height ? 'landscape' : 'portrait')
        const fitScale = Math.min(width / naturalViewport.width, height / naturalViewport.height)
        const viewport = page.getViewport({ scale: Math.max(fitScale, .01) })
        const outputScale = Math.min(window.devicePixelRatio || 1, 2)
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) throw new Error('Canvas rendering is unavailable.')

        renderedPage.style.width = `${viewport.width}px`
        renderedPage.style.height = `${viewport.height}px`
        canvas.width = Math.max(1, Math.floor(viewport.width * outputScale))
        canvas.height = Math.max(1, Math.floor(viewport.height * outputScale))
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          background: '#ffffff',
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        })
        renderTaskRef.current = renderTask
        await renderTask.promise
        if (disposed) return

        const textContent = await page.getTextContent()
        if (disposed) return
        const { TextLayer: PdfTextLayer } = await import('pdfjs-dist/legacy/build/pdf.mjs')
        if (disposed) return
        const textTask = new PdfTextLayer({ textContentSource: textContent, container: textContainer, viewport })
        textTaskRef.current = textTask
        await textTask.render()
        if (!disposed) setIsRendering(false)
        page.cleanup()
      } catch (cause) {
        if (!disposed && !isRenderCancellation(cause)) {
          setError(`Page ${pageNumber} could not be rendered.`)
          setIsRendering(false)
        }
      } finally {
        renderTaskRef.current = null
        textTaskRef.current = null
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
      textTaskRef.current?.cancel()
      renderTaskRef.current = null
      textTaskRef.current = null
    }
  }, [document, pageNumber])

  return <section
    className={`textbook-page textbook-page-${side} ubr-source-leaf${isFocused ? ' ubr-source-leaf--focused' : ''}`}
    aria-label={`Source page ${pageNumber}`}
    aria-current={isFocused ? 'page' : undefined}
    data-page-orientation={pageOrientation}
    data-source-page={pageNumber}
    onClick={onFocus}
  >
    <div className={'tbp-running-head ubr-running-head'}>
      <span>{fileName}</span>
      <span className={'ubr-running-page'}>Source page {pageNumber}</span>
    </div>

    <div ref={frameRef} className={'ubr-canvas-wrap ubr-source-frame'}>
      <div ref={renderedPageRef} className={'ubr-rendered-pdf-page'}>
        <canvas
          ref={canvasRef}
          className={'ubr-canvas ubr-source-canvas'}
          aria-label={`Rendered PDF page ${pageNumber}`}
        />
        <div
          ref={textLayerRef}
          className={'textLayer ubr-pdf-text-layer'}
          aria-label={`Selectable text from PDF page ${pageNumber}`}
        />
      </div>
      {isRendering && !error && <div className={'ubr-leaf-status'} aria-live={'polite'}>
        <Loader2 size={22} className={'ubr-spinner'} aria-hidden={true} />
        <span>Rendering page {pageNumber}...</span>
      </div>}
      {error && <p className={'ubr-leaf-error'} role={'alert'}>{error}</p>}
    </div>

    <footer className={'tbp-page-footer'}>
      <span>Original PDF - unchanged</span>
      <span className={'tbp-page-number'}>{pageNumber}</span>
    </footer>
  </section>
}
