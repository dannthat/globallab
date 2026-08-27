import type { LoggerMessage, Worker } from 'tesseract.js'
import type { SourceInlineData } from './sourceContext'

export const LOCAL_OCR_LIMITS = {
  textCharacters: 12_000,
  jpegBytes: 15 * 1024 * 1024,
  initTimeoutMs: 20_000,
  recognizeTimeoutMs: 25_000,
} as const

export interface LocalOcrProgress {
  status: string
  progress: number
}

export interface RecognizeLocalImageOptions {
  signal?: AbortSignal
  onProgress?: (progress: LocalOcrProgress) => void
}

let activeProgress: RecognizeLocalImageOptions['onProgress']
let workerPromise: Promise<Worker> | null = null

function localAsset(path: string) {
  if (typeof document === 'undefined') {
    throw new Error('Local OCR is available only in the browser reader.')
  }
  const url = new URL(path, document.baseURI)
  if (typeof window !== 'undefined' && url.origin !== window.location.origin) {
    throw new Error('Local OCR assets must come from this GlobalLab server.')
  }
  return url.toString()
}

function decodeBase64(data: string) {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) {
    throw new Error('The focused image could not be prepared for local OCR.')
  }
  const binary = atob(data)
  if (binary.length === 0 || binary.length > LOCAL_OCR_LIMITS.jpegBytes) {
    throw new Error('The focused image exceeds the local OCR safety limit.')
  }
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function reportProgress(message: LoggerMessage) {
  activeProgress?.({
    status: message.status,
    progress: Math.max(0, Math.min(1, message.progress)),
  })
}

async function getWorker() {
  if (!workerPromise) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        workerPromise = null
        reject(
          new Error(
            'Local OCR initialization timed out. The English language data or worker is unavailable.',
          ),
        )
      }, LOCAL_OCR_LIMITS.initTimeoutMs)
    })

    const initWorkerPromise = import('tesseract.js')
      .then(({ createWorker, OEM }) =>
        createWorker('eng', OEM.LSTM_ONLY, {
          workerPath: localAsset('tesseract/worker.min.js'),
          corePath: localAsset('tesseract/core/tesseract-core-lstm.js'),
          langPath: localAsset('tesseract/lang'),
          gzip: true,
          workerBlobURL: false,
          logger: reportProgress,
        }),
      )
      .then((worker) => {
        if (timeoutId) clearTimeout(timeoutId)
        return worker
      })
      .catch((cause) => {
        if (timeoutId) clearTimeout(timeoutId)
        workerPromise = null
        throw cause
      })

    workerPromise = Promise.race([initWorkerPromise, timeoutPromise])
  }
  return workerPromise
}

export async function prewarmLocalOcr(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await getWorker()
  } catch {
    // Non-blocking background warmup
  }
}

function abortError() {
  return Object.assign(new Error('Local OCR was cancelled.'), { name: 'AbortError' })
}

export async function recognizeLocalImage(
  inlineData: SourceInlineData,
  options: RecognizeLocalImageOptions = {},
) {
  if (inlineData.mimeType !== 'image/jpeg') {
    throw new Error('Local OCR accepts only the focused, resized JPEG adapter output.')
  }
  if (options.signal?.aborted) throw abortError()

  const bytes = decodeBase64(inlineData.data)
  const image = new Blob([bytes], { type: 'image/jpeg' })
  activeProgress = options.onProgress
  const worker = await getWorker()
  if (options.signal?.aborted) throw abortError()

  const abort = () => {
    workerPromise = null
    void worker.terminate()
  }
  options.signal?.addEventListener('abort', abort, { once: true })

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          'Local OCR took too long to read this page. The handwriting or layout may be too complex.',
        ),
      )
    }, LOCAL_OCR_LIMITS.recognizeTimeoutMs)
  })

  try {
    const recognizePromise = worker.recognize(image).then((result) => {
      if (timeoutId) clearTimeout(timeoutId)
      return result
    })

    const result = await Promise.race([recognizePromise, timeoutPromise])
    if (options.signal?.aborted) throw abortError()
    const text = result.data.text
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, LOCAL_OCR_LIMITS.textCharacters)
    if (text.length < 8) {
      throw new Error(
        'Local OCR could not find enough readable text on this image. The original remains unchanged.',
      )
    }
    return text
  } catch (cause) {
    if (timeoutId) clearTimeout(timeoutId)
    if (options.signal?.aborted) throw abortError()
    if (
      cause instanceof Error &&
      (cause.message.includes('could not find enough') ||
        cause.message.includes('took too long') ||
        cause.message.includes('timed out'))
    ) {
      throw cause
    }
    throw new Error(
      'Local OCR could not read this focused image. Its worker or English language data may be unavailable.',
    )
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', abort)
    activeProgress = undefined
  }
}

export async function terminateLocalOcr() {
  const active = workerPromise
  workerPromise = null
  if (!active) return
  try {
    await (await active).terminate()
  } catch {
    // A failed or already terminated worker needs no further cleanup.
  }
}
