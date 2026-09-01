import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  File,
  FileCode2,
  FileImage,
  FileText,
  FlaskConical,
  Grid2X2,
  Layers,
  List,
  Loader2,
  Microscope,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { getFile } from '../services/fileStore'
import type { Subject, UserBook } from '../types'

type SourceFilter = 'all' | 'global' | 'mine'
type StatusFilter = 'all' | 'ready' | 'processing' | 'attention'
type SortMode = 'recent' | 'title' | 'type'
type ViewMode = 'grid' | 'list'

const SUBJECT_COLORS: Record<string, string> = {
  biology: '#0d8267',
  physics: '#2878c8',
  chemistry: '#7c4cc9',
  mathematics: '#c77a21',
}

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  biology: Microscope,
  chemistry: FlaskConical,
  physics: Layers,
  mathematics: Layers,
}

function subjectColor(id: string) {
  return SUBJECT_COLORS[id] ?? '#73716d'
}

function SubjectIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = SUBJECT_ICONS[id] ?? BookOpen
  return <Icon size={size} aria-hidden="true" />
}

function matchesQuery(values: Array<string | undefined>, query: string) {
  if (!query) return true
  return values.some((value) => value?.toLocaleLowerCase().includes(query))
}

function isReadableBook(book: UserBook) {
  return book.originalStored &&
    book.previewKind !== 'conversion-required' &&
    book.previewKind !== 'unsupported'
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / (1024 * 1024)
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`
}

function bookFormatLabel(book: UserBook) {
  return (book.fileExtension || book.fileType).toUpperCase()
}

function SourceIcon({ book }: { book: UserBook }) {
  if (book.previewKind === 'image') return <FileImage size={22} aria-hidden="true" />
  if (book.previewKind === 'code' || book.previewKind === 'data') return <FileCode2 size={22} aria-hidden="true" />
  if (book.previewKind === 'text' || book.previewKind === 'markdown') return <FileText size={22} aria-hidden="true" />
  return <File size={22} aria-hidden="true" />
}

function SourceArtwork({ book }: { book: UserBook }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (book.previewKind !== 'image') return
    let disposed = false
    let objectUrl: string | null = null
    void getFile(book.id).then((stored) => {
      if (disposed || !stored) return
      if (stored instanceof Blob) {
        objectUrl = URL.createObjectURL(stored)
        setImageUrl(objectUrl)
      } else if (typeof stored === 'string') {
        setImageUrl(stored)
      }
    }).catch(() => undefined)
    return () => {
      disposed = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [book.id, book.previewKind])

  return (
    <span
      className="glw-file-art"
      style={{ '--file-color': book.color, '--file-inner': book.innerColor } as CSSProperties}
      aria-hidden="true"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" />
      ) : (
        <>
          <span className="glw-file-art__fold" />
          <SourceIcon book={book} />
          <span className="glw-file-art__lines"><i /><i /><i /></span>
          <small>{bookFormatLabel(book).slice(0, 5)}</small>
        </>
      )}
    </span>
  )
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
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortMode>('recent')
  const [view, setView] = useState<ViewMode>('grid')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [pendingTrash, setPendingTrash] = useState<UserBook | null>(null)
  const trashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()

  useEffect(() => {
    return () => {
      if (trashTimerRef.current) clearTimeout(trashTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.glw-file-menu-wrap')) setOpenMenuId(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('pointerdown', closeMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenuId])

  const showGlobal = sourceFilter === 'all' || sourceFilter === 'global'
  const showMine = sourceFilter === 'all' || sourceFilter === 'mine'

  const filteredSubjects = useMemo(() => {
    if (!showGlobal) return []
    return subjects.filter((subject) => {
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && !subject.comingSoon) ||
        (statusFilter === 'attention' && subject.comingSoon)
      return statusMatches && matchesQuery(
        [subject.title, subject.description, ...subject.topics.map((topic) => topic.title)],
        normalizedQuery,
      )
    })
  }, [normalizedQuery, showGlobal, statusFilter, subjects])

  const filteredBooks = useMemo(() => {
    if (!showMine) return []
    const matches = books.filter((book) => {
      if (pendingTrash?.id === book.id) return false
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && isReadableBook(book)) ||
        (statusFilter === 'attention' && !isReadableBook(book))
      return statusMatches && matchesQuery(
        [book.title, book.fileName, book.fileExtension, book.fileType],
        normalizedQuery,
      )
    })
    return matches.sort((left, right) => {
      if (sort === 'title') return left.title.localeCompare(right.title)
      if (sort === 'type') return bookFormatLabel(left).localeCompare(bookFormatLabel(right))
      return Date.parse(right.addedAt) - Date.parse(left.addedAt)
    })
  }, [books, normalizedQuery, pendingTrash?.id, showMine, sort, statusFilter])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  const moveToTrash = (book: UserBook) => {
    if (pendingTrash) {
      if (trashTimerRef.current) clearTimeout(trashTimerRef.current)
      onRemoveBook(pendingTrash.id)
    }
    setOpenMenuId(null)
    setPendingTrash(book)
    trashTimerRef.current = setTimeout(() => {
      onRemoveBook(book.id)
      setPendingTrash(null)
      trashTimerRef.current = null
    }, 6000)
  }

  const undoTrash = () => {
    if (trashTimerRef.current) clearTimeout(trashTimerRef.current)
    trashTimerRef.current = null
    setPendingTrash(null)
  }

  const totalResults = filteredSubjects.length + filteredBooks.length
  const hasActiveFilters =
    Boolean(normalizedQuery) ||
    sourceFilter !== 'all' ||
    statusFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setSourceFilter('all')
    setStatusFilter('all')
  }

  return (
    <main className="glw-library" id="main-content">
      <div className="glw-ambient glw-ambient--library" aria-hidden="true" />

      <header className="glw-library-hero glw-enter">
        <button type="button" className="glw-back-link" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" /> Home</button>
        <div className="glw-library-hero__copy">
          <p className="glw-eyebrow">Your study materials, ready when you are</p>
          <h1>Library</h1>
          <p>Search GlobalLab lessons and the original sources you uploaded.</p>
        </div>
        <button type="button" className="glw-button glw-button--primary" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? <Loader2 size={16} className="glw-spin" aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
          {isUploading ? (uploadProgress ?? 'Saving…') : 'Upload source'}
        </button>
        <input ref={fileInputRef} type="file" hidden onChange={handleFile} />
      </header>

      {uploadError && (
        <div className="glw-alert glw-alert--error" role="alert">
          <span>{uploadError}</span>
          <button type="button" onClick={onClearError} aria-label="Dismiss upload error"><X size={15} aria-hidden="true" /></button>
        </div>
      )}

      <section className="glw-library-toolbar glw-enter glw-enter--delay-1" aria-label="Library controls">
        <label className="glw-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Search subjects, titles, or formats"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search library"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} aria-hidden="true" /></button>}
        </label>

        <div className="glw-segmented" role="group" aria-label="Source filter">
          {([
            ['all', 'All'],
            ['global', 'GlobalLab'],
            ['mine', 'My sources'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={sourceFilter === id} onClick={() => setSourceFilter(id)}>{label}</button>
          ))}
        </div>

        <label className="glw-select">
          <span className="sr-only">Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter by status">
            <option value="all">Any status</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="attention">Needs attention</option>
          </select>
        </label>

        <label className="glw-select">
          <span className="sr-only">Sort sources</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort library">
            <option value="recent">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="type">File type</option>
          </select>
        </label>

        <div className="glw-view-toggle" role="group" aria-label="Library view">
          <button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={17} aria-hidden="true" /></button>
        </div>
      </section>

      <div className="glw-library-results" aria-live="polite">
        <span>{totalResults} {totalResults === 1 ? 'item' : 'items'}</span>
        {hasActiveFilters && <button type="button" onClick={resetFilters}>Clear filters</button>}
      </div>

      <div className="glw-library-content">
        {showGlobal && filteredSubjects.length > 0 && (
          <section className="glw-library-section glw-enter glw-enter--delay-2" aria-labelledby="guided-collections">
            <header>
              <div><p className="glw-eyebrow">Curated and source-cited</p><h2 id="guided-collections">Guided collections</h2></div>
              <span>{filteredSubjects.length} subjects</span>
            </header>
            <div className="glw-library-subjects">
              {filteredSubjects.map((subject, index) => (
                <button
                  key={subject.id}
                  type="button"
                  className="glw-library-subject glw-interactive-card"
                  style={{ '--subject': subjectColor(subject.id), '--delay': `${index * 45}ms` } as CSSProperties}
                  onClick={() => onSelectSubject(subject)}
                  disabled={subject.comingSoon === true}
                  aria-label={`${subject.title}${subject.comingSoon ? ' — coming soon' : ''}`}
                >
                  <span className="glw-library-subject__number">0{index + 1}</span>
                  <span className="glw-library-subject__icon"><SubjectIcon id={subject.id} size={21} /></span>
                  <span className="glw-library-subject__copy">
                    <strong>{subject.title}</strong>
                    <small>{subject.comingSoon ? 'Coming soon' : `${subject.topics.length} source-cited topics`}</small>
                  </span>
                  {subject.comingSoon ? <span className="glw-status-chip glw-status-chip--quiet">Soon</span> : <ArrowRight size={16} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {showMine && (
          <section className="glw-library-section glw-enter glw-enter--delay-3" aria-labelledby="your-sources">
            <header>
              <div><p className="glw-eyebrow">Original files preserved</p><h2 id="your-sources">Your sources</h2></div>
              <span>{filteredBooks.length} visible</span>
            </header>

            {isUploading && (
              <div className="glw-upload-progress" role="status" aria-live="polite">
                <Loader2 size={17} className="glw-spin" aria-hidden="true" />
                <span><strong>Adding your source</strong><small>{uploadProgress ?? 'Saving the original file…'}</small></span>
                <i aria-hidden="true" />
              </div>
            )}

            {filteredBooks.length > 0 ? (
              <div className={`glw-file-grid glw-file-grid--${view}`}>
                {filteredBooks.map((book) => {
                  const ready = isReadableBook(book)
                  return (
                    <article key={book.id} className="glw-file-card glw-interactive-card">
                      <button type="button" className="glw-file-card__open" onClick={() => onSelectBook(book)} aria-label={`Open ${book.title}`}>
                        <SourceArtwork book={book} />
                        <span className="glw-file-card__copy">
                          <span className={`glw-file-status ${ready ? 'is-ready' : 'needs-attention'}`}>
                            {ready ? <CheckCircle2 size={12} aria-hidden="true" /> : <AlertCircle size={12} aria-hidden="true" />}
                            {ready ? 'Ready to read' : 'Preview limited'}
                          </span>
                          <strong>{book.title}</strong>
                          <small>{bookFormatLabel(book)} · {formatFileSize(book.fileSize) || 'Stored locally'}</small>
                          <span className="glw-file-card__date">Added {new Date(book.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                      </button>
                      <div className="glw-file-menu-wrap">
                        <button
                          type="button"
                          className="glw-file-menu-trigger"
                          aria-label={`More options for ${book.title}`}
                          aria-expanded={openMenuId === book.id}
                          onClick={() => setOpenMenuId((current) => current === book.id ? null : book.id)}
                        >
                          <MoreHorizontal size={18} aria-hidden="true" />
                        </button>
                        {openMenuId === book.id && (
                          <div className="glw-file-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => onSelectBook(book)}><BookOpen size={14} aria-hidden="true" /> Open source</button>
                            <button type="button" role="menuitem" className="is-danger" onClick={() => moveToTrash(book)}><Trash2 size={14} aria-hidden="true" /> Move to trash</button>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}

                <button type="button" className="glw-file-card glw-file-card--add" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <span><Upload size={21} aria-hidden="true" /></span>
                  <strong>Add a source</strong>
                  <small>Keep the original and study beside it</small>
                </button>
              </div>
            ) : !isUploading && (
              <div className="glw-library-empty">
                <span>{hasActiveFilters ? <Search size={25} aria-hidden="true" /> : <Upload size={25} aria-hidden="true" />}</span>
                <h3>{hasActiveFilters ? 'No sources match these filters' : 'Build your personal source shelf'}</h3>
                <p>{hasActiveFilters ? 'Try clearing a filter or searching for a different title.' : 'Upload a study file and GlobalLab will keep the original ready to read.'}</p>
                <button type="button" className="glw-button glw-button--secondary" onClick={hasActiveFilters ? resetFilters : () => fileInputRef.current?.click()}>
                  {hasActiveFilters ? 'Clear filters' : 'Upload your first source'}
                </button>
              </div>
            )}
          </section>
        )}

        {totalResults === 0 && !showMine && (
          <div className="glw-library-empty">
            <span><Search size={25} aria-hidden="true" /></span>
            <h3>No guided collection matches</h3>
            <p>Try a different search or show all sources.</p>
            <button type="button" className="glw-button glw-button--secondary" onClick={resetFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {pendingTrash && (
        <div className="glw-toast" role="status" aria-live="polite">
          <span><Trash2 size={16} aria-hidden="true" /><span><strong>Moved to trash</strong><small>{pendingTrash.title}</small></span></span>
          <button type="button" onClick={undoTrash}><RotateCcw size={14} aria-hidden="true" /> Undo</button>
        </div>
      )}
    </main>
  )
}
