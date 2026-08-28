import { Moon, Pencil, Sun } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { LearnerControlPanel } from './components/LearnerControlPanel'
import { HomePage } from './components/HomePage'
import { LibraryPage } from './components/LibraryPage'
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

const RECENT_SUBJECT_STORAGE_KEY = 'gl_recent_subject'

function getInitialHomeSubjectId(): string | null {
  const firstAvailableSubject = subjects.find((subject) => !subject.comingSoon)

  if (typeof window === 'undefined') return firstAvailableSubject?.id ?? null

  try {
    const storedSubjectId = window.localStorage.getItem(RECENT_SUBJECT_STORAGE_KEY)
    const storedSubjectIsAvailable = subjects.some(
      (subject) => subject.id === storedSubjectId && !subject.comingSoon,
    )

    return storedSubjectIsAvailable
      ? storedSubjectId
      : firstAvailableSubject?.id ?? null
  } catch {
    return firstAvailableSubject?.id ?? null
  }
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
  isLibraryOpen: boolean
  onSaveProfile: (interest: string) => void
  onToggleDark: () => void
  onHome: () => void
  onOpenLibrary: () => void
}

function SiteHeader({
  profile,
  learnerModel,
  isDark,
  isLibraryOpen,
  onSaveProfile,
  onToggleDark,
  onHome,
  onOpenLibrary,
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
        <span className="brand-name">GlobalLab</span>
      </button>

      <nav className="site-nav" aria-label="Main navigation">
        <button
          type="button"
          className="site-nav-link"
          aria-current={!isLibraryOpen ? 'page' : undefined}
          onClick={onHome}
        >
          Home
        </button>
        <button
          type="button"
          className="site-nav-link"
          aria-current={isLibraryOpen ? 'page' : undefined}
          onClick={onOpenLibrary}
        >
          Library
        </button>
      </nav>

      <div className="site-header-right">
        <div className="profile-menu">
          <button
            type="button"
            className="lens-pill"
            aria-expanded={isEditing}
            onClick={() => setIsEditing((current) => !current)}
          >
            <span className="lens-pill__interest">{profile.interest}</span>
            <span className="lens-pill__label">lens</span>
            <Pencil size={11} aria-hidden="true" />
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
      </div>
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
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [homeSubjectId, setHomeSubjectId] = useState<string | null>(
    getInitialHomeSubjectId,
  )

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
    setIsLibraryOpen(false)
  }

  const openLibrary = () => {
    setIsLibraryOpen(true)
    setActiveTopic(null)
    setActiveSubject(null)
    setActiveUserBook(null)
  }

  const rememberSubject = (subject: Subject) => {
    setHomeSubjectId(subject.id)
    try {
      window.localStorage.setItem(RECENT_SUBJECT_STORAGE_KEY, subject.id)
    } catch {
      // The visual fallback still works when storage is unavailable.
    }
  }

  const selectSubject = (subject: Subject) => {
    if (subject.comingSoon) return
    rememberSubject(subject)
    transitionView(() => {
      setActiveTopic(null)
      setActiveSubject(subject)
      setActiveUserBook(null)
      setIsLibraryOpen(false)
    })
  }

  const selectUserBook = (book: UserBook) => {
    transitionView(() => {
      setActiveSubject(null)
      setActiveTopic(null)
      setActiveUserBook(book)
      setIsLibraryOpen(false)
    })
  }

  const selectGlobalTopic = (
    topic: KnowledgeTopic,
    subject: Subject,
  ) => {
    if (subject.comingSoon) return
    rememberSubject(subject)
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

  // ── Kitabi reader (chapter TOC + section reader) ──
  if (activeSubject && !activeTopic) {
    return (
      <div className='app-shell gl-premium'>
        <a className='skip-link' href='#main-content'>Skip to content</a>
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
      </div>
    )
  }

  if (activeSubject && activeTopic) {
    return (
      <div className='app-shell gl-premium'>
        <a className='skip-link' href='#main-content'>Skip to content</a>
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
      </div>
    )
  }

  // ── Home / Library ──
  return (
    <div className='app-shell gl-premium gl-home-shell'>
      <a className='skip-link' href='#main-content'>
        Skip to content
      </a>
      <SiteHeader
        profile={profile}
        learnerModel={learnerModel}
        isDark={isDark}
        isLibraryOpen={isLibraryOpen}
        onSaveProfile={updateInterest}
        onToggleDark={toggleDark}
        onHome={goHome}
        onOpenLibrary={openLibrary}
      />

      {isLibraryOpen ? (
        <LibraryPage
          subjects={subjects}
          books={books}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          onSelectSubject={selectSubject}
          onSelectBook={selectUserBook}
          onUpload={(file) => void addBook(file)}
          onRemoveBook={removeBook}
          onClearError={clearError}
          onBack={goHome}
        />
      ) : (
        <HomePage
          subjects={subjects}
          books={books}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          activeSubjectId={homeSubjectId}
          onSelectSubject={selectSubject}
          onSelectBook={selectUserBook}
          onUpload={(file) => void addBook(file)}
          onOpenLibrary={openLibrary}
          onClearError={clearError}
        />
      )}

      <footer className="site-footer">
        <p>Read first. Personalize where it matters.</p>
      </footer>
    </div>
  )
}

export default App
