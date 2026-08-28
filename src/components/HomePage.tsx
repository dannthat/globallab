import { ArrowRight, BookOpenText, Loader2, X } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { Subject, UserBook } from '../types'

const SUBJECT_COLORS: Record<string, string> = {
  biology:     '#0D6E52',
  physics:     '#1A5FA8',
  chemistry:   '#6B35C8',
  mathematics: '#C87B1A',
}

const SUBJECT_PATTERNS: Record<string, string> = {
  biology:     'radial-gradient(ellipse 60% 40% at 30% 60%, rgb(255 255 255 / 6%) 0%, transparent 70%), radial-gradient(circle at 70% 30%, rgb(255 255 255 / 4%) 0%, transparent 50%)',
  physics:     'linear-gradient(135deg, rgb(255 255 255 / 5%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgb(255 255 255 / 6%) 0%, transparent 40%)',
  chemistry:   'radial-gradient(circle at 20% 80%, rgb(255 255 255 / 6%) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 60% 40%, rgb(255 255 255 / 4%) 0%, transparent 60%)',
  mathematics: 'linear-gradient(45deg, rgb(255 255 255 / 5%) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgb(255 255 255 / 6%) 0%, transparent 45%)',
}

function subjectColor(id: string): string {
  return SUBJECT_COLORS[id] ?? '#4a4540'
}

function subjectPattern(id: string): string {
  return SUBJECT_PATTERNS[id] ?? ''
}

interface HomePageProps {
  subjects: Subject[]
  books: UserBook[]
  isUploading: boolean
  uploadProgress: string | null
  uploadError: string | null
  activeSubjectId: string | null
  onSelectSubject: (subject: Subject) => void
  onSelectBook: (book: UserBook) => void
  onUpload: (file: File) => void
  onOpenLibrary: () => void
  onClearError: () => void
}

export function HomePage({
  subjects,
  books,
  isUploading,
  uploadProgress,
  uploadError,
  activeSubjectId,
  onSelectSubject,
  onSelectBook,
  onUpload,
  onOpenLibrary,
  onClearError,
}: HomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emptyFileInputRef = useRef<HTMLInputElement>(null)

  const activeSubject = activeSubjectId
    ? subjects.find((s) => s.id === activeSubjectId) ?? null
    : null

  const availableSubjects = subjects.filter((s) => !s.comingSoon)
  const recentBooks = books.slice(0, 3)
  const featuredTopic = activeSubject?.topics[0] ?? null
  const chapterCount = activeSubject?.topics.length ?? 0
  const volumeMapProgress = chapterCount > 0 ? 100 / chapterCount : 0

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  const handleTilt = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientY - rect.top) / rect.height - 0.5
    const y = (event.clientX - rect.left) / rect.width - 0.5
    event.currentTarget.style.setProperty('--tilt-x', `${-x * 4}deg`)
    event.currentTarget.style.setProperty('--tilt-y', `${y * 4}deg`)
  }

  const resetTilt = (event: React.MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg')
    event.currentTarget.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <main className="gl-home" id="main-content">
      {/* ── Left: Hero ── */}
      <div className="gl-home-hero">
        {activeSubject ? (
          <div
            className="gl-home-hero-card gl-tilt-card"
            style={{
              '--hero-color': subjectColor(activeSubject.id),
              '--hero-pattern': subjectPattern(activeSubject.id),
            } as React.CSSProperties}
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
          >
            <div className="gl-home-hero-card__pattern" aria-hidden="true" />
            <div className="gl-home-hero-card__content">
              <div className="gl-home-hero-card__topline">
                <span>Currently studying</span>
                <span>GlobalLab volume</span>
              </div>

              <div className="gl-home-hero-card__main">
                <p className="gl-home-hero-card__kicker">Your active subject</p>
                <h2 className="gl-home-hero-card__title">{activeSubject.title}</h2>
                <p className="gl-home-hero-card__topics">
                  {featuredTopic
                    ? `Chapter 01 — ${featuredTopic.title}`
                    : `${chapterCount} source-cited chapters`}
                </p>
                <button
                  type="button"
                  className="gl-home-hero-card__cta"
                  onClick={() => onSelectSubject(activeSubject)}
                >
                  Continue reading
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="gl-home-hero-card__footer">
                <div className="gl-home-hero-card__progress-copy">
                  <span>Volume map</span>
                  <strong>{chapterCount > 0 ? `1 of ${chapterCount}` : 'Ready'}</strong>
                </div>
                <div
                  className="gl-home-hero-card__progress"
                  role="progressbar"
                  aria-label="First chapter in this volume"
                  aria-valuemin={0}
                  aria-valuemax={chapterCount || 1}
                  aria-valuenow={chapterCount > 0 ? 1 : 0}
                >
                  <span style={{ width: `${volumeMapProgress}%` }} />
                </div>
                <p className="gl-home-hero-card__provenance">
                  <BookOpenText size={14} aria-hidden="true" />
                  Original text stays cited. Personalization appears beside it.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* No active subject — two equal entry tiles */
          <div className="gl-home-hero-empty">
            <div className="gl-home-hero-empty__inner">
              <h2 className="gl-home-hero-empty__title">Your reading room</h2>
              <p className="gl-home-hero-empty__body">
                Open a source-cited GlobalLab textbook or upload your own source.
              </p>
              <div className="gl-home-hero-empty__tiles">
                <button
                  type="button"
                  className="gl-home-hero-tile"
                  onClick={() => onSelectSubject(availableSubjects[0])}
                >
                  <span className="gl-home-hero-tile__icon" aria-hidden="true">⬡</span>
                  <span className="gl-home-hero-tile__label">Pick a GlobalLab subject</span>
                  <span className="gl-home-hero-tile__arrow">→</span>
                </button>
                <button
                  type="button"
                  className="gl-home-hero-tile gl-home-hero-tile--upload"
                  onClick={() => emptyFileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <span className="gl-home-hero-tile__icon" aria-hidden="true">↑</span>
                  <span className="gl-home-hero-tile__label">
                    {isUploading ? (uploadProgress ?? 'Saving…') : 'Upload your own source'}
                  </span>
                  <span className="gl-home-hero-tile__arrow">→</span>
                  <input
                    ref={emptyFileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: source rows ── */}
      <aside className="gl-home-rows" aria-label="Your sources">
        {/* Upload button — always pinned to top */}
        <button
          type="button"
          className="gl-home-upload-btn"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload a new source"
        >
          {isUploading ? (
            <Loader2 size={13} className="gl-home-upload-btn__spinner" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">↑</span>
          )}
          {isUploading ? (uploadProgress ?? 'Saving…') : '+ Upload new source'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFile}
          aria-hidden="true"
        />

        {/* Upload error */}
        {uploadError && (
          <div className="gl-home-upload-error" role="alert">
            <p>{uploadError}</p>
            <button type="button" onClick={onClearError} aria-label="Dismiss error">
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* GlobalLab subjects */}
        <section className="gl-home-section">
          <p className="gl-home-section__label">GlobalLab subjects</p>
          {availableSubjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              className={`gl-home-row gl-home-row--subject${
                activeSubject?.id === subject.id ? ' gl-home-row--active' : ''
              }`}
              aria-current={activeSubject?.id === subject.id ? 'page' : undefined}
              onClick={() => onSelectSubject(subject)}
            >
              <span
                className="gl-home-row__accent"
                style={{ background: subjectColor(subject.id) }}
                aria-hidden="true"
              />
              <span className="gl-home-row__title">{subject.title}</span>
              <span className="gl-home-row__meta">{subject.topics.length} topics</span>
              <span className="gl-home-row__arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </section>

        {/* Uploaded books (last 3) */}
        {recentBooks.length > 0 && (
          <section className="gl-home-section">
            <p className="gl-home-section__label">Your sources</p>
            {recentBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                className="gl-home-row gl-home-row--book"
                onClick={() => onSelectBook(book)}
                aria-label={book.title}
              >
                <span
                  className="gl-home-row__accent gl-home-row__accent--book"
                  aria-hidden="true"
                />
                <span className="gl-home-row__title">{book.title}</span>
                <span className="gl-home-row__meta">
                  {(book.fileExtension ?? book.fileType).toUpperCase()}
                </span>
                <span className="gl-home-row__arrow" aria-hidden="true">→</span>
              </button>
            ))}
            {books.length > 3 && (
              <button
                type="button"
                className="gl-home-see-all"
                onClick={onOpenLibrary}
              >
                See all {books.length} sources →
              </button>
            )}
          </section>
        )}

        {/* Prompt to open library when no uploads */}
        {books.length === 0 && (
          <button
            type="button"
            className="gl-home-see-all gl-home-see-all--library"
            onClick={onOpenLibrary}
          >
            Browse full library →
          </button>
        )}
      </aside>
    </main>
  )
}
