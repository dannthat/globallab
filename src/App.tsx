import {
  Home,
  Library,
  Moon,
  Pencil,
  Sun,
  WandSparkles,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { LearnerControlPanel } from './components/LearnerControlPanel'
import { HomePage } from './components/HomePage'
import { LandingPage } from './components/LandingPage'
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
import type {
  PersonalizationMode,
  SourceAnchor,
  SourceExcerpt,
} from './personalization/types'
import type { KnowledgeSection, KnowledgeTopic, StudentProfile, Subject, UserBook } from './types'

const SUBJECT_COLORS: Record<string, string> = {
  biology: '#0D8267',
  physics: '#1A6FC4',
  chemistry: '#8338EC',
  mathematics: '#C87B1A',
}

const RECENT_SUBJECT_STORAGE_KEY = 'gl_recent_subject'

type AppRoute = 'landing' | 'onboarding' | 'home' | 'library'

function routeFromLocation(hasProfile: boolean): AppRoute {
  if (typeof window === 'undefined') return hasProfile ? 'home' : 'landing'
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/welcome') return 'landing'
  if (path === '/onboarding') return hasProfile ? 'home' : 'onboarding'
  if (path === '/library') return hasProfile ? 'library' : 'landing'
  if (path === '/home') return hasProfile ? 'home' : 'landing'
  return hasProfile ? 'home' : 'landing'
}

function routePath(route: AppRoute) {
  if (route === 'landing') return '/welcome'
  if (route === 'onboarding') return '/onboarding'
  if (route === 'library') return '/library'
  return '/home'
}

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

function GlobalLearnerControls({
  learnerModel,
  profile,
  onUpdateProfile,
  onOpenSource,
}: {
  learnerModel: LearnerModelController
  profile: StudentProfile
  onUpdateProfile: (profile: Omit<StudentProfile, 'createdAt'>) => void
  onOpenSource?: (anchor: SourceAnchor) => void
}) {
  const sourceDataMap = new Map<
    string,
    {
      sourceId: string
      sourceTitle: string
      sourceKind: SourceAnchor['sourceKind']
      evidenceCount: number
    }
  >()
  learnerModel.state.evidence.forEach((event) => {
    const previous = sourceDataMap.get(event.anchor.sourceId)
    sourceDataMap.set(event.anchor.sourceId, {
      sourceId: event.anchor.sourceId,
      sourceTitle: event.anchor.sourceTitle,
      sourceKind: event.anchor.sourceKind,
      evidenceCount: (previous?.evidenceCount ?? 0) + 1,
    })
  })
  const sourceData = [...sourceDataMap.values()].sort((left, right) =>
    left.sourceTitle.localeCompare(right.sourceTitle),
  )
  const activeCrossSourcePermissions = learnerModel.state.crossSourcePermissions.filter(
    (permission) => !permission.revokedAt,
  )
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
    <LearnerControlPanel
      studentProfile={profile}
      approvedPresentation={learnerModel.approvedPresentation}
      dueReviews={learnerModel.dueReviews}
      evidenceCount={learnerModel.state.evidence.length}
      understandingClaims={learnerModel.understandingClaims}
      masteryMap={learnerModel.livingMasteryMap}
      sourceData={sourceData}
      crossSourcePermissions={activeCrossSourcePermissions}
      onSetPreference={learnerModel.setExplicitPreference}
      onClearPreference={learnerModel.clearPreference}
      onExport={learnerModel.exportState}
      onReset={resetLearningData}
      onDecideClaim={learnerModel.decideUnderstandingClaim}
      onOpenReview={onOpenSource}
      onDeleteSourceData={learnerModel.deleteSourceData}
      onRevokeCrossSourcePermission={learnerModel.revokeCrossSourcePermission}
      onUpdateStudentProfile={onUpdateProfile}
    />
  )
}

interface SiteHeaderProps {
  profile: StudentProfile
  learnerModel: LearnerModelController
  isDark: boolean
  isLibraryOpen: boolean
  onSaveProfile: (interest: string) => void
  onUpdateProfile: (profile: Omit<StudentProfile, 'createdAt'>) => void
  onToggleDark: () => void
  onHome: () => void
  onOpenLibrary: () => void
  onOpenLearningSource?: (anchor: SourceAnchor) => void
}

function SiteHeader({
  profile,
  learnerModel,
  isDark,
  isLibraryOpen,
  onSaveProfile,
  onUpdateProfile,
  onToggleDark,
  onHome,
  onOpenLibrary,
  onOpenLearningSource,
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

  return (
    <header className="site-header glw-site-header">
      <div className="glw-site-header__inner">
      <button type="button" className="brand" onClick={onHome} aria-label="Global Lab home">
        <span className="glw-brand-mark" aria-hidden="true">GL</span>
        <span className="glw-brand-copy">
          <span className="brand-name">GlobalLab</span>
          <small>Learning workspace</small>
        </span>
      </button>

      <nav className="site-nav" aria-label="Main navigation">
        <button
          type="button"
          className="site-nav-link"
          aria-current={!isLibraryOpen ? 'page' : undefined}
          onClick={onHome}
        >
          <Home size={15} aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          type="button"
          className="site-nav-link"
          aria-current={isLibraryOpen ? 'page' : undefined}
          onClick={onOpenLibrary}
        >
          <Library size={15} aria-hidden="true" />
          <span>Library</span>
        </button>
      </nav>

      <div className="site-header-right">
        <div className="profile-menu">
          <button
            type="button"
            className="lens-pill"
            aria-expanded={isEditing}
            aria-label={'Your learning lens is ' + profile.interest + '. Edit lens.'}
            onClick={() => setIsEditing((current) => !current)}
          >
            <WandSparkles size={14} aria-hidden="true" />
            <span className="lens-pill__label">Your lens</span>
            <span className="lens-pill__interest">{profile.interest}</span>
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

        <GlobalLearnerControls
          learnerModel={learnerModel}
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onOpenSource={onOpenLearningSource}
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
  sourceJump?: SourceAnchor | null
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
  sourceJump,
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
    recordTutorAttempt,
    recordTutorHint,
    recordTeachKoji,
    recordPredictionCycle,
    hasCrossSourcePermission,
    setCrossSourcePermission,
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

  const handleLearn = (section: KnowledgeSection, excerpt?: string) => {
    const selectedText = excerpt?.trim()
    const excerptPayload = selectedText
      ? {
          anchor: {
            sourceId: topic.id,
            sourceKind: 'global-lab' as const,
            sourceTitle: topic.source?.name ?? topic.id,
            anchorId: section.id,
            anchorLabel: section.heading,
            url: topic.source?.url,
            license: topic.source?.license,
          },
          text: selectedText,
        }
      : undefined
    void learn(section, profile, {
      approvedPresentation,
      excerpt: excerptPayload,
      isUserSelection: Boolean(excerptPayload),
    })
  }

  const handleRefine = (
    section: KnowledgeSection,
    mode: PersonalizationMode,
  ) => {
    const activeRewrite = getRewrite(section.id, profile.interest)
    if (activeRewrite) {
      recordRefinement(activeRewrite.source, mode)
    }
    const selectedExcerpt =
      activeRewrite?.scope === 'selection' ? activeRewrite.excerpt : undefined
    void learn(section, profile, {
      mode,
      approvedPresentation,
      excerpt: selectedExcerpt,
      isUserSelection: Boolean(selectedExcerpt),
    })
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
        initialSectionId={
          sourceJump?.sourceKind === 'global-lab' &&
          sourceJump.sourceId === topic.id
            ? sourceJump.anchorId
            : undefined
        }
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
        approvedPresentation={approvedPresentation}
        onTutorAttempt={(rewrite, attempt) => {
          recordTutorAttempt(rewrite.source, rewrite.mode, {
            phase: attempt.phase,
            activityKind: attempt.activityKind,
            correct: attempt.correct,
            independent: attempt.independent,
            hintsUsed: attempt.hintsUsed,
            revealed: attempt.revealed,
            skillTag: attempt.skillTag,
            misconceptionTags: attempt.misconceptionTags,
            sessionId: attempt.sessionId,
            turnId: attempt.turnId,
            responseSummary: attempt.responseSummary,
            coverage: attempt.coverage,
          })
        }}
        onTutorHint={(rewrite, phase, revealed) => {
          recordTutorHint(
            rewrite.source,
            rewrite.mode,
            { phase, revealed },
            revealed,
          )
        }}
        onTutorIntent={(rewrite, mode) => {
          recordRefinement(rewrite.source, mode)
        }}
        onTeachKojiCheck={(rewrite, check, turn) => {
          recordTeachKoji(rewrite.source, rewrite.mode, {
            phase: turn.phase,
            correct: check.coverage === 'complete',
            independent: false,
            skillTag: turn.skillTags[0] ?? rewrite.source.anchorLabel,
            misconceptionTags: turn.misconceptionTags,
            sessionId: rewrite.sectionId + ':' + rewrite.generatedAt,
            turnId: turn.id,
            coverage: check.coverage,
            sourceQuotes: [check.evidenceQuote],
            responseSummary: turn.message.slice(0, 500),
          })
        }}
        onPredictionCycleComplete={(rewrite, cycle) => {
          if (
            !cycle.prediction ||
            !cycle.observation ||
            !cycle.revision ||
            cycle.accurate === undefined
          ) return
          recordPredictionCycle(rewrite.source, rewrite.mode, {
            phase: 'transfer',
            correct: cycle.accurate,
            independent: true,
            skillTag: rewrite.source.anchorLabel,
            sessionId: rewrite.sectionId + ':' + rewrite.generatedAt,
            predictionCycle: {
              prediction: cycle.prediction,
              observation: JSON.stringify(cycle.observation.outputs),
              revision: cycle.revision,
              accurate: cycle.accurate,
            },
          })
        }}
        isCrossSourceAllowed={(primary, secondary) =>
          hasCrossSourcePermission(primary.anchor, secondary.anchor)
        }
        onCrossSourcePermissionChange={(
          primary: SourceExcerpt,
          secondary: SourceExcerpt,
          allowed: boolean,
        ) => {
          setCrossSourcePermission(primary.anchor, secondary.anchor, allowed)
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
  const [learningSourceJump, setLearningSourceJump] = useState<SourceAnchor | null>(null)
  const [route, setRoute] = useState<AppRoute>(() => routeFromLocation(hasProfile))
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

  const navigateRoute = (nextRoute: AppRoute, replace = false) => {
    const nextPath = routePath(nextRoute)
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    }
    setRoute(nextRoute)
  }

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = routeFromLocation(Boolean(profile))
      setRoute(nextRoute)
      if (nextRoute !== 'onboarding') {
        setActiveTopic(null)
        setActiveSubject(null)
        setActiveUserBook(null)
      }
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [profile])

  if (route === 'landing') {
    return (
      <div className='app-shell glw-public-shell'>
        <a className='skip-link' href='#top'>Skip to content</a>
        <LandingPage
          hasProfile={hasProfile}
          isDark={isDark}
          onToggleDark={toggleDark}
          onStart={() => navigateRoute(hasProfile ? 'home' : 'onboarding')}
          onOpenLibrary={() => navigateRoute(hasProfile ? 'library' : 'onboarding')}
        />
      </div>
    )
  }

  if (!hasProfile || !profile) {
    return (
      <OnboardingFlow
        onComplete={(nextProfile, destination) => {
          saveProfile(nextProfile)
          navigateRoute(destination === 'library' ? 'library' : 'home')
        }}
        onUpload={(nextProfile, file) => {
          saveProfile(nextProfile)
          navigateRoute('library')
          void addBook(file)
        }}
      />
    )
  }

  const goHome = () => {
    setActiveTopic(null)
    setActiveSubject(null)
    setActiveUserBook(null)
    navigateRoute('home')
  }

  const openLibrary = () => {
    navigateRoute('library')
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
    rememberSubject(subject)
    transitionView(() => {
      setActiveUserBook(null)
      setActiveSubject(subject)
      setActiveTopic(topic)
    })
  }

  const openLearningSource = (anchor: SourceAnchor) => {
    setLearningSourceJump(anchor)
    if (anchor.sourceKind === 'upload') {
      const book = books.find((candidate) => candidate.id === anchor.sourceId)
      if (book) selectUserBook(book)
      return
    }
    for (const subject of subjects) {
      const topic = subject.topics.find((candidate) => candidate.id === anchor.sourceId)
      if (topic) {
        selectGlobalTopic(topic, subject)
        return
      }
    }
    if (anchor.url) window.open(anchor.url, '_blank', 'noopener,noreferrer')
  }

  const updateInterest = (interest: string) => {
    saveProfile({ interest, gradeLevel: profile.gradeLevel })
  }

  // â”€â”€ User book reader â”€â”€
  if (activeUserBook) {
    return (
      <div className='app-shell gl-premium gl-premium-upload-reader'>
        <a className='skip-link' href='#main-content'>
          Skip to source
        </a>
        <UserBookReader
          sourceJump={learningSourceJump}
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

  // â”€â”€ Kitabi reader (chapter TOC + section reader) â”€â”€
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
          sourceJump={learningSourceJump}
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

  // â”€â”€ Home / Library â”€â”€
  return (
    <div className='app-shell gl-premium gl-home-shell glw-workspace-shell'>
      <a className='skip-link' href='#main-content'>
        Skip to content
      </a>
      <SiteHeader
        profile={profile}
        learnerModel={learnerModel}
        isDark={isDark}
        isLibraryOpen={route === 'library'}
        onSaveProfile={updateInterest}
        onUpdateProfile={saveProfile}
        onToggleDark={toggleDark}
        onHome={goHome}
        onOpenLibrary={openLibrary}
        onOpenLearningSource={openLearningSource}
      />

      {route === 'library' ? (
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
