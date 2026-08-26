import {
  Atom,
  Dna,
  FileImage,
  FileText,
  FlaskConical,
  Loader2,
  Plus,
  Search,
  Sigma,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from 'react'
import type { Subject, UserBook } from '../types'

interface LibraryShelfProps {
  subjects: Subject[]
  books: UserBook[]
  isUploading: boolean
  uploadError: string | null
  uploadProgress: string | null
  onSelect: (subject: Subject) => void
  onUpload: (file: File) => void
  onSelectBook: (book: UserBook) => void
  onRemoveBook: (id: string) => void
  onClearError: () => void
}

type LibraryFilter = 'all' | 'global' | 'mine' | 'readable'

interface BookPalette {
  cover: string
  spine: string
  inner: string
}

const OPEN_ANIMATION_MS = 360
const OPENING_RESET_MS = 80

const FILTERS: ReadonlyArray<{ id: LibraryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'global', label: 'Global Lab' },
  { id: 'mine', label: 'Mine' },
  { id: 'readable', label: 'Readable now' },
]

const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const SUBJECT_ICONS = {
  biology: Dna,
  physics: Atom,
  chemistry: FlaskConical,
  mathematics: Sigma,
}

const BOOK_COLORS: Record<string, BookPalette> = {
  biology:     { cover: '#0D6E52', spine: '#084d39', inner: '#d4efe7' },
  physics:     { cover: '#1A5FA8', spine: '#10406e', inner: '#d4e5f7' },
  chemistry:   { cover: '#6B35C8', spine: '#4a2490', inner: '#e5d4f7' },
  mathematics: { cover: '#C87B1A', spine: '#8a5213', inner: '#f7e9d4' },
}

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  image: FileImage,
  text: FileText,
  markdown: FileText,
  code: FileText,
  data: FileText,
  document: FileText,
  presentation: FileText,
  spreadsheet: FileText,
  ebook: FileText,
  media: FileText,
  archive: FileText,
  unknown: FileText,
}

function bookFormatLabel(book: UserBook): string {
  return (book.fileExtension || book.fileType).toUpperCase()
}

function legacyBookMeta(book: UserBook): string {
  const format = bookFormatLabel(book)
  if (book.previewKind === 'conversion-required') return `${format} \u00b7 Preview needs conversion`
  if (book.previewKind === 'unsupported') return `${format} \u00b7 Stored \u00b7 Preview unavailable`
  if (book.pageCountKnown && book.pageCount > 0) {
    return `${book.pageCount} ${book.pageCount === 1 ? 'page' : 'pages'} \u00b7 ${format}`
  }
  if (book.previewKind === 'pdf') return `${format} \u00b7 Pages counted when opened`
  return `${format} \u00b7 Original stored`
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const megabytes = bytes / (1024 * 1024)
  return `${megabytes >= 10 ? Math.round(megabytes) : megabytes.toFixed(1)} MB`
}

function truthfulBookMeta(book: UserBook): string {
  const fallback = legacyBookMeta(book)
  const format = bookFormatLabel(book)
  const size = formatFileSize(book.fileSize)
  const details: string[] = [format]

  if (!book.originalStored) {
    details.push('Legacy import', 'Re-upload the original')
    return details.join(' \u00b7 ')
  }

  details.push('Stored locally')

  if (book.previewKind === 'conversion-required') {
    details.push('Preview needs conversion')
  } else if (book.previewKind === 'unsupported') {
    details.push('Preview unavailable')
  } else if (book.pageCountKnown && book.pageCount > 0) {
    details.push(`${book.pageCount} ${book.pageCount === 1 ? 'page' : 'pages'}`)
  } else if (book.previewKind === 'pdf') {
    details.push('Pages counted when opened')
  }

  if (size) details.push(size)
  return details.length > 0 ? details.join(' \u00b7 ') : fallback
}

function isReadableBook(book: UserBook): boolean {
  return (
    book.originalStored
    && book.previewKind !== 'conversion-required'
    && book.previewKind !== 'unsupported'
  )
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function libraryBookStyle(id: string, palette: BookPalette): CSSProperties {
  const hash = stableHash(id)
  const leans = [-2.1, -1.1, -0.35, 0.55, 1.4, 2] as const

  return {
    '--library-book-width': `${132 + (hash % 15)}px`,
    '--library-book-height': `${202 + ((hash >>> 4) % 22)}px`,
    '--library-book-lean': `${leans[(hash >>> 9) % leans.length]}deg`,
    '--library-book-depth': `${22 + ((hash >>> 13) % 10)}px`,
    '--book-cover': palette.cover,
    '--book-spine': palette.spine,
    '--book-inner': palette.inner,
  } as CSSProperties
}

function matchesQuery(values: Array<string | undefined>, query: string): boolean {
  if (!query) return true
  return values.some((value) => value?.toLocaleLowerCase().includes(query))
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    return (
      typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  })

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)

    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  return prefersReducedMotion
}

export function LibraryShelf({
  subjects,
  books,
  isUploading,
  uploadError,
  uploadProgress,
  onSelect,
  onUpload,
  onSelectBook,
  onRemoveBook,
  onClearError,
}: LibraryShelfProps) {
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openingBookId, setOpeningBookId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigationTimerRef = useRef<number | null>(null)
  const resetTimerRef = useRef<number | null>(null)
  const isNavigatingRef = useRef(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const isNavigating = openingId !== null || openingBookId !== null

  const showGlobalSection =
    filter === 'all' || filter === 'global' || filter === 'readable'
  const showMineSection =
    filter === 'all' || filter === 'mine' || filter === 'readable'

  const filteredSubjects = useMemo(() => {
    if (!showGlobalSection) return []
    return subjects.filter((subject) => {
      if (filter === 'readable' && subject.comingSoon) return false
      return matchesQuery(
        [subject.title, subject.description, ...subject.topics.map((topic) => topic.title)],
        normalizedQuery,
      )
    })
  }, [filter, normalizedQuery, showGlobalSection, subjects])

  const filteredBooks = useMemo(() => {
    if (!showMineSection) return []
    return books.filter((book) => {
      if (filter === 'readable' && !isReadableBook(book)) return false
      return matchesQuery(
        [book.title, book.fileName, book.fileExtension, book.fileType],
        normalizedQuery,
      )
    })
  }, [books, filter, normalizedQuery, showMineSection])

  const visibleCount = filteredSubjects.length + filteredBooks.length
  const resultSummary = `${visibleCount} ${visibleCount === 1 ? 'book' : 'books'} shown`
  const liveStatusMessage = uploadError
    ?? (isUploading
      ? uploadProgress ?? 'Saving the original source locally'
      : statusMessage)

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current !== null) {
        window.clearTimeout(navigationTimerRef.current)
      }
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
      isNavigatingRef.current = false
    }
  }, [])

  const resetOpeningState = () => {
    isNavigatingRef.current = false
    setOpeningId(null)
    setOpeningBookId(null)
  }

  const scheduleNavigation = (
    kind: 'subject' | 'book',
    id: string,
    title: string,
    navigate: () => void,
  ) => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setStatusMessage(`Opening ${title}`)

    if (prefersReducedMotion) {
      navigate()
      resetOpeningState()
      return
    }

    if (kind === 'subject') setOpeningId(id)
    else setOpeningBookId(id)

    navigationTimerRef.current = window.setTimeout(() => {
      navigationTimerRef.current = null
      navigate()
      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = null
        resetOpeningState()
      }, OPENING_RESET_MS)
    }, OPEN_ANIMATION_MS)
  }

  const handleBookClick = (subject: Subject) => {
    if (subject.comingSoon) return
    scheduleNavigation(
      'subject',
      subject.id,
      subject.title,
      () => onSelect(subject),
    )
  }

  const handleUserBookClick = (book: UserBook) => {
    scheduleNavigation('book', book.id, book.title, () => onSelectBook(book))
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <div className="gl-library">
      <div className="gl-library__toolbar">
        <div className="gl-library-search">
          <Search size={16} aria-hidden="true" />
          <label htmlFor="library-search" style={VISUALLY_HIDDEN_STYLE}>
            Search your library
          </label>
          <input
            id="library-search"
            type="search"
            value={query}
            placeholder="Search titles or formats"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              className="gl-library-search__clear"
              onClick={() => setQuery('')}
              aria-label="Clear library search"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="gl-library-filters" role="group" aria-label="Filter library">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="gl-library-filter"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="gl-library__result-count" aria-hidden="true">
          {resultSummary}
        </span>
      </div>

      <p
        className="gl-library__live-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={VISUALLY_HIDDEN_STYLE}
      >
        {liveStatusMessage}
      </p>
      <p aria-live="polite" aria-atomic="true" style={VISUALLY_HIDDEN_STYLE}>
        {resultSummary}
      </p>

      {/* ── Global Lab Library ── */}
      {showGlobalSection && (
      <section className="gl-library-shelf" aria-label="Global Lab Library">
        <div className="gl-library-shelf__heading">
          <span className="gl-library-shelf__eyebrow">Global Lab Library</span>
          <span className="gl-library-shelf__sublabel">
            Source-cited Global Lab texts
          </span>
        </div>

        <ul
          className={[
            'gl-library-shelf__row',
            openingId ? 'gl-library-shelf__row--opening' : '',
          ].join(' ')}
        >
          {filteredSubjects.map((subject) => {
            const Icon = SUBJECT_ICONS[subject.id as keyof typeof SUBJECT_ICONS] ?? FlaskConical
            const colors = BOOK_COLORS[subject.id] ?? { cover: '#555', spine: '#333', inner: '#eee' }
            const isOpening = openingId === subject.id

            return (
              <li key={subject.id} className="gl-library-shelf__item">
              <button
                type="button"
                className={[
                  'gl-library-book-trigger',
                  subject.comingSoon ? 'gl-library-book-trigger--soon' : '',
                  isOpening ? 'gl-library-book-trigger--opening' : '',
                ].join(' ')}
                style={libraryBookStyle(subject.id, colors)}
                onClick={() => handleBookClick(subject)}
                disabled={(isNavigating && !isOpening) || subject.comingSoon === true}
                aria-busy={isOpening || undefined}
                aria-label={`${subject.title}. ${subject.comingSoon ? 'Coming soon' : `${subject.topics.length} topics`}`}
              >
                <div className="gl-library-book">
                  <div className="gl-library-book__spine">
                    <span className="gl-library-book__spine-text">{subject.title}</span>
                  </div>
                  <div className="gl-library-book__pages" />
                  <div className="gl-library-book__back" />
                  <div className="gl-library-book__cover" aria-hidden="true">
                    <div className="gl-library-book__cover-face gl-library-book__cover-face--outer">
                      <div className="gl-library-book__cover-top">
                        <span className="gl-library-book__icon">
                          <Icon size={28} strokeWidth={1.7} />
                        </span>
                        {subject.comingSoon && (
                          <span className="gl-library-book__soon-badge">Soon</span>
                        )}
                      </div>
                      <div className="gl-library-book__cover-bottom">
                        <span className="gl-library-book__title">{subject.title}</span>
                        <span className="gl-library-book__meta">
                          {subject.comingSoon ? 'Coming soon' : `${subject.topics.length} topics`}
                        </span>
                      </div>
                      <div className="gl-library-book__sheen" />
                    </div>
                    <div className="gl-library-book__cover-face gl-library-book__cover-face--inner">
                      <div className="gl-library-book__endpaper-pattern" />
                      <span className="gl-library-book__endpaper-title">{subject.title}</span>
                    </div>
                  </div>
                </div>
              </button>
              </li>
            )
          })}
        </ul>

        {filteredSubjects.length === 0 && (
          <p className="gl-library-shelf__empty-result">
            No Global Lab books match this search.
          </p>
        )}

        <div className="gl-library-shelf__plank" aria-hidden="true">
          <div className="gl-library-shelf__plank-highlight" />
        </div>
      </section>
      )}

      {/* ── Your Library ── */}
      {showMineSection && (
      <section className="gl-library-shelf gl-library-shelf--personal" aria-label="Your Library">
        <div className="gl-library-shelf__heading">
          <span className="gl-library-shelf__eyebrow gl-library-shelf__eyebrow--personal">
            Your Library
          </span>
          <span className="gl-library-shelf__sublabel">
            Originals stored locally in this browser · Preview depends on format
          </span>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="gl-library-upload__error" role="alert">
            <span>{uploadError}</span>
            <button type="button" onClick={onClearError} aria-label="Dismiss">
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )}

        <ul
          className={[
            'gl-library-shelf__row',
            'gl-library-shelf__row--personal',
            openingBookId ? 'gl-library-shelf__row--opening' : '',
          ].join(' ')}
        >

          {/* User's uploaded books */}
          {filteredBooks.map((book) => {
            const FileIcon = FILE_ICONS[book.fileType] ?? FileText
            const isOpening = openingBookId === book.id

            return (
              <li
                key={book.id}
                className="gl-library-shelf__item gl-library-shelf__item--user"
              >
              <div className="gl-library-user-book">
                <button
                  type="button"
                  className={[
                    'gl-library-book-trigger',
                    'gl-library-book-trigger--user',
                    isOpening ? 'gl-library-book-trigger--opening' : '',
                  ].join(' ')}
                  style={libraryBookStyle(book.id, {
                    cover: book.color,
                    spine: book.spineColor,
                    inner: book.innerColor,
                  })}
                  onClick={() => handleUserBookClick(book)}
                  disabled={isNavigating && !isOpening}
                  aria-busy={isOpening || undefined}
                  aria-label={`${book.title}. ${truthfulBookMeta(book)}`}
                >
                  <div className="gl-library-book">
                    <div className="gl-library-book__spine">
                      <span className="gl-library-book__spine-text">{book.title}</span>
                    </div>
                    <div className="gl-library-book__pages" />
                    <div className="gl-library-book__back" />
                    <div className="gl-library-book__cover" aria-hidden="true">
                      <div className="gl-library-book__cover-face gl-library-book__cover-face--outer">
                        <div className="gl-library-book__cover-top">
                          <span className="gl-library-book__icon">
                            <FileIcon size={26} strokeWidth={1.6} />
                          </span>
                        </div>
                        <div className="gl-library-book__cover-bottom">
                          <span className="gl-library-book__title">{book.title}</span>
                          <span className="gl-library-book__meta">
                            {truthfulBookMeta(book)}
                          </span>
                        </div>
                        <div className="gl-library-book__sheen" />
                      </div>
                      <div className="gl-library-book__cover-face gl-library-book__cover-face--inner">
                        <div className="gl-library-book__endpaper-pattern" />
                        <span className="gl-library-book__endpaper-title">{book.title}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  className="gl-library-user-book__remove"
                  onClick={() => onRemoveBook(book.id)}
                  aria-label={`Remove ${book.title}`}
                >
                  <Trash2 size={11} aria-hidden="true" />
                </button>
              </div>
              </li>
            )
          })}

          {/* Upload slot */}
          {filteredBooks.length === 0 && !isUploading && (
            <li className="gl-library-shelf__item gl-library-shelf__item--empty">
            <div className="gl-library-empty">
              <div className="gl-library-empty__slot" aria-hidden="true">
                <Plus size={18} strokeWidth={2} />
              </div>
              <p className="gl-library-empty__hint">
                {books.length === 0
                  ? 'Your uploaded books will appear here'
                  : 'No uploaded sources match this view'}
              </p>
            </div>
            </li>
          )}

          {/* Upload progress */}
          {isUploading && (
            <li className="gl-library-shelf__item gl-library-shelf__item--uploading">
              <div className="gl-library-upload__progress" aria-live="polite">
                <Loader2 size={20} className="gl-library-upload__spinner" aria-hidden="true" />
                <p className="gl-library-upload__text">
                  {uploadProgress ?? 'Saving source…'}
                </p>
              </div>
            </li>
          )}

          {/* Upload button */}
          <li className="gl-library-shelf__item gl-library-shelf__item--upload">
          <button
            type="button"
            className="gl-library-upload__button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading
              ? <Loader2 size={13} className="gl-library-upload__spinner" aria-hidden="true" />
              : <Upload size={13} aria-hidden="true" />}
            {isUploading ? 'Saving…' : 'Upload source'}
          </button>
          </li>
        </ul>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-hidden="true"
        />

        <div className="gl-library-shelf__plank gl-library-shelf__plank--personal" aria-hidden="true">
          <div className="gl-library-shelf__plank-highlight" />
        </div>
      </section>
      )}

    </div>
  )
}
