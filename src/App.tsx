import { Dna, FlaskConical, Leaf, LockKeyhole, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { CramView } from './components/CramView'
import { CustomPersonaModal } from './components/CustomPersonaModal'
import { ExplorerView } from './components/ExplorerView'
import { ModeToggle } from './components/ModeToggle'
import { PersonaBar } from './components/PersonaBar'
import { cellularRespiration } from './data/topics'
import { useCustomPersona } from './hooks/useCustomPersona'
import { useTopicMemory } from './hooks/useTopicMemory'
import type { PersonaPreset, PersonaSelection, StudyMode } from './types'

function App() {
  const topic = cellularRespiration
  const { preferredMode, savePreferredMode } = useTopicMemory(topic.id)
  const [mode, setMode] = useState<StudyMode>(() => preferredMode ?? 'explorer')
  const [persona, setPersona] = useState<PersonaSelection>('neutral')
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const { result: customResult, isLoading, error, generate, clearError } = useCustomPersona(topic)

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
          One focused topic · V1
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
              Biology · Energy pathways
            </div>
            <h1 className="hero-title">Cellular Respiration &amp; ATP Synthesis</h1>
            <p className="hero-subtitle">{topic.subtitle}. Choose the study mode that meets you where you are today.</p>

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

        <section className="study-shell" aria-label="Cellular respiration study space">
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
                topic={topic}
                isPreferred={preferredMode === 'cram'}
                onMarkHelpful={() => savePreferredMode('cram')}
              />
            ) : (
              <ExplorerView
                key={`${topic.id}-${customResult?.interest ?? 'preset'}`}
                topic={topic}
                persona={persona}
                customResult={customResult}
                isPreferred={preferredMode === 'explorer'}
                onMarkHelpful={() => savePreferredMode('explorer')}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-mark" aria-hidden="true">
          <FlaskConical size={15} />
        </div>
        <p>One topic. Two ways in. Built for real understanding.</p>
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
