import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  FlaskConical,
  LibraryBig,
  Pencil,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { KitabiPage } from './components/KitabiPage'
import { OnboardingFlow } from './components/OnboardingFlow'
import { SubjectGrid } from './components/SubjectGrid'
import { useLearnYourWay } from './hooks/useLearnYourWay'
import { useStudentProfile } from './hooks/useStudentProfile'
import { subjects } from './knowledge'
import type { KnowledgeSection, KnowledgeTopic, StudentProfile, Subject } from './types'

interface SiteHeaderProps {
  profile: StudentProfile
  onSaveProfile: (interest: string) => void
  onHome: () => void
}

function SiteHeader({ profile, onSaveProfile, onHome }: SiteHeaderProps) {
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
    </header>
  )
}

interface ActiveKitabiProps {
  topic: KnowledgeTopic
  subject: Subject
  profile: StudentProfile
  onBack: () => void
}

function ActiveKitabi({ topic, subject, profile, onBack }: ActiveKitabiProps) {
  const {
    rewrites,
    loadingSectionId,
    error,
    errorSectionId,
    learn,
    clearRewrite,
  } = useLearnYourWay(topic)

  const handleLearn = (section: KnowledgeSection) => {
    void learn(section, profile)
  }

  return (
    <KitabiPage
      topic={topic}
      subject={subject}
      profile={profile}
      rewrites={rewrites}
      loadingSectionId={loadingSectionId}
      error={error}
      errorSectionId={errorSectionId}
      onLearnYourWay={handleLearn}
      onClearRewrite={clearRewrite}
      onBack={onBack}
    />
  )
}

function App() {
  const { profile, hasProfile, saveProfile } = useStudentProfile()
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null)
  const [activeTopic, setActiveTopic] = useState<KnowledgeTopic | null>(null)

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
  }

  const selectSubject = (subject: Subject) => {
    if (subject.comingSoon) return
    setActiveTopic(null)
    setActiveSubject(subject)
  }

  const updateInterest = (interest: string) => {
    saveProfile({ interest, gradeLevel: profile.gradeLevel })
  }

  return (
    <div className="app-shell">
      <SiteHeader profile={profile} onSaveProfile={updateInterest} onHome={goHome} />

      {!activeSubject && (
        <main className="library-page" id="main-content">
          <section className="library-hero">
            <div className="library-icon" aria-hidden="true">
              <LibraryBig size={24} />
            </div>
            <p className="eyebrow">Your study library</p>
            <h1 className="library-title">What are you learning today?</h1>
            <p className="library-copy">
              Open a subject, choose a topic, and read. Personalize only the explanation
              you need help with.
            </p>
          </section>
          <SubjectGrid subjects={subjects} onSelect={selectSubject} />
        </main>
      )}

      {activeSubject && !activeTopic && (
        <main className="library-page" id="main-content">
          <button type="button" className="library-back" onClick={goHome}>
            <ArrowLeft size={14} aria-hidden="true" />
            All subjects
          </button>
          <section className="topic-library-heading">
            <p className="eyebrow">Choose a Kitabi</p>
            <h1 className="library-title">{activeSubject.title}</h1>
            <p className="library-copy">{activeSubject.description}</p>
          </section>
          <div className="kitabi-grid">
            {activeSubject.topics.map((topic, index) => (
              <button
                type="button"
                className="kitabi-card"
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
              >
                <span className="kitabi-card-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="kitabi-card-copy">
                  <span className="kitabi-card-title">{topic.title}</span>
                  <span className="kitabi-card-subtitle">{topic.subtitle}</span>
                  <span className="kitabi-card-meta">
                    <BookOpenText size={13} aria-hidden="true" />
                    {topic.sections.length} sections
                  </span>
                </span>
                <ChevronRight className="kitabi-card-arrow" size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </main>
      )}

      {activeSubject && activeTopic && (
        <ActiveKitabi
          key={activeTopic.id + '::' + profile.interest}
          topic={activeTopic}
          subject={activeSubject}
          profile={profile}
          onBack={() => setActiveTopic(null)}
        />
      )}

      <footer className="site-footer">
        <div className="footer-mark" aria-hidden="true">
          <FlaskConical size={15} />
        </div>
        <p>Read first. Personalize where it matters.</p>
      </footer>
    </div>
  )
}

export default App
