import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import mammoth from 'mammoth'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface ExtractResult {
  text: string
  pageCount: number
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])

async function extractSelectablePdfText(file: File): Promise<ExtractResult> {
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    enableXfa: false,
    stopAtErrors: false,
  }).promise

  try {
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
      if (text) pages.push(text)
    }

    const text = pages.join('\n\n').trim()
    if (text.length < 50) {
      throw new Error(
        'This PDF appears to contain scanned pages. Open it in the GlobalLab reader to use private, on-device OCR on the focused page.',
      )
    }
    return { text, pageCount: pdf.numPages }
  } finally {
    await pdf.cleanup()
  }
}

async function extractDocxText(file: File): Promise<ExtractResult> {
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  })
  const text = result.value
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (text.length < 50) {
    throw new Error('The document appears to be empty or could not be read.')
  }

  return {
    text,
    pageCount: Math.max(1, Math.round(text.split(/\s+/).length / 300)),
  }
}

/**
 * Legacy compatibility helper.
 *
 * New reader code must use sourceContext.ts, which scopes extraction to the
 * focused page/window and runs image OCR locally. This helper deliberately
 * has no network or browser API-key path.
 */
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (extension === 'pdf') return extractSelectablePdfText(file)
  if (extension === 'docx') return extractDocxText(file)
  if (IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(
      'Open this image in the GlobalLab reader to use private, on-device OCR.',
    )
  }

  throw new Error(
    'Unsupported file type. Open the source in the GlobalLab reader for the full local extraction pipeline.',
  )
}

export function splitIntoSections(
  text: string,
  targetLength = 1_400,
): Array<{ heading: string; text: string }> {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim(),
    )
    .filter((paragraph) => paragraph.length > 20)

  const sections: Array<{ heading: string; text: string }> = []
  let current: string[] = []
  let currentLength = 0

  const pushSection = () => {
    if (current.length === 0) return
    const sectionText = current.join('\n\n')
    const firstSentence = sectionText.split(/[.!?]/)[0].trim()
    const heading =
      firstSentence.length > 80
        ? firstSentence.slice(0, 77) + '…'
        : firstSentence || 'Section ' + (sections.length + 1)
    sections.push({ heading, text: sectionText })
    current = []
    currentLength = 0
  }

  for (const paragraph of paragraphs) {
    current.push(paragraph)
    currentLength += paragraph.length
    if (currentLength >= targetLength) pushSection()
  }
  pushSection()

  return sections.length > 0
    ? sections
    : [{ heading: 'Full Document', text }]
}
