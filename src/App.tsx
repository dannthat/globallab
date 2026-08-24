import { Dna, FlaskConical, Leaf, LockKeyhole, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { CramView } from './components/CramView'
import { CustomPersonaModal } from './components/CustomPersonaModal'
import { ExplorerView } from './components/ExplorerView'
import { ModeToggle } from './components/ModeToggle'
import { PersonaBar } from './components/PersonaBar'
import { TopicSelector } from './components/TopicSelector'
import { topics } from './data/topics'
import { useCustomPersona } from './hooks/useCustomPersona'
import { useTopicMemory } from './hooks/useTopicMemory'
import type {
  PersonaPreset,
  PersonaSelection,
  StudyMode,
  Topic,
  TopicPreferences,
} from './types'

const TOPIC_PREFERENCES_KEY = 'globallab_topic_prefs'

function readAllPreferences(): TopicPreferences {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.localStorage.getItem(TOPIC_PREFERENCES_KEY)
    return stored ? (JSON.parse(stored) as TopicPreferences) : {}
  } catch {
    return {}
  }
}

function App() {
  const [activeTopic, setActiveTopic] = useState<Topic>(topics[0])
  const [allPreferences, setAllPreferences] = useState<TopicPreferences>(readAllPreferences)
  const { savePreferredMode } = useTopicMemory(activeTopic.id)
  const preferredMode = allPreferences[activeTopic.id]?.preferredMode
  const [mode, setMode] = useState<StudyMode>(() => preferredMode ?? 'explorer')
  const [persona, setPersona] = useState<PersonaSelection>('neutral')
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const {
    result: customResult,
    isLoading,
    error,
    generate,
    clearError,
    reset: resetCustomPersona,
  } = useCustomPersona(activeTopic)

  const closeCustomModal = useCallback(() => {
    if (!isLoading) {
      setIsCustomModalOpen(false)
      clearError()
    }
  }, [clearError, isLoading])

  const handleCustomSubmit = async (interest: string) => {
    const generated = await generate(interest)
    if (!generated) return false
    setPersona('custom')
    return true
  }

  const handlePersonaSelect = (nextPersona: PersonaPreset) => {
    setPersona(nextPersona)
  }

  const handleTopicSelect = (topic: Topic) => {
    if (topic.id === activeTopic.id) return

    setActiveTopic(topic)
    setMode(allPreferences[topic.id]?.preferredMode ?? 'explorer')
    setPersona('neutral')
    setIsCustomModalOpen(false)
    resetCustomPersona()
  }

  const handleSavePreferredMode = (nextMode: StudyMode) => {
    savePreferredMode(nextMode)
    setAllPreferences(readAllPreferences())
  }

  const topicNumber = topics.findIndex((topic) => topic.id === activeTopic.id) + 1

  return (
    <div className="app-shell">
      <header className="site-header">
        <a href="#main-content" className="brand" aria-label="Global Lab home">
          <span className="brand-mark" aria-hidden="true">
            <FlaskConical size={21} strokeWidth={2.2} />
          </span>
          <span>
            <span className="brand-name">Global Lab</span>
            <span className="brand-subtitle">Biology study companion</span>
          </span>
        </a>

        <div className="version-pill">
          <span className="version-dot" aria-hidden="true" />
          Five focused topics · V2
        </div>
      </header>

      <main id="main-content">
        <section className="hero-section">
          <div className="hero-orb hero-orb-one" aria-hidden="true" />
          <div className="hero-orb hero-orb-two" aria-hidden="true" />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <div className="topic-pill">
              <span className="topic-pill-icon" aria-hidden="true">
                <Dna size={15} />
              </span>
              Biology · Topic {String(topicNumber).padStart(2, '0')} of {String(topics.length).padStart(2, '0')}
            </div>
            <h1 className="hero-title">{activeTopic.title}</h1>
            <p className="hero-subtitle">
              {activeTopic.subtitle}. Choose the study mode that meets you where you are today.
            </p>

            <div className="hero-principles" aria-label="Study principles">
              <span>
                <Leaf size={15} aria-hidden="true" />
                Grounded in biology
              </span>
              <span className="principle-divider" aria-hidden="true" />
              <span>
                <Sparkles size={15} aria-hidden="true" />
                Analogies that fit you
              </span>
              <span className="principle-divider" aria-hidden="true" />
              <span>
                <LockKeyhole size={14} aria-hidden="true" />
                Saved on this device
              </span>
            </div>
          </div>
        </section>

        <div className="study-layout">
          <TopicSelector
            topics={topics}
            activeTopic={activeTopic}
            preferences={allPreferences}
            onSelect={handleTopicSelect}
          />

          <section className="study-shell" aria-label={`${activeTopic.title} study space`}>
            <div className="study-toolbar">
              <div>
                <p className="eyebrow">How do you want to learn?</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-stone-900">
                  Pick your pace
                </h2>
              </div>
              <ModeToggle mode={mode} preferredMode={preferredMode} onChange={setMode} />
            </div>

            {mode === 'explorer' && (
              <PersonaBar
                persona={persona}
                customInterest={customResult?.interest}
                onSelect={handlePersonaSelect}
                onCustomClick={() => setIsCustomModalOpen(true)}
              />
            )}

            <div className="study-content">
              {mode === 'cram' ? (
                <CramView
                  topic={activeTopic}
                  isPreferred={preferredMode === 'cram'}
                  onMarkHelpful={() => handleSavePreferredMode('cram')}
                />
              ) : (
                <ExplorerView
                  key={`${activeTopic.id}-${customResult?.interest ?? 'preset'}`}
                  topic={activeTopic}
                  persona={persona}
                  customResult={customResult}
                  isPreferred={preferredMode === 'explorer'}
                  onMarkHelpful={() => handleSavePreferredMode('explorer')}
                />
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-mark" aria-hidden="true">
          <FlaskConical size={15} />
        </div>
        <p>Five topics. Two ways in. Built for real understanding.</p>
      </footer>

      <CustomPersonaModal
        isOpen={isCustomModalOpen}
        isLoading={isLoading}
        error={error}
        onClose={closeCustomModal}
        onSubmit={handleCustomSubmit}
        onClearError={clearError}
      />
    </div>
  )
}

export default App
