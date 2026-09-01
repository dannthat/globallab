import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  BookOpenText,
  Clock3,
  FileText,
  FlaskConical,
  Layers,
  Loader2,
  Microscope,
  Plus,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { Subject, UserBook } from '../types'

const SUBJECT_META: Record<string, { color: string; soft: string }> = {
  biology: { color: '#0d8267', soft: '#dff3eb' },
  physics: { color: '#2878c8', soft: '#e4effa' },
  chemistry: { color: '#7c4cc9', soft: '#eee8fa' },
  mathematics: { color: '#c77a21', soft: '#f8ecd9' },
}

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  biology: Microscope,
  chemistry: FlaskConical,
  physics: Layers,
  mathematics: Layers,
}

function subjectMeta(id: string) {
  return SUBJECT_META[id] ?? { color: '#6f716f', soft: '#ececea' }
}

function SubjectIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = SUBJECT_ICONS[id] ?? BookOpen
  return <Icon size={size} aria-hidden="true" />
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const activeSubject = activeSubjectId
    ? subjects.find((subject) => subject.id === activeSubjectId) ?? null
    : subjects.find((subject) => !subject.comingSoon) ?? null
  const activeMeta = activeSubject ? subjectMeta(activeSubject.id) : subjectMeta('neutral')
  const recentBooks = books.slice(0, 4)
  const featuredTopic = activeSubject?.topics[0] ?? null
  const chapterCount = activeSubject?.topics.length ?? 0

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <main className="glw-home" id="main-content">
      <div className="glw-ambient glw-ambient--home" aria-hidden="true" />

      {uploadError && (
        <div className="glw-alert glw-alert--error" role="alert">
          <span>{uploadError}</span>
          <button type="button" onClick={onClearError} aria-label="Dismiss upload error"><X size={15} aria-hidden="true" /></button>
        </div>
      )}

      <header className="glw-page-heading glw-enter">
        <div>
          <p className="glw-eyebrow"><Sparkles size={13} aria-hidden="true" /> Your learning workspace</p>
          <h1>What do you want to make click today?</h1>
          <p>Continue a lesson, reopen a source, or bring in something new.</p>
        </div>
        <button type="button" className="glw-button glw-button--primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 size={16} className="glw-spin" aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
          {isUploading ? (uploadProgress ?? 'Saving source…') : 'Upload source'}
        </button>
        <input ref={fileInputRef} type="file" hidden onChange={handleFile} />
      </header>

      <section className="glw-home-focus glw-enter glw-enter--delay-1" aria-label="Continue learning">
        {activeSubject ? (
          <article
            className="glw-continue-card glw-interactive-card"
            style={{ '--subject': activeMeta.color, '--subject-soft': activeMeta.soft } as React.CSSProperties}
          >
            <div className="glw-continue-card__aurora" aria-hidden="true" />
            <header>
              <span className="glw-status-chip"><span /> In progress</span>
              <span>{chapterCount} chapters</span>
            </header>
            <div className="glw-continue-card__body">
              <span className="glw-continue-card__icon"><SubjectIcon id={activeSubject.id} size={26} /></span>
              <div>
                <p>Continue learning</p>
                <h2>{activeSubject.title}</h2>
                <h3>{featuredTopic?.title ?? 'Open your subject guide'}</h3>
                <p className="glw-continue-card__description">
                  {featuredTopic?.subtitle ?? activeSubject.description}
                </p>
              </div>
            </div>
            <footer>
              <div className="glw-progress" aria-label={`Chapter 1 of ${chapterCount}`}>
                <span><i style={{ width: `${chapterCount ? Math.max(12, 100 / chapterCount) : 0}%` }} /></span>
                <small>Chapter 01 of {String(chapterCount).padStart(2, '0')}</small>
              </div>
              <button type="button" className="glw-button glw-button--light" onClick={() => onSelectSubject(activeSubject)}>
                Continue {activeSubject.title} <ArrowRight size={16} aria-hidden="true" />
              </button>
            </footer>
          </article>
        ) : (
          <article className="glw-continue-card glw-continue-card--empty">
            <BookOpen size={28} aria-hidden="true" />
            <h2>Choose your first subject</h2>
            <p>Your latest lesson will stay ready here.</p>
          </article>
        )}

        <aside className="glw-quick-start">
          <div className="glw-quick-start__beam" aria-hidden="true" />
          <span className="glw-quick-start__icon"><WandSparkles size={21} aria-hidden="true" /></span>
          <p className="glw-eyebrow">Start from your material</p>
          <h2>Drop in what you are already studying.</h2>
          <p>GlobalLab keeps the original source intact and places help beside it.</p>
          <button type="button" className="glw-button glw-button--secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Plus size={15} aria-hidden="true" /> Add a source
          </button>
          <small>PDF, documents, slides, images, code, and more</small>
        </aside>
      </section>

      <section className="glw-home-section glw-enter glw-enter--delay-2" aria-labelledby="recent-heading">
        <header className="glw-home-section__head">
          <div><Clock3 size={16} aria-hidden="true" /><h2 id="recent-heading">Recent sources</h2><span>{books.length}</span></div>
          <button type="button" className="glw-text-button" onClick={onOpenLibrary}>View library <ArrowRight size={14} aria-hidden="true" /></button>
        </header>

        {recentBooks.length > 0 ? (
          <div className="glw-recent-grid">
            {recentBooks.map((book) => (
              <button key={book.id} type="button" className="glw-source-row glw-interactive-card" onClick={() => onSelectBook(book)}>
                <span className="glw-source-row__thumb" style={{ '--file-color': book.color } as React.CSSProperties}>
                  <FileText size={18} aria-hidden="true" />
                  <small>{(book.fileExtension || book.fileType).slice(0, 4).toUpperCase()}</small>
                </span>
                <span className="glw-source-row__copy">
                  <strong>{book.title}</strong>
                  <small>{formatFileSize(book.fileSize) || book.previewKind} · Added {new Date(book.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                </span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="glw-source-row glw-source-row--add" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <span className="glw-source-row__thumb"><Plus size={18} aria-hidden="true" /></span>
              <span className="glw-source-row__copy"><strong>Add another source</strong><small>Keep everything you study in one place</small></span>
            </button>
          </div>
        ) : (
          <button type="button" className="glw-recent-empty" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <span><Upload size={22} aria-hidden="true" /></span>
            <strong>Your uploaded sources will live here</strong>
            <small>Add a file to reopen it without hunting through folders.</small>
          </button>
        )}
      </section>

      <section className="glw-home-section glw-enter glw-enter--delay-3" aria-labelledby="subjects-heading">
        <header className="glw-home-section__head">
          <div><BookOpenText size={16} aria-hidden="true" /><h2 id="subjects-heading">Explore subjects</h2></div>
          <span className="glw-section-note">Scientist-grounded starting points</span>
        </header>
        <div className="glw-subject-grid">
          {subjects.map((subject, index) => {
            const meta = subjectMeta(subject.id)
            const isActive = activeSubject?.id === subject.id
            return (
              <button
                key={subject.id}
                type="button"
                className={`glw-subject-card glw-interactive-card${isActive ? ' is-active' : ''}`}
                style={{ '--subject': meta.color, '--subject-soft': meta.soft, '--delay': `${index * 45}ms` } as React.CSSProperties}
                onClick={() => onSelectSubject(subject)}
                disabled={subject.comingSoon === true}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${subject.title}${subject.comingSoon ? ' — coming soon' : ''}`}
              >
                <span className="glw-subject-card__light" aria-hidden="true" />
                <span className="glw-subject-card__icon"><SubjectIcon id={subject.id} size={21} /></span>
                <span className="glw-subject-card__copy"><strong>{subject.title}</strong><small>{subject.comingSoon ? 'Coming soon' : `${subject.topics.length} guided topics`}</small></span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </section>

      <p className="glw-provenance"><BookOpenCheck size={13} aria-hidden="true" /> Original text stays unchanged. Personalized help appears beside it.</p>
    </main>
  )
}
