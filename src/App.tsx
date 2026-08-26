import { BookOpen, FlaskConical, Moon, Pencil, ShieldCheck, Sun } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { LearnerControlPanel } from './components/LearnerControlPanel'
import { LibraryShelf } from './components/LibraryShelf'
import { OnboardingFlow } from './components/OnboardingFlow'
import { UserBookReader } from './components/UserBookReader'
import {
  LEARNING_COMPANION_CACHE_KEYS,
  useLearnYourWay,
} from './hooks/useLearnYourWay'
import { useLearnerModel } from './hooks/useLearnerModel'
import { useStudentProfile } from './hooks/useStudentProfile'
import { useUserLibrary } from './hooks/useUserLibrary'
import { subjects } from './knowledge'
import type { PersonalizationMode } from './personalization/types'
import type { KnowledgeSection, KnowledgeTopic, StudentProfile, Subject, UserBook } from './types'

const SUBJECT_COLORS: Record<string, string> = {
  biology: '#0D8267',
  physics: '#1A6FC4',
  chemistry: '#8338EC',
  mathematics: '#C87B1A',
}

const LazyKitabiPage = lazy(() =>
  import('./components/KitabiPage').then((module) => ({
    default: module.KitabiPage,
  })),
)

const LazyBookContents = lazy(() =>
  import('./components/BookContents').then((module) => ({
    default: module.BookContents,
  })),
)

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>
  }
}

function transitionView(update: () => void) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const transition = (document as ViewTransitionDocument).startViewTransition

  if (!transition || reducedMotion) {
    update()
    return
  }

  transition.call(document, () => {
    flushSync(update)
  })
}

type LearnerModelController = ReturnType<typeof useLearnerModel>

interface SiteHeaderProps {
  profile: StudentProfile
  learnerModel: LearnerModelController
  isDark: boolean
  onSaveProfile: (interest: string) => void
  onToggleDark: () => void
  onHome: () => void
}

function SiteHeader({
  profile,
  learnerModel,
  isDark,
  onSaveProfile,
  onToggleDark,
  onHome,
}: SiteHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(profile.interest)

  const saveInterest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = draft.trim().replace(/\s+/g, ' ')
    if (!normalized) return
    setDraft(normalized)
    onSaveProfile(normalized)
    setIsEditing(false)
  }

  const resetLearningData = () => {
    learnerModel.reset()
    if (typeof window === 'undefined') return
    for (const key of LEARNING_COMPANION_CACHE_KEYS) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // The in-memory learner model is still reset when storage is blocked.
      }
    }
  }

  return (
    <header className="site-header">
      <button type="button" className="brand" onClick={onHome} aria-label="Global Lab home">
        <span className="brand-mark" aria-hidden="true">
          <FlaskConical size={21} strokeWidth={2.2} />
        </span>
        <span>
          <span className="brand-name">Global Lab</span>
          <span className="brand-subtitle">Your STEM companion</span>
        </span>
      </button>

      <div className="profile-menu">
        <button
          type="button"
          className="profile-chip"
          aria-expanded={isEditing}
          onClick={() => setIsEditing((current) => !current)}
        >
          <span className="profile-chip-label">Your lens</span>
          <span className="profile-chip-interest">{profile.interest}</span>
          <Pencil size={12} aria-hidden="true" />
        </button>

        {isEditing && (
          <form className="profile-popover animate-reveal" onSubmit={saveInterest}>
            <label className="field-label" htmlFor="edit-interest">
              Update your interest
            </label>
            <input
              id="edit-interest"
              className="profile-input"
              value={draft}
              maxLength={60}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="profile-popover-actions">
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" disabled={!draft.trim()}>
                Save
              </button>
            </div>
          </form>
        )}
      </div>

      <LearnerControlPanel
        approvedPresentation={learnerModel.approvedPresentation}
        dueReviews={learnerModel.dueReviews}
        evidenceCount={learnerModel.state.evidence.length}
        onSetPreference={learnerModel.setExplicitPreference}
        onClearPreference={learnerModel.clearPreference}
        onExport={learnerModel.exportState}
        onReset={resetLearningData}
      />

      <button
        type='button'
        className='site-theme-toggle'
        onClick={onToggleDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? (
          <Sun size={17} aria-hidden='true' />
        ) : (
          <Moon size={17} aria-hidden='true' />
        )}
      </button>
    </header>
  )
}

interface ActiveKitabiProps {
  topic: KnowledgeTopic
  subject: Subject
  profile: StudentProfile
  isDark: boolean
  learnerModel: LearnerModelController
  onToggleDark: () => void
  onSaveInterest: (interest: string) => void
  onSelectTopic: (topic: KnowledgeTopic, subject: Subject) => void
  onBack: () => void
}

function ActiveKitabi({
  topic,
  subject,
  profile,
  isDark,
  learnerModel,
  onToggleDark,
  onSaveInterest,
  onSelectTopic,
  onBack,
}: ActiveKitabiProps) {
  const {
    approvedPresentation,
    pendingSuggestions,
    recordRefinement,
    recordHelpful,
    recordQuiz,
    acceptSuggestion,
    notNow,
    neverSuggest,
  } = learnerModel
  const {
    rewrites,
    loadingSectionId,
    error,
    errorSectionId,
    learn,
    clearRewrite,
    getRewrite,
  } = useLearnYourWay(topic, approvedPresentation)

  const handleLearn = (section: KnowledgeSection) => {
    void learn(section, profile, { approvedPresentation })
  }

  const handleRefine = (
    section: KnowledgeSection,
    mode: PersonalizationMode,
  ) => {
    const activeRewrite = getRewrite(section.id, profile.interest)
    if (activeRewrite) {
      recordRefinement(activeRewrite.source, mode)
    }
    void learn(section, profile, { mode, approvedPresentation })
  }

  return (
    <Suspense
      fallback={
        <main className='ubr-lazy-loading' id='main-content' role='status'>
          <span className='ubr-loading-spinner' aria-hidden='true' />
          <p>Opening your Global Lab textbook...</p>
        </main>
      }
    >
      <LazyKitabiPage
        topic={topic}
        subject={subject}
        subjectColor={SUBJECT_COLORS[subject.id] ?? SUBJECT_COLORS.biology}
        profile={profile}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onSaveInterest={onSaveInterest}
        rewrites={rewrites}
        loadingSectionId={loadingSectionId}
        error={error}
        errorSectionId={errorSectionId}
        onLearnYourWay={handleLearn}
        onRefine={handleRefine}
        onOutcome={(rewrite, outcome) => {
          if (outcome === 'unknown') return
          recordHelpful(
            rewrite.source,
            rewrite.mode,
            outcome === 'successful',
          )
        }}
        onQuizResult={(rewrite, score, total) => {
          recordQuiz(rewrite.source, score, total, rewrite.mode)
        }}
        onClearRewrite={(sectionId) => clearRewrite(sectionId, profile.interest)}
        preferenceSuggestion={pendingSuggestions[0] ?? null}
        onApplySuggestion={acceptSuggestion}
        onDeferSuggestion={notNow}
        onNeverSuggest={neverSuggest}
        onSelectTopic={onSelectTopic}
        onBack={onBack}
      />
    </Suspense>
  )
}

function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('gl_dark') === '1'
  })
  const { profile, hasProfile, saveProfile } = useStudentProfile()
  const learnerModel = useLearnerModel()
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null)
  const [activeTopic, setActiveTopic] = useState<KnowledgeTopic | null>(null)
  const [activeUserBook, setActiveUserBook] = useState<UserBook | null>(null)

  const {
    books,
    isUploading,
    uploadError,
    uploadProgress,
    addBook,
    removeBook,
    clearError,
  } = useUserLibrary()

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : ''
    localStorage.setItem('gl_dark', isDark ? '1' : '0')
  }, [isDark])

  const toggleDark = () => setIsDark((dark) => !dark)

  if (!hasProfile || !profile) {
    return (
      <OnboardingFlow
        onComplete={(interest, gradeLevel) => saveProfile({ interest, gradeLevel })}
      />
    )
  }

  const goHome = () => {
    setActiveTopic(null)
    setActiveSubject(null)
    setActiveUserBook(null)
  }

  const selectSubject = (subject: Subject) => {
    if (subject.comingSoon) return
    transitionView(() => {
      setActiveTopic(null)
      setActiveSubject(subject)
      setActiveUserBook(null)
    })
  }

  const selectUserBook = (book: UserBook) => {
    transitionView(() => {
      setActiveSubject(null)
      setActiveTopic(null)
      setActiveUserBook(book)
    })
  }

  const selectGlobalTopic = (
    topic: KnowledgeTopic,
    subject: Subject,
  ) => {
    if (subject.comingSoon) return
    transitionView(() => {
      setActiveUserBook(null)
      setActiveSubject(subject)
      setActiveTopic(topic)
    })
  }

  const updateInterest = (interest: string) => {
    saveProfile({ interest, gradeLevel: profile.gradeLevel })
  }

  // ── User book reader ──
  if (activeUserBook) {
    return (
      <div className='app-shell gl-premium gl-premium-upload-reader'>
        <a className='skip-link' href='#main-content'>
          Skip to source
        </a>
        <UserBookReader
          book={activeUserBook}
          profile={profile}
          learnerModel={learnerModel}
          isDark={isDark}
          onToggleDark={toggleDark}
          onBack={() =>
            transitionView(() => setActiveUserBook(null))
          }
          onRemove={(id) => {
            removeBook(id)
            setActiveUserBook(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className='app-shell gl-premium'>
      <a className='skip-link' href='#main-content'>
        Skip to content
      </a>
      {/* Header only on landing page */}
      {!activeTopic && !activeSubject && (
        <SiteHeader
          profile={profile}
          learnerModel={learnerModel}
          isDark={isDark}
          onSaveProfile={updateInterest}
          onToggleDark={toggleDark}
          onHome={goHome}
        />
      )}

      {/* Landing — library shelf */}
      {!activeSubject && (
        <main className="library-page" id="main-content">
          <section className="library-hero">
            <div className="library-hero-copy">
              <p className='library-eyebrow'>Personal learning library</p>
              <h1 className='library-title' aria-label='Your STEM Library'>
                <span className='sr-only'>Your STEM Library</span>
                A library that learns <em>how you learn.</em>
              </h1>
              <p className='library-copy'>
                Open a source-cited Global Lab textbook or place your own source
                on the shelf. Every original stays intact. Your private learning
                companion appears only when you ask for it.
              </p>
            </div>
            <aside className='library-hero-ledger' aria-label='Library summary'>
              <p className='library-ledger-label'>Your reading room</p>
              <div className='library-ledger-stat'>
                <BookOpen size={18} aria-hidden='true' />
                <span>
                  <strong>{subjects.filter((subject) => !subject.comingSoon).length}</strong>
                  live Global Lab volume
                </span>
              </div>
              <div className='library-ledger-stat'>
                <ShieldCheck size={18} aria-hidden='true' />
                <span>
                  <strong>{books.length}</strong>
                  {books.length === 1 ? ' source' : ' sources'} stored in this browser
                </span>
              </div>
              <p className='library-ledger-note'>
                Original text first. Personalization only on request.
              </p>
            </aside>
          </section>
          <LibraryShelf
            subjects={subjects}
            books={books}
            isUploading={isUploading}
            uploadError={uploadError}
            uploadProgress={uploadProgress}
            onSelect={selectSubject}
            onUpload={(file) => void addBook(file)}
            onSelectBook={selectUserBook}
            onRemoveBook={removeBook}
            onClearError={clearError}
          />
        </main>
      )}

      {/* Chapter TOC */}
      {activeSubject && !activeTopic && (
        <Suspense
          fallback={
            <main className='ubr-lazy-loading' id='main-content' role='status'>
              <span className='ubr-loading-spinner' aria-hidden='true' />
              <p>Opening the table of contents...</p>
            </main>
          }
        >
          <LazyBookContents
            subject={activeSubject}
            subjectColor={SUBJECT_COLORS[activeSubject.id] ?? SUBJECT_COLORS.biology}
            onSelectTopic={(topic) =>
              transitionView(() => setActiveTopic(topic))
            }
            onBack={() => transitionView(goHome)}
          />
        </Suspense>
      )}

      {/* Kitabi reader */}
      {activeSubject && activeTopic && (
        <ActiveKitabi
          key={activeSubject.id + ':' + activeTopic.id}
          topic={activeTopic}
          subject={activeSubject}
          profile={profile}
          isDark={isDark}
          learnerModel={learnerModel}
          onToggleDark={toggleDark}
          onSaveInterest={updateInterest}
          onSelectTopic={selectGlobalTopic}
          onBack={() =>
            transitionView(() => setActiveTopic(null))
          }
        />
      )}

      {/* Footer only on landing */}
      {!activeTopic && !activeSubject && (
        <footer className="site-footer">
          <div className="footer-mark" aria-hidden="true">
            <FlaskConical size={15} />
          </div>
          <p>Read first. Personalize where it matters.</p>
        </footer>
      )}
    </div>
  )
}

export default App
