import { Loader2, Search, Trash2, Upload, X } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { Subject, UserBook } from '../types'

type LibraryFilter = 'all' | 'global' | 'mine' | 'readable'

const FILTERS: ReadonlyArray<{ id: LibraryFilter; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'global',   label: 'GlobalLab' },
  { id: 'mine',     label: 'Mine' },
  { id: 'readable', label: 'Readable now' },
]

const SUBJECT_COLORS: Record<string, string> = {
  biology:     '#0D6E52',
  physics:     '#1A5FA8',
  chemistry:   '#6B35C8',
  mathematics: '#C87B1A',
}

function subjectColor(id: string): string {
  return SUBJECT_COLORS[id] ?? '#4a4540'
}

function matchesQuery(values: Array<string | undefined>, query: string): boolean {
  if (!query) return true
  return values.some((value) => value?.toLocaleLowerCase().includes(query))
}

function isReadableBook(book: UserBook): boolean {
  return (
    book.originalStored
    && book.previewKind !== 'conversion-required'
    && book.previewKind !== 'unsupported'
  )
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const megabytes = bytes / (1024 * 1024)
  return `${megabytes >= 10 ? Math.round(megabytes) : megabytes.toFixed(1)} MB`
}

function bookFormatLabel(book: UserBook): string {
  return (book.fileExtension ?? book.fileType).toUpperCase()
}

interface LibraryPageProps {
  subjects: Subject[]
  books: UserBook[]
  isUploading: boolean
  uploadProgress: string | null
  uploadError: string | null
  onSelectSubject: (subject: Subject) => void
  onSelectBook: (book: UserBook) => void
  onUpload: (file: File) => void
  onRemoveBook: (id: string) => void
  onClearError: () => void
  onBack: () => void
}

export function LibraryPage({
  subjects,
  books,
  isUploading,
  uploadProgress,
  uploadError,
  onSelectSubject,
  onSelectBook,
  onUpload,
  onRemoveBook,
  onClearError,
  onBack,
}: LibraryPageProps) {
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()

  const showGlobal = filter === 'all' || filter === 'global' || filter === 'readable'
  const showMine   = filter === 'all' || filter === 'mine'   || filter === 'readable'

  const filteredSubjects = useMemo(() => {
    if (!showGlobal) return []
    return subjects.filter((subject) => {
      if (filter === 'readable' && subject.comingSoon) return false
      return matchesQuery(
        [subject.title, subject.description, ...subject.topics.map((t) => t.title)],
        normalizedQuery,
      )
    })
  }, [filter, normalizedQuery, showGlobal, subjects])

  const filteredBooks = useMemo(() => {
    if (!showMine) return []
    return books.filter((book) => {
      if (filter === 'readable' && !isReadableBook(book)) return false
      return matchesQuery(
        [book.title, book.fileName, book.fileExtension, book.fileType],
        normalizedQuery,
      )
    })
  }, [books, filter, normalizedQuery, showMine])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <main className="gl-libpage" id="main-content">
      {/* Toolbar */}
      <div className="gl-libpage-toolbar">
        <button type="button" className="gl-libpage-back" onClick={onBack}>
          ← Home
        </button>

        <div className="gl-libpage-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            className="gl-libpage-search__input"
            value={query}
            placeholder="Search titles or formats…"
            aria-label="Search library"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              className="gl-libpage-search__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="gl-libpage-filters" role="group" aria-label="Filter library">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="gl-libpage-filter"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="gl-libpage-upload-btn"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 size={13} aria-hidden="true" className="gl-libpage-upload-btn__spinner" />
          ) : (
            <Upload size={13} aria-hidden="true" />
          )}
          {isUploading ? (uploadProgress ?? 'Saving…') : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFile}
          aria-hidden="true"
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="gl-libpage-error" role="alert">
          <p>{uploadError}</p>
          <button type="button" onClick={onClearError} aria-label="Dismiss error">
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="gl-libpage-content">
        {/* GlobalLab subjects grid */}
        {showGlobal && filteredSubjects.length > 0 && (
          <section className="gl-libpage-section">
            <h2 className="gl-libpage-section__title">
              GlobalLab Subjects
            </h2>
            <div className="gl-libpage-subject-grid">
              {filteredSubjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className="gl-libpage-subject-card"
                  style={{ '--subject-color': subjectColor(subject.id) } as React.CSSProperties}
                  onClick={() => onSelectSubject(subject)}
                  disabled={subject.comingSoon === true}
                  aria-label={`${subject.title}${subject.comingSoon ? ' — coming soon' : ''}`}
                >
                  <div className="gl-libpage-subject-card__bar" aria-hidden="true" />
                  <p className="gl-libpage-subject-card__title">{subject.title}</p>
                  <p className="gl-libpage-subject-card__meta">
                    {subject.comingSoon ? 'Coming soon' : `${subject.topics.length} topics`}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Uploaded files grid */}
        {showMine && (
          <section className="gl-libpage-section">
            <h2 className="gl-libpage-section__title">
              Your Sources
              {filteredBooks.length > 0 && (
                <span className="gl-libpage-count">{filteredBooks.length}</span>
              )}
            </h2>
            <div className="gl-libpage-file-grid">
              {filteredBooks.map((book) => (
                <div key={book.id} className="gl-libpage-file-card">
                  <button
                    type="button"
                    className="gl-libpage-file-card__main"
                    onClick={() => onSelectBook(book)}
                    aria-label={book.title}
                  >
                    <span className="gl-libpage-file-card__format">
                      {bookFormatLabel(book)}
                    </span>
                    <p className="gl-libpage-file-card__title">{book.title}</p>
                    <p className="gl-libpage-file-card__meta">
                      {book.fileSize ? formatFileSize(book.fileSize) : ''}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="gl-libpage-file-card__remove"
                    onClick={() => onRemoveBook(book.id)}
                    aria-label={`Remove ${book.title}`}
                  >
                    <Trash2 size={11} aria-hidden="true" />
                  </button>
                </div>
              ))}

              {/* Upload slot when no books */}
              {filteredBooks.length === 0 && !isUploading && (
                <button
                  type="button"
                  className="gl-libpage-upload-slot"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span aria-hidden="true">↑</span>
                  Add your first source
                </button>
              )}

              {/* Upload in progress */}
              {isUploading && (
                <div className="gl-libpage-upload-progress" role="status">
                  <Loader2 size={16} aria-hidden="true" className="gl-libpage-upload-btn__spinner" />
                  <p>{uploadProgress ?? 'Saving source…'}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filteredSubjects.length === 0 && filteredBooks.length === 0 && (
          <p className="gl-libpage-empty">No sources match this search.</p>
        )}
      </div>
    </main>
  )
}
