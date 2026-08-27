import katex from 'katex'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { LearningCompanion } from './LearningCompanion'
import { PreferenceSuggestionCard } from './PreferenceSuggestionCard'
import type { UseCompanionSessionResult } from '../hooks/useCompanionSession'
import type { StudentProfile, UserBook } from '../types'
import type { useLearnerModel } from '../hooks/useLearnerModel'

export interface CompanionPanelProps extends UseCompanionSessionResult {
  book: UserBook
  profile: StudentProfile
  previewKind: string
  focusedPage: number
  learnerModel: ReturnType<typeof useLearnerModel>
}

export function CompanionPanel({
  profile,
  previewKind,
  focusedPage,
  learnerModel,
  activeArtifact,
  activeSourceContext,
  companionMode,
  isCompanionLoading,
  lensError,
  setIsLensOpen,
  setSelectedQuizOption,
  quizSubmitted,
  setQuizSubmitted,
  quizRevealed,
  setQuizRevealed,
  handwritingPrompt,
  setHandwritingPrompt,
  isHandwritingPromptOpen,
  setIsHandwritingPromptOpen,
  localOcrStatus,
  companionQuiz,
  runCompanion,
  handleManualPromptSubmit,
}: CompanionPanelProps) {
  const { recordHelpful, recordQuiz, acceptSuggestion, notNow, neverSuggest, pendingSuggestions } = learnerModel

  return (
    <div className="lc-card ubr-companion-inner">
      {/* Amber accent bar */}
      <div className="lc-accent-bar" aria-hidden="true" />

      <div className="lc-header">
        <div className="lc-eyebrow-row">
          <span className="lc-eyebrow">
            {previewKind === 'pdf' ? 'Page ' + focusedPage : 'Focused source'}
          </span>
          <strong className="lc-lens-label">Lens: {profile.interest}</strong>
        </div>
      </div>

      {activeArtifact && (
        <div className="ubr-provider-badge">
          {activeArtifact.provider === 'gemini'
            ? '✦ AI · via GlobalLab'
            : '⬡ Local · stays in your browser'}
        </div>
      )}

      {localOcrStatus && (
        <div className='ubr-lens-loading' role='status' aria-live='polite'>
          <span>{localOcrStatus}</span>
        </div>
      )}
      {!activeSourceContext && isCompanionLoading && (
        <div className="ubr-lens-loading" aria-live="polite">
          <Loader2 size={20} className="ubr-spinner" aria-hidden="true" />
          <span>Reading only the focused source context…</span>
        </div>
      )}
      {!activeSourceContext && lensError && !isHandwritingPromptOpen && (
        <div className="ubr-lens-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" /><p>{lensError}</p>
          <button type="button" onClick={() => setIsLensOpen(false)}>Dismiss</button>
        </div>
      )}
      {!activeSourceContext && isHandwritingPromptOpen && (
        <div className="ubr-handwriting-card animate-reveal" role="region" aria-label="Manual concept input">
          <div className="ubr-handwriting-header">
            <Sparkles size={16} aria-hidden="true" />
            <strong>Handwritten or Visual Source</strong>
          </div>
          <p className="ubr-handwriting-copy">
            {lensError || 'On-device OCR is best suited for printed text.'} Type a concept from this page to explain it with your {profile.interest} lens:
          </p>
          <form
            className="ubr-handwriting-form"
            onSubmit={(e) => {
              e.preventDefault()
              void handleManualPromptSubmit()
            }}
          >
            <input
              type="text"
              className="ubr-handwriting-input"
              placeholder="e.g. directed graph adjacency, in-degree"
              value={handwritingPrompt}
              onChange={(e) => setHandwritingPrompt(e.target.value)}
              autoFocus
            />
            <div className="ubr-handwriting-actions">
              <button
                type="button"
                className="ubr-handwriting-cancel"
                onClick={() => {
                  setIsHandwritingPromptOpen(false)
                  setIsLensOpen(false)
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ubr-handwriting-submit"
                disabled={!handwritingPrompt.trim() || isCompanionLoading}
              >
                {isCompanionLoading ? 'Explaining…' : 'Explain with my lens'}
              </button>
            </div>
          </form>
        </div>
      )}
      {activeSourceContext && (
        <>
          {activeSourceContext.parsedMath && (
            <div className="ubr-detected-formula-strip animate-reveal" role="region" aria-label="Detected formula">
              <div className="ubr-detected-formula-header">
                <span className="ubr-badge ubr-badge-vision">Math Vision</span>
                <strong>{activeSourceContext.parsedMath.topic}</strong>
              </div>
              {activeSourceContext.parsedMath.theoremLatex && (
                <div
                  className="ubr-detected-formula-math"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(activeSourceContext.parsedMath.theoremLatex, {
                      displayMode: true,
                      throwOnError: false,
                    }),
                  }}
                />
              )}
              {activeSourceContext.parsedMath.stepsLatex.length > 0 && (
                <div className="ubr-detected-formula-steps">
                  {activeSourceContext.parsedMath.stepsLatex.map((step, index) => (
                    <div
                      key={`step-${index}`}
                      className="ubr-detected-step-line"
                      dangerouslySetInnerHTML={{
                        __html: katex.renderToString(step, {
                          displayMode: false,
                          throwOnError: false,
                        }),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <LearningCompanion
            sourceAnchor={activeSourceContext.anchor}
            interest={profile.interest}
            mode={activeArtifact?.mode ?? companionMode}
            title={activeArtifact?.title ?? 'Personalized support from this source'}
            content={activeArtifact?.content ?? null}
            limits={activeArtifact?.limitations ?? ''}
            isLoading={isCompanionLoading}
            error={lensError}
            quiz={companionQuiz}
            onAction={(mode) => void runCompanion(mode)}
            onOutcome={(outcome) => {
              recordHelpful(
                activeSourceContext.anchor,
                activeArtifact?.mode ?? companionMode,
                outcome === 'successful',
              )
            }}
            onSelectQuizOption={setSelectedQuizOption}
            onSubmitQuiz={(optionId) => {
              const selected = Number.parseInt(optionId, 10)
              const activeQuiz = activeArtifact?.quiz
              const score = activeQuiz && selected === activeQuiz.correctIndex ? 1 : 0
              setSelectedQuizOption(optionId)
              setQuizSubmitted(true)
              setQuizRevealed(false)
              recordQuiz(
                activeSourceContext.anchor,
                score,
                1,
                activeArtifact?.mode ?? companionMode,
              )
            }}
            onRevealQuiz={() => {
              if (!quizSubmitted && !quizRevealed) {
                recordQuiz(
                  activeSourceContext.anchor,
                  0,
                  1,
                  activeArtifact?.mode ?? companionMode,
                )
              }
              setQuizRevealed(true)
            }}
            onRetry={() => void runCompanion(companionMode, true)}
            onDismiss={() => setIsLensOpen(false)}
          />
          {pendingSuggestions[0] && (
            <PreferenceSuggestionCard
              suggestion={pendingSuggestions[0]}
              onApply={(suggestion) => acceptSuggestion(suggestion.id)}
              onNotNow={(suggestion) => notNow(suggestion.id)}
              onNeverSuggest={(suggestion) => neverSuggest(suggestion.id)}
            />
          )}
        </>
      )}
    </div>
  )
}
