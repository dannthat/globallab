import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { deleteFile, storeFile } from '../services/fileStore'
import type { UserBook, UserBookFileType, UserBookPreviewKind } from '../types'

const STORAGE_KEY = 'gl_user_library'
let persistenceRequested = false

const PDF_EXTS = new Set(['pdf'])
const NATIVE_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'ico'])
const CONVERTED_IMAGE_EXTS = new Set(['heic', 'heif', 'tif', 'tiff'])
const CONVERTED_IMAGE_MIMES = new Set(['image/heic', 'image/heif', 'image/tiff'])
const MARKDOWN_EXTS = new Set(['md', 'markdown', 'mdx'])
const TEXT_EXTS = new Set(['txt', 'text', 'log', 'rst', 'adoc', 'tex'])
const CODE_EXTS = new Set([
  'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'py', 'java', 'c', 'cc', 'cpp', 'h', 'hpp',
  'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'kts', 'dart', 'lua', 'r', 'scala',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd', 'sql', 'html', 'htm', 'css',
  'scss', 'sass', 'less', 'vue', 'svelte', 'astro', 'svg',
])
const DATA_EXTS = new Set([
  'json', 'jsonl', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf',
  'properties', 'graphql', 'gql', 'ipynb',
])
const DOCUMENT_EXTS = new Set([
  'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'ott', 'rtf', 'pages',
])
const PRESENTATION_EXTS = new Set([
  'ppt', 'pptx', 'pptm', 'pot', 'potx', 'pps', 'ppsx', 'odp', 'otp', 'key',
])
const SPREADSHEET_EXTS = new Set([
  'xls', 'xlsx', 'xlsm', 'xlsb', 'xlt', 'xltx', 'ods', 'ots', 'numbers',
])
const EBOOK_EXTS = new Set(['epub', 'mobi', 'azw', 'azw3', 'fb2'])
const MEDIA_EXTS = new Set([
  'mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'mp4', 'webm', 'mov', 'mkv', 'avi',
])
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'])

interface SourceClassification {
  fileType: Exclude<UserBookFileType, 'docx'>
  previewKind: UserBookPreviewKind
  previewMessage: string
  pageCount: number
  pageCountKnown: boolean
}

const COVER_COLORS = [
  '#7C3AED', '#0E7490', '#B45309', '#BE123C',
  '#065F46', '#1D4ED8', '#92400E', '#6D28D9',
  '#0F766E', '#B91C1C', '#1E40AF', '#047857',
]

function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const toHex = (n: number) => Math.round(n * factor).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const toHex = (n: number) => Math.min(255, Math.round(n + (255 - n) * amount)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 && dot < fileName.length - 1
    ? fileName.slice(dot + 1).toLowerCase()
    : ''
}

function conversionRequired(fileType: SourceClassification['fileType'], label: string): SourceClassification {
  return {
    fileType,
    previewKind: 'conversion-required',
    previewMessage: `Original ${label} stored. A conversion service is required before a layout-faithful preview is available.`,
    pageCount: 0,
    pageCountKnown: false,
  }
}

export function classifyUserSource(file: Pick<File, 'name' | 'type'>): SourceClassification {
  const extension = getFileExtension(file.name)
  const mimeType = file.type.toLowerCase()
  const baseName = file.name.toLowerCase()

  if (PDF_EXTS.has(extension) || mimeType === 'application/pdf') {
    return {
      fileType: 'pdf',
      previewKind: 'pdf',
      previewMessage: 'Original PDF stored. Pages are counted when the source is first opened.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  if (CONVERTED_IMAGE_EXTS.has(extension) || CONVERTED_IMAGE_MIMES.has(mimeType)) {
    return conversionRequired('image', 'image')
  }

  if (NATIVE_IMAGE_EXTS.has(extension) || (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml')) {
    return {
      fileType: 'image',
      previewKind: 'image',
      previewMessage: 'Original image stored and shown without changing its layout.',
      pageCount: 1,
      pageCountKnown: true,
    }
  }

  if (MARKDOWN_EXTS.has(extension) || mimeType === 'text/markdown') {
    return {
      fileType: 'markdown',
      previewKind: 'markdown',
      previewMessage: 'Original Markdown stored. Source view is exact; any rendered view must be sanitized.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  if (CODE_EXTS.has(extension) || mimeType === 'application/javascript' || mimeType === 'text/javascript') {
    return {
      fileType: 'code',
      previewKind: 'code',
      previewMessage: 'Original source stored and displayed as inert text. Uploaded code is never executed.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  if (DATA_EXTS.has(extension) || mimeType === 'application/json' || mimeType.endsWith('+json')) {
    return {
      fileType: 'data',
      previewKind: 'data',
      previewMessage: 'Original data file stored and displayed as inert text. It is never executed.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  if (
    TEXT_EXTS.has(extension)
    || mimeType.startsWith('text/')
    || ['readme', 'license', 'changelog', 'makefile', 'dockerfile'].includes(baseName)
  ) {
    return {
      fileType: 'text',
      previewKind: 'text',
      previewMessage: 'Original text stored and displayed as source without rewriting it.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  if (
    DOCUMENT_EXTS.has(extension)
    || mimeType.includes('wordprocessingml')
    || mimeType.includes('msword')
    || mimeType.includes('opendocument.text')
  ) return conversionRequired('document', 'document')

  if (
    PRESENTATION_EXTS.has(extension)
    || mimeType.includes('presentationml')
    || mimeType.includes('powerpoint')
    || mimeType.includes('opendocument.presentation')
  ) return conversionRequired('presentation', 'presentation')

  if (
    SPREADSHEET_EXTS.has(extension)
    || mimeType.includes('spreadsheetml')
    || mimeType.includes('excel')
    || mimeType.includes('opendocument.spreadsheet')
  ) return conversionRequired('spreadsheet', 'spreadsheet')

  if (EBOOK_EXTS.has(extension) || mimeType === 'application/epub+zip') {
    return conversionRequired('ebook', 'ebook')
  }

  if (MEDIA_EXTS.has(extension) || mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
    return {
      fileType: 'media',
      previewKind: 'media',
      previewMessage: 'Original media stored. It opens only in a dedicated media preview, never as narration.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  if (ARCHIVE_EXTS.has(extension)) {
    return {
      fileType: 'archive',
      previewKind: 'unsupported',
      previewMessage: 'Original archive stored. GlobalLab cannot preview its contents yet.',
      pageCount: 0,
      pageCountKnown: false,
    }
  }

  return {
    fileType: 'unknown',
    previewKind: 'unsupported',
    previewMessage: 'Original file stored safely. This format does not have a GlobalLab preview yet.',
    pageCount: 0,
    pageCountKnown: false,
  }
}

function hydrateBook(book: Partial<UserBook>, index: number): UserBook | null {
  if (typeof book.id !== 'string' || typeof book.fileName !== 'string') return null

  const classification = classifyUserSource({
    name: book.fileName,
    type: typeof book.mimeType === 'string' ? book.mimeType : '',
  })
  const isLegacyDocx = book.fileType === 'docx' && book.previewKind === undefined
  const color = typeof book.color === 'string'
    ? book.color
    : COVER_COLORS[index % COVER_COLORS.length]

  return {
    id: book.id,
    title: typeof book.title === 'string' ? book.title : book.fileName.replace(/\.[^.]+$/, ''),
    fileName: book.fileName,
    fileType: isLegacyDocx ? 'document' : (book.fileType ?? classification.fileType),
    previewKind: isLegacyDocx ? 'conversion-required' : (book.previewKind ?? classification.previewKind),
    previewMessage: isLegacyDocx
      ? 'This legacy DOCX import did not retain the original file. Re-upload it to preserve the source before previewing.'
      : (book.previewMessage ?? classification.previewMessage),
    fileExtension: book.fileExtension ?? getFileExtension(book.fileName),
    mimeType: book.mimeType ?? 'application/octet-stream',
    fileSize: typeof book.fileSize === 'number' ? book.fileSize : 0,
    pageCount: typeof book.pageCount === 'number' ? book.pageCount : classification.pageCount,
    pageCountKnown: book.pageCountKnown
      ?? (!isLegacyDocx && typeof book.pageCount === 'number' && book.pageCount > 0),
    originalStored: book.originalStored ?? !isLegacyDocx,
    color,
    spineColor: typeof book.spineColor === 'string' ? book.spineColor : darkenHex(color, 0.6),
    innerColor: typeof book.innerColor === 'string' ? book.innerColor : lightenHex(color, 0.78),
    addedAt: typeof book.addedAt === 'string' ? book.addedAt : new Date().toISOString(),
  }
}

function loadBooks(): UserBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<UserBook>[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((book, index) => hydrateBook(book, index))
      .filter((book): book is UserBook => book !== null)
  } catch {
    return []
  }
}

function saveBooks(books: UserBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  } catch {
    // The original files remain in IndexedDB. A future storage migration can move
    // metadata there too without silently deleting a student's source.
  }
}

function requestPersistentStorage(): void {
  if (persistenceRequested || typeof navigator === 'undefined') return
  persistenceRequested = true
  const request = navigator.storage?.persist?.()
  if (request) void request.catch(() => {/* Best effort only. */})
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'This source does not fit in available browser storage. Free some space and try again.'
  }
  return error instanceof Error ? error.message : 'Upload failed. Try again.'
}

export function useUserLibrary() {
  const [books, setBooks] = useState<UserBook[]>(loadBooks)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  useEffect(() => { saveBooks(books) }, [books])

  const addBook = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      if (file.size === 0) throw new Error('This file is empty and cannot be added.')

      const classification = classifyUserSource(file)
      const id = nanoid()
      const title = file.name.replace(/\.[^.]+$/, '') || file.name
      const colorIndex = loadBooks().length
      const color = COVER_COLORS[colorIndex % COVER_COLORS.length]

      setUploadProgress('Saving original source…')
      // Never parse, convert, execute, OCR, or count pages during upload. A large
      // PDF enters the library first; its reader does lazy work only when opened.
      await storeFile(id, file)
      requestPersistentStorage()

      const book: UserBook = {
        id,
        title,
        fileName: file.name,
        fileType: classification.fileType,
        previewKind: classification.previewKind,
        previewMessage: classification.previewMessage,
        fileExtension: getFileExtension(file.name),
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        pageCount: classification.pageCount,
        pageCountKnown: classification.pageCountKnown,
        originalStored: true,
        color,
        spineColor: darkenHex(color, 0.6),
        innerColor: lightenHex(color, 0.78),
        addedAt: new Date().toISOString(),
      }

      setBooks((previous) => [book, ...previous])
    } catch (error) {
      setUploadError(uploadErrorMessage(error))
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }, [])

  const removeBook = useCallback(async (id: string) => {
    // Delete the raw file from IndexedDB before removing metadata from state.
    // If anything interrupts between the two operations, the book stays
    // visible in the library (still pointing to its stored file) so the
    // student can try again — rather than leaving orphaned bytes in
    // IndexedDB with no UI path to clean them up.
    await deleteFile(id).catch(() => {/* Best effort — proceed regardless. */})
    setBooks((previous) => previous.filter((book) => book.id !== id))
  }, [])

  const clearError = useCallback(() => setUploadError(null), [])

  return { books, isUploading, uploadError, uploadProgress, addBook, removeBook, clearError }
}
